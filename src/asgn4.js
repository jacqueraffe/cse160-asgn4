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
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix*a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  varying vec3 v_Normal;
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
let g_camera;
let g_seconds;
let g_startTime = performance.now()/1000.0;
let g_map;
let g_globalAngle = 0;


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    g_camera = new Camera(canvas);
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

function addActionForHtmlUI(){
  document.getElementById("angleSlide").addEventListener("mousemove", function() {g_globalAngle = this.value; renderAllShapes(); });
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
  
  var obj = new Cube();
  obj.color = [100/256, 100/255, 100/255, 1.0];
  obj.matrix.translate(-1, 0, 0);
  obj.textureNum = -3;
  obj.renderFast();

  var duration = performance.now() - startTime;
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
