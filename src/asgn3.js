// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
// Name: Jacqueline Palevich
// Student email: japalevi@ucsc.edu
// 

// NOTE FOR GRADER:
// # cse160-asgn3
// heavily referenced video playlist. and used Gemini AI studio

// Mine Maze: Try to find all the diamonds in the maze in the shortest time possible!
// game element; walk through diamonds and watch your score go up!
// wow factor: randomly generated maze


var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix*a_Position;
    //gl_Position =  u_GlobalRotateMatrix * u_ModelMatrix*a_Position;

    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  void main() {
  if (u_whichTexture == -2){
    gl_FragColor = u_FragColor;
} else if (u_whichTexture == -1){
    gl_FragColor = vec4(v_UV, 1.0,1.0);
    } else if (u_whichTexture == 0){
    gl_FragColor = texture2D(u_Sampler0, v_UV);
} else {
 gl_FragColor = vec4(1,0.2,0.2,1);
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
let u_ProjectionMatrix;
let u_ViewMatrix;
let g_camera;
let g_seconds;
let g_startTime = performance.now()/1000.0;
let g_map;

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
    logMaze(g_map);
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
  
  // Get the storage location of u_FragColor
 u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
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
  
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  
}

let g_score = 0;
let g_globalAngle = 0;

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
var g_diamonds = [];

function addActionForHtmlUI(){
  document.getElementById('addBlock').onclick = function() {updateBlock(true, g_map);};
  document.getElementById('removeBlock').onclick = function() {updateBlock(false, g_map);};
  document.getElementById("angleSlide").addEventListener("mousemove", function() {g_globalAngle = this.value; renderAllShapes(); });
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
  renderAllShapes();
  requestAnimationFrame(tick);
}

function drawDiamonds(diamonds) {
  var diamond = new Diamond();
  diamond.color = [170/256, 210/255, 229/255, 1.0];
  diamond.textureNum = -2;
  var n = 0;
  for (var d=0; d<diamonds.length; d++){
    diamond.matrix.setIdentity();
    diamond.matrix.translate(diamonds[d][0], 2, diamonds[d][1]);
    diamond.matrix.rotate(g_seconds*30, 0, 1, 0);
    diamond.matrix.translate(0, (Math.cos(g_seconds*Math.PI))*0.2, 0);
    diamond.renderFast();
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
function collectDiamonds(){
  x = Math.floor(g_camera.target.elements[0]+0.5);
  z = Math.floor(g_camera.target.elements[2]+0.5);
  for(var i = 0; i < g_diamonds.length; i++){
    if (g_diamonds[i][0] == x && g_diamonds[i][1] == z){
      g_score +=1
      g_diamonds.splice(i, 1);
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
  
  var viewMat = g_camera.viewMatrix;
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  
  var globalRotMat  = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clearColor(0,0,0,1);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  
  //gl.enable(gl.CULL_FACE);
  //gl.cullFace(gl.BACK);
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
  sky.matrix.scale(50,50,50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.textureNum = 0;
  gl.bindTexture(gl.TEXTURE_2D, g_skyTexture);
  sky.renderFast();
  
  if (g_diamonds.length < 30){
    var x = Math.floor(Math.random() * (32));
    var y = Math.floor(Math.random() * (32));
    if (g_map[y][x] == 0){
      g_diamonds = g_diamonds.concat([[y-16,x-16]]);
    }
  }
  
  collectDiamonds();
  
  drawDiamonds(g_diamonds);

  var duration = performance.now() - startTime;
  sendTextToHTML( " Diamonds collected: " + g_score, "score");
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
