class Triangle {
    constructor() {
        this.type = 'triangle';
        this.position = [0.0, 0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.segments = 0;
    }
 }
  
  var g_vertexBuffer=null;
  var g_uvBuffer=null;
  var g_normalBuffer=null;
  
 function initTriangle3DUVNormal() {
   g_vertexBuffer = gl.createBuffer();
   if (!g_vertexBuffer) {
     console.log('Failed to create the buffer object');
     return -1;
   }
   gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
   gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(a_Position);   
   
   g_uvBuffer = gl.createBuffer();
     if (!g_uvBuffer) {
         console.log('Failed to create the buffer object');
         return -1;
     }
     gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
     gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_UV);
     
     g_normalBuffer = gl.createBuffer();
     if (!g_normalBuffer) {
       console.log('Failed to create the buffer object');
       return -1;
     }
     gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
     gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_Normal);
 }
  
  
 function drawTriangle3DUVNormal(vertices, uv, normals) {
     var n = vertices.length/3;
     if (g_vertexBuffer == null){
         initTriangle3DUVNormal();
     }
     gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
     gl.drawArrays(gl.TRIANGLES, 0, n);
 
  }
