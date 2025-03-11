// NOTE TO GRADER: created with the help of AI prompt:
// Make a Camera class using gl.lookAt() and WASDQE controls.
var Camera = function(canvas) {
  this.eye = new Vector3([0, 1.75, 2]); // Initial eye position
  this.target = new Vector3([0, 1.75, 0]); // Initial target
  this.up = new Vector3([0, 1, 0]); // Initial up direction
  this.viewMatrix = new Matrix4();
  this.moveSpeed = 0.1; // Speed of movement
  this.lookSpeed = 0.1; // Mouse look sensitivity
  this.mouseLookEnabled = false; // Flag to enable/disable mouse look
  this.lastMouseX = null;
  this.lastMouseY = null;
  this.canvas = canvas;

  this.keys = {
      'w': false,
      'a': false,
      's': false,
      'd': false,
      'q': false,
      'e': false
  };

  document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
          this.keys[key] = true;
      }
  });

  document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
          this.keys[key] = false;
      }
  });

  // Mouse event listeners for mouse look
  this.canvas.addEventListener('mousedown', (event) => {
      this.mouseLookEnabled = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
  });

  document.addEventListener('mouseup', (event) => {
      this.mouseLookEnabled = false;
  });

  document.addEventListener('mousemove', (event) => {
      if (this.mouseLookEnabled) {
          let dx = event.clientX - this.lastMouseX;
          let dy = event.clientY - this.lastMouseY;
          this.rotate(dx, dy);
          this.lastMouseX = event.clientX;
          this.lastMouseY = event.clientY;
      }
  });
};

/**
* Updates the view matrix based on eye, target, and up vectors.
*/
Camera.prototype.updateViewMatrix = function() {
  this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.target.elements[0], this.target.elements[1], this.target.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
  );
};

/**
* Rotates the camera based on mouse movement.
* @param {number} deltaX Mouse movement in X direction.
* @param {number} deltaY Mouse movement in Y direction.
*/
Camera.prototype.rotate = function(deltaX, deltaY) {
  let lookSpeed = this.lookSpeed;

  // Calculate rotation angles based on mouse movement
  let yaw = deltaX * lookSpeed;   // Yaw (horizontal rotation)
  let pitch = -deltaY * lookSpeed; // Pitch (vertical rotation)

  let rotationMatrix = new Matrix4();

  // Yaw rotation around the Y axis (vertical axis)
  rotationMatrix.rotate(yaw, 0, 1, 0);

  // Get the current forward vector
  let forward = new Vector3([
      this.target.elements[0] - this.eye.elements[0],
      this.target.elements[1] - this.eye.elements[1],
      this.target.elements[2] - this.eye.elements[2]
  ]);

  // Rotate the forward vector by yaw
  forward = rotationMatrix.multiplyVector3(forward);

  // Pitch rotation around the right axis (horizontal axis)
  rotationMatrix.setRotate(pitch, 1, 0, 0); // Rotate around X axis for pitch - this is incorrect in world space

  // To pitch correctly, we need to rotate around the *camera's right* axis.
  // We can calculate the right axis from the current forward and up vectors.
  let right = new Vector3();
  Vector3.cross(forward, this.up, right);
  right.normalize();
  rotationMatrix.setRotate(pitch, right.elements[0], right.elements[1], right.elements[2]);

  // Apply pitch rotation to the forward vector (after yaw rotation)
  forward = rotationMatrix.multiplyVector3(forward);


  // Update the target position based on the rotated forward vector
  this.target.set(this.eye).add(forward);
};




/**
* Moves the camera based on pressed keys (WASDQE) and attempts to slide along walls.
*/
Camera.prototype.move = function() {
  let forward = new Vector3([
      this.target.elements[0] - this.eye.elements[0],
      this.target.elements[1] - this.eye.elements[1],
      this.target.elements[2] - this.eye.elements[2]
  ]).normalize();

  // Project forward vector onto the horizontal plane (y=0)
  // by setting the y component to 0 and re-normalizing
  // Use forward.elements[0] and forward.elements[2] directly for horizontal movement
  let forward_horizontal = new Vector3([
      forward.elements[0], 0, forward.elements[2]
  ]).normalize();


  let right = new Vector3();
  Vector3.cross(forward, this.up, right);
  right.normalize();

  let moveVector = new Vector3([0, 0, 0]);
  let initialMoveVector = new Vector3([0,0,0]); // Store initial move intent for sliding

  // Movement (WASD)
  if (this.keys['w']) {
      moveVector.add(forward_horizontal);
      initialMoveVector.add(forward_horizontal);
  }
  if (this.keys['s']) {
      moveVector.sub(forward_horizontal);
      initialMoveVector.sub(forward_horizontal);
  }
  if (this.keys['a']) {
      moveVector.sub(right);
      initialMoveVector.sub(right);
  }
  if (this.keys['d']) {
      moveVector.add(right);
      initialMoveVector.add(right);
  }


  // Panning (QE - Horizontal Rotation) - Consider removing or modifying panning with mouse look
  if (this.keys['q']) { // Pan Left (Q key pans left - rotate)
      let panRotationMatrix = new Matrix4();
      panRotationMatrix.setRotate(2, 0, 1, 0); // Rotate 1 degree around Y axis for pan left

      let currentForward = new Vector3([
          this.target.elements[0] - this.eye.elements[0],
          this.target.elements[1] - this.eye.elements[1],
          this.target.elements[2] - this.eye.elements[2]
      ]);

      let rotatedForward = panRotationMatrix.multiplyVector3(currentForward);
      rotatedForward.normalize();

      let currentDistance = Math.sqrt(
          currentForward.elements[0] * currentForward.elements[0] +
          currentForward.elements[1] * currentForward.elements[1] +
          currentForward.elements[2] * currentForward.elements[2]
      );

      this.target.set(this.eye); // Set target to eye temporarily
      this.target.add(rotatedForward.scale(currentDistance)); // Move target along rotated forward
  }
  if (this.keys['e']) { // Pan Right (E key pans right - rotate)
      let panRotationMatrix = new Matrix4();
      panRotationMatrix.setRotate(-2, 0, 1, 0); // Rotate -1 degree around Y axis for pan right

      let currentForward = new Vector3([
          this.target.elements[0] - this.eye.elements[0],
          this.target.elements[1] - this.eye.elements[1],
          this.target.elements[2] - this.eye.elements[2]
      ]);

      let rotatedForward = panRotationMatrix.multiplyVector3(currentForward);
      rotatedForward.normalize();

      let currentDistance = Math.sqrt(
          currentForward.elements[0] * currentForward.elements[0] +
          currentForward.elements[1] * currentForward.elements[1] +
          currentForward.elements[2] * currentForward.elements[2]
      );

      this.target.set(this.eye); // Set target to eye temporarily
      this.target.add(rotatedForward.scale(currentDistance)); // Move target along rotated forward
  }


  moveVector.normalize().scale(this.moveSpeed);
  initialMoveVector.normalize().scale(this.moveSpeed); // Normalize initial move vector too

  let newEye = new Vector3().set(this.eye).add(moveVector); // Calculate potential new eye position
};

