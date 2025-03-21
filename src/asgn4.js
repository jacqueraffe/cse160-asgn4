// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
// Name: Jacqueline Palevich
// Student email: japalevi@ucsc.edu
// 

// NOTE FOR GRADER:
// # cse160-asgn4
// heavily referenced video playlist. and used Gemini AI studio

var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix*a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix*vec4(a_Normal,1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform bool u_spotLightOn;
  uniform vec3 u_spotLightDirection;
  uniform float u_spotLightInnerLimit;
  uniform float u_spotLightOuterLimit;
  uniform vec3 u_lightColor;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  
  void main() {
  if (u_whichTexture == -3){
    gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
  } else if (u_whichTexture == -2){
    gl_FragColor = u_FragColor;
  } else if (u_whichTexture == -1){
    gl_FragColor = vec4(v_UV, 1.0,1.0);
  } else if (u_whichTexture == 0){
    gl_FragColor = texture2D(u_Sampler0, v_UV);
  } else {
    gl_FragColor = vec4(1,0.2,0.2,1);
  }
  vec3 lightVector = u_lightPos-vec3(v_VertPos);
  float r = length(lightVector)*0.1;
  // N dot L
  vec3 L = normalize(lightVector);
  vec3 N = normalize(v_Normal);
  float nDotL = max(dot(N,L), 0.0);
  vec3 R = reflect(-L, N);
  vec3 E = normalize(u_cameraPos-vec3(v_VertPos));
  float specular = pow(max(dot(E,R), 0.0), 30.0);
  
  vec3 diffuse = vec3(gl_FragColor) * nDotL *0.7;
  vec3 ambient = vec3(gl_FragColor) * 0.3;
  if (u_lightOn){
    if(u_spotLightOn){
      vec3 lightDirection = normalize(u_spotLightDirection);
      float dotFromDirection = dot(-L, -lightDirection);
      float limitRange = u_spotLightInnerLimit - u_spotLightOuterLimit;
      float inLight = clamp((dotFromDirection - u_spotLightOuterLimit) / limitRange, 0.0, 1.0);
      gl_FragColor = vec4(((specular+diffuse)*inLight+ambient)*u_lightColor, 1.0);
    } else {
     gl_FragColor = vec4((specular+diffuse+ambient)*u_lightColor, 1.0);
    }
  }
}`
  
//Global Vars
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_whichTexture;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_lightPos;
let u_cameraPos;
let u_lightColor;
let g_camera;
let g_seconds;
let g_startTime = performance.now()/1000.0;
let g_map;
let g_globalAngle = 0;
let g_score = 0;
let g_normalsOn = false;
let g_animateLight = false;


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    let mazeResult = generateMaze(32, 32);
    g_map = mazeResult.maze;
    const pos = mazeResult.startPosition;
    var eye = new Vector3([pos[1]-16, 1.75, pos[0]-16]);
    //logMaze(g_map);
    g_camera = new Camera(canvas, g_map, eye);
    g_camera.updateViewMatrix();
}

function connectVariablesToGLSL(){
   // Initialize shaders
   if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
 a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }
  
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }
  
   u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
   if (!u_Sampler0) {
       console.log('Failed to get the storage location of u_Sampler0');
       return false;
   }
  
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
 if (!u_whichTexture) {
   console.log('Failed to get the storage location of u_whichTexture');
   return;
 }
 
 u_spotLightDirection = gl.getUniformLocation(gl.program, 'u_spotLightDirection');
 if (!u_spotLightDirection) {
   console.log('Failed to get the storage location of u_spotLightDirection');
   return;
 }
 
 u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }
 
 u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }
  
  u_spotLightInnerLimit = gl.getUniformLocation(gl.program, 'u_spotLightInnerLimit');
  if (!u_spotLightInnerLimit) {
    console.log('Failed to get the storage location of u_spotLightInnerLimit');
    return;
  }
  
  u_spotLightOuterLimit = gl.getUniformLocation(gl.program, 'u_spotLightOuterLimit');
  if (!u_spotLightOuterLimit) {
    console.log('Failed to get the storage location of u_spotLightOuterLimit');
    return;
  }
  
  u_spotLightOn = gl.getUniformLocation(gl.program, 'u_spotLightOn');
  if (!u_spotLightOn) {
    console.log('Failed to get the storage location of u_spotLightOn');
    return;
  }
  
  // Get the storage location of u_FragColor
 u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
 u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
 if (!u_lightOn) {
   console.log('Failed to get the storage location of u_lightOn');
   return;
 }
  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }
  
  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  if (!u_lightColor) {
    console.log('Failed to get the storage location of u_lightColor');
    return;
  }
  
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }
  
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  
}

/*
NOTE TO GRADER: used AI to generate maze generation code with prompt
Write a generateMaze function that takes a height and width and returns a 2D array that is a maze.
The values should be 0 for corridors. The corridors should be 2 wide. The cells that are walls 
should be of value 2. There should be surrounding walls. Write this in javascript.
Also, write a log maze into the function.
*/

function generateMaze(targetHeight, targetWidth) {
  // Calculate adjusted height and width to get close to the target corridor dimensions
  const adjustedHeight = Math.floor(targetHeight / 2); // Roughly half for corridors
  const adjustedWidth = Math.floor(targetWidth / 2);   // Roughly half for corridors

  // Ensure adjusted dimensions are at least 1 to avoid empty maze
  const mazeHeight = Math.max(3, 2 * adjustedHeight + 1); // Ensure odd and at least 3
  const mazeWidth = Math.max(3, 2 * adjustedWidth + 1);   // Ensure odd and at least 3

  // Initialize maze with walls (1) - Changed to 1
  const maze = Array(mazeHeight).fill(null).map(() => Array(mazeWidth).fill(1));
  const corridorCells = []; // Array to store coordinates of corridor cells

  function carvePath(y, x) {
      maze[y][x] = 0; // Mark current cell as corridor
      corridorCells.push([y, x]); // Add corridor cell coordinates

      const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]]; // Possible directions to move (step of 2)
      shuffleArray(directions); // Randomize direction order

      for (const [dy, dx] of directions) {
          const nextY = y + dy;
          const nextX = x + dx;

          // Wall check now against 1 - Changed to 1
          if (nextY > 0 && nextY < mazeHeight - 1 && nextX > 0 && nextX < mazeWidth - 1 && maze[nextY][nextX] === 1) {
              maze[y + dy / 2][x + dx / 2] = 0; // Carve path between cells
              corridorCells.push([y + dy / 2, x + dx / 2]); // Add carved path cell as corridor
              carvePath(nextY, nextX); // Recursive call
          }
      }
  }

  // Start carving path from a random cell inside the maze (odd indices to ensure corridors are 2 wide)
  const startY = 1 + 2 * Math.floor(Math.random() * adjustedHeight);
  const startX = 1 + 2 * Math.floor(Math.random() * adjustedWidth);

  carvePath(startY, startX);

  // Select a random starting position from the corridor cells
  const startIndex = Math.floor(Math.random() * corridorCells.length);
  const startPosition = corridorCells[startIndex];

  return { maze, startPosition };
}

// Helper function to shuffle array (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

function logMaze(maze) {
  for (let y = 0; y < maze.length; y++) {
      let rowStr = "";
      for (let x = 0; x < maze[y].length; x++) {
          // Wall check now against 1 in logMaze too - Updated logMaze for clarity
          rowStr += maze[y][x] === 0 ? "  " : "* ";
      }
      console.log(rowStr);
  }
}

// x, z
var g_pearls = [];
let g_lightPos = [0,3,-2];
let g_lightColor = [1, 1, 1];
let g_lightOn = true;
let g_spotLightOn = false;
let g_spotLightDirection = [1, 1, 1];
let g_spotLightInnerLimit = 10;
let g_spotLightOuterLimit = 20;

function addActionForHtmlUI(){
  document.getElementById('addBlock').onclick = function() {updateBlock(true, g_map);};
  document.getElementById('removeBlock').onclick = function() {updateBlock(false, g_map);};
  document.getElementById('lightOn').onclick = function() {g_lightOn = true;};
  document.getElementById('lightOff').onclick = function() {g_lightOn = false;};
  document.getElementById('animateLightOn').onclick = function() {g_animateLight = true;};
  document.getElementById('animateLightOff').onclick = function() {g_animateLight = false;};
  document.getElementById('normalsOn').onclick = function() {g_normalsOn = true;};
  document.getElementById('normalsOff').onclick = function() {g_normalsOn = false;};
  document.getElementById('spotLightOn').onclick = function() {g_spotLightOn = true;};
  document.getElementById('spotLightOff').onclick = function() {g_spotLightOn = false;};
  document.getElementById("spotLightInnerLimitSlide").addEventListener("mousemove", function() {g_spotLightInnerLimit = this.value; renderAllShapes(); });
  document.getElementById("spotLightOuterLimitSlide").addEventListener("mousemove", function() {g_spotLightOuterLimit = this.value; renderAllShapes(); });
  document.getElementById("spotLightSlideX").addEventListener("mousemove", function() {g_spotLightDirection[0] = this.value/100;renderAllShapes(); });
  document.getElementById("spotLightSlideY").addEventListener("mousemove", function() {g_spotLightDirection[1] = this.value/100;renderAllShapes(); });
  document.getElementById("spotLightSlideZ").addEventListener("mousemove", function() {g_spotLightDirection[2] = this.value/100;renderAllShapes(); });
  document.getElementById("angleSlide").addEventListener("mousemove", function() {g_globalAngle = this.value; renderAllShapes(); });
  document.getElementById("lightSlideX").addEventListener("mousemove", function() {g_lightPos[0] = this.value/100;renderAllShapes(); });
  document.getElementById("lightSlideY").addEventListener("mousemove", function() {g_lightPos[1] = this.value/100;renderAllShapes(); });
  document.getElementById("lightSlideZ").addEventListener("mousemove", function() {g_lightPos[2] = this.value/100;renderAllShapes(); });
  document.getElementById("lightSlideRed").addEventListener("mousemove", function() {g_lightColor[0] = this.value/255; renderAllShapes(); });
  document.getElementById("lightSlideGreen").addEventListener("mousemove", function() {g_lightColor[1]= this.value/255; renderAllShapes(); });
  document.getElementById("lightSlideBlue").addEventListener("mousemove", function() {g_lightColor[2] = this.value/255; renderAllShapes(); });
}

function updateBlock(adding, map){
  var x = Math.floor(g_camera.target.elements[0])+16;
  var z = Math.floor(g_camera.target.elements[2])+16;
  if(z<0 || z >= map.length || x<0 || x >= map[0].length){
    return;
  }
  if (adding){
    map[z][x] +=1;
  } else {
    if (map[z][x] == 0){
      return;
    }
    map[z][x] -= 1;
  }
}

var g_skyTexture;
var g_groundTexture;
var g_wallTexture;

function initTextures(){
  g_skyTexture = textureHelper("sky.jpg");
  g_groundTexture = textureHelper("ground.jpeg");
  g_wallTexture = textureHelper("wall.jpeg");
  return true;
}

function textureHelper(fileName){
  var image = new Image();  // Create the image object
  if (!image) {
      console.log('Failed to create the image object');
      return null;
  }
  var texture = gl.createTexture();
  if (!texture) {
      console.log('Failed to create the texture object');
      return null;
  }
  image.onload = function(){ sendTextureToGLSL(image, texture); };
  image.src = fileName;
  return texture;
}

function sendTextureToGLSL(image, texture){
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function main() {
  setupWebGL();  
  connectVariablesToGLSL();
  addActionForHtmlUI();
  initTextures();
  requestAnimationFrame(tick);
}


function tick() {
  g_camera.move(); // Update camera position based on keys
  g_camera.updateViewMatrix();
  g_seconds = performance.now()/1000.0-g_startTime;
  animation();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function animation(){
  if(g_animateLight){
    g_lightPos[0] = Math.cos(g_seconds)*16;
  }
}

function drawPearls(pearls) {
  var pearl = new Sphere(20, 20);
  var cube = new Cube();
  if (g_normalsOn){
    pearl.textureNum = -3;
    cube.textureNum = -3;
  } else {
    pearl.color = [170/256, 210/255, 229/255, 1.0];
    cube.color = [170/256, 210/255, 229/255, 1.0];
    pearl.textureNum = -2;
    cube.textureNum = -2;
  }
  var n = 0;
  for (var d=0; d<pearls.length; d++){
    if (d%2 == 0){
      pearl.matrix.setIdentity();
      pearl.matrix.translate(pearls[d][0], 2, pearls[d][1]);
      pearl.matrix.rotate(g_seconds*30, 0, 1, 0);
      pearl.matrix.translate(0, (Math.cos(g_seconds*Math.PI))*0.2, 0);
      pearl.renderFast();
    } else {
      cube.matrix.setIdentity();
      cube.matrix.translate(pearls[d][0], 2, pearls[d][1]);
      cube.matrix.rotate(g_seconds*30, 0, 1, 0);
      cube.matrix.translate(0, (Math.cos(g_seconds*Math.PI))*0.2, 0);
      cube.renderFast();
    }
  }
}

function drawMap(map) {
    gl.bindTexture(gl.TEXTURE_2D, g_wallTexture);
    var height = map.length;
    var width = map[0].length;
    var body = new Cube();
    body.color = [0.8,1.0,1.0,1.0];
    body.matrix.translate(-height/2, 0, -width/2);
    var n = 0;
    for (var x=0; x<width; x++){
      for (var y=0; y<height; y++){
        for(var z = 0; z < map[y][x]; z++){
          body.matrix.translate(x, z, y);
          body.renderFast();
          body.matrix.translate(-x, -z, -y);
        }
      }
    }
}

function collectPearls(){
  x = Math.floor(g_camera.target.elements[0]+0.5);
  z = Math.floor(g_camera.target.elements[2]+0.5);
  for(var i = 0; i < g_pearls.length; i++){
    if (g_pearls[i][0] == x && g_pearls[i][1] == z){
      g_score +=1
      g_pearls.splice(i, 1);
      return;
    }
  }
}
  
function renderAllShapes(){
  // Clear <canvas>
  var startTime = performance.now();
  var projMat = new Matrix4();
  projMat.setPerspective(30, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  
  gl.uniform3fv(u_spotLightDirection, g_spotLightDirection);
  gl.uniform1f(u_spotLightInnerLimit, Math.cos(g_spotLightInnerLimit*Math.PI/180));
  gl.uniform1f(u_spotLightOuterLimit, Math.cos(g_spotLightOuterLimit*Math.PI/180));
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  var eye = g_camera.eye.elements;
  gl.uniform3f(u_cameraPos, eye[0], eye[1], eye[2]);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform1f(u_lightOn, g_lightOn);
  gl.uniform1f(u_spotLightOn, g_spotLightOn);
  
  var viewMat = g_camera.viewMatrix;
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  
  var globalRotMat  = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clearColor(0,0,0,1);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.enable(gl.DEPTH_TEST);
  
  
  drawMap(g_map);
  var floor = new Cube();
  floor.color = [10/256, 200/255, 10/255, 1.0];
  floor.matrix.scale(32, 0.01, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.textureNum = 0;
  gl.bindTexture(gl.TEXTURE_2D, g_groundTexture);
  floor.renderFast();
  
  var sky = new Cube();
  sky.color = [10/256, 10/255, 100/255, 1.0];
  sky.matrix.translate(0, -0.75, 0);
  sky.matrix.scale(-50,-50,-50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.textureNum = 0;
  gl.bindTexture(gl.TEXTURE_2D, g_skyTexture);
  sky.renderFast();
  
  if (g_pearls.length < 30){
    var x = Math.floor(Math.random() * (32));
    var y = Math.floor(Math.random() * (32));
    if (g_map[y][x] == 0){
      g_pearls = g_pearls.concat([[y-16,x-16]]);
    }
  }
  
  collectPearls();
  drawPearls(g_pearls);
  
  var light = new Cube();
  light.color = g_lightColor;
  light.textureNum = -2;
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.renderFast();

  var duration = performance.now() - startTime;
  sendTextToHTML( " Pearls collected: " + g_score, "score");
  sendTextToHTML( " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
  sendTextToHTML( "target x: " + g_camera.target.elements[0] + " z: " + g_camera.target.elements[2], "targetXZ");
  sendTextToHTML( "eye x: " + g_camera.eye.elements[0] + " z: " + g_camera.eye.elements[2], "eyeXZ");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
