// NOTE TO GRADER: created with the help of AI prompt:
// Make a Camera class using gl.lookAt() and WASDQE controls.
var Camera = function(canvas, map, eye) {
  this.eye = eye; // Initial eye position
  this.target = new Vector3(eye.elements);
  this.target.elements[0]-=1; // Initial target
  this.up = new Vector3([0, 1, 0]); // Initial up direction
  this.viewMatrix = new Matrix4();
  this.moveSpeed = 0.1; // Speed of movement
  this.lookSpeed = 0.1; // Mouse look sensitivity
  this.mouseLookEnabled = false; // Flag to enable/disable mouse look
  this.lastMouseX = null;
  this.lastMouseY = null;
  this.canvas = canvas;
  this.map = map;

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
* Checks if the proposed new eye position is okay to move to (not inside a wall).
* @param {Vector3} oldEye Current eye position.
* @param {Vector3} newEye Proposed new eye position.
* @return {boolean} True if it's okay to move, false otherwise.
*/
Camera.prototype.okayToMove = function(oldEye, newEye) {
  // Define a margin around the camera to prevent getting too close to walls
  let margin = 0.3; // Adjust this value as needed (smaller value = closer to walls)

  let map_height = this.map.length;
  let map_width = this.map[0].length;

  // Check several points around the new eye position within the margin
  for (let xOffset = -margin; xOffset <= margin; xOffset += margin) {
      for (let zOffset = -margin; zOffset <= margin; zOffset += margin) {
          let checkEye = new Vector3([newEye.elements[0] + xOffset, newEye.elements[1], newEye.elements[2] + zOffset]);

          // Convert world coordinates to map indices
          let mapX = Math.floor(checkEye.elements[0] + map_height / 2);
          let mapZ = Math.floor(checkEye.elements[2] + map_width / 2);

          // Check bounds and map value
          if (mapX >= 0 && mapX < map_width && mapZ >= 0 && mapZ < map_height) {
              if (this.map[mapZ][mapX] > 0) { // Assuming walls are marked with values > 1 (e.g., 2)
                  return false; // Collision with wall in the margin area
              }
          }
      }
  }

  return true; // Okay to move
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

  if (this.okayToMove(this.eye, newEye)) { // Check if move is valid
      this.eye.add(moveVector);
      this.target.add(moveVector);
  } else {
      // Collision detected, attempt sliding

      let slideVector = new Vector3().set(moveVector); // Start with the original move vector

      // Try sliding along X-axis (horizontal slide)
      let tempMoveX = new Vector3().set(slideVector);
      tempMoveX.elements[2] = 0; // Zero out Z component for X-slide attempt
      let tempNewEyeX = new Vector3().set(this.eye).add(tempMoveX);
      if (this.okayToMove(this.eye, tempNewEyeX)) {
          slideVector.set(tempMoveX); // Use X-slide if valid
      } else {
          // X-slide also blocked, try sliding along Z-axis (vertical slide in map context)
          let tempMoveZ = new Vector3().set(moveVector);
          tempMoveZ.elements[0] = 0; // Zero out X component for Z-slide attempt
          let tempNewEyeZ = new Vector3().set(this.eye).add(tempMoveZ);
          if (this.okayToMove(this.eye, tempNewEyeZ)) {
              slideVector.set(tempMoveZ); // Use Z-slide if valid
          } else {
              slideVector.set(new Vector3([0,0,0])); // No slide possible, stop movement completely
          }
      }

      this.eye.add(slideVector);
      this.target.add(slideVector);
  }
};

