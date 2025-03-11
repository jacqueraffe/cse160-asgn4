class Cube {
   constructor(segments) {
       this.type = 'cube';
       this.color = [1.0, 1.0, 1.0, 1.0];
       this.matrix = new Matrix4();
       this.textureNum = 0;
    
       this.cubeVertsXYZ = new Float32Array([
        // xy0 face
        0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   0.0, 1.0, 0.0,
        0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 1.0, 0.0,
        // xy1
        1.0, 1.0, 1.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
        1.0, 0.0, 1.0,   0.0, 0.0, 1.0,   1.0, 1.0, 1.0,
        // 0yz
        0.0, 1.0, 1.0,   0.0, 0.0, 0.0,   0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,   0.0, 0.0, 0.0,   0.0, 1.0, 1.0,
        // 1yz
        1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 1.0, 0.0,
        1.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0,
        // x0z
        1.0, 0.0, 0.0,   0.0, 0.0, 0.0,   1.0, 0.0, 1.0,
        0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0, 1.0,
        // x1z face
        0.0, 1.0, 1.0,   0.0, 1.0, 0.0,   1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0
       ]);
       
       this.cubeVertsUV = new Float32Array([
        // xy0 face
        0,0,1,1,0,1,
        0,0,1,0,1,1,
        // xy1
        1,1,0,0,0,1,
        1,0,0,0,1,1,
        // 0yz
        1,1,0,0,1,0,
        0,1,0,0,1,1,
        // 1yz
        0,0,1,1,1,0,
        0,0,0,1,1,1,
        // x0z
        1,0,0,0,1,1,
        0,0,0,1,1,1,
        // x1z face
        0,1,0,0,1,1,
        1,1,0,0,1,0
       ]);
       
       this.cubeVertsNormal = new Float32Array([
        0,0,-1, 0,0,-1, 0,0,-1,
            0,0,-1, 0,0,-1, 0,0,-1,
            0,1,0, 0,1,0, 0,1,0,
            0,1,0, 0,1,0, 0,1,0,
            1,0,0, 1,0,0, 1,0,0,
            1,0,0, 1,0,0, 1,0,0,
            -1,0,0, -1,0,0, -1,0,0,
            -1,0,0, -1,0,0, -1,0,0,
            0,-1,0, 0,-1,0, 0,-1,0,
            0,-1,0, 0,-1,0, 0,-1,0,
            0,0,1, 0,0,1, 0,0,1,
            0,0,1, 0,0,1, 0,0,1
     ]);
   }

   renderFast() {
    var rgba = this.color;
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3DUVNormal(this.cubeVertsXYZ, this.cubeVertsUV, this.cubeVertsNormal);
   }
   
   
}
