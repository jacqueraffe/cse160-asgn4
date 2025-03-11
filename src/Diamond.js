class Diamond {
   constructor() {
       this.type = 'diamond';
       this.color = [1.0, 1.0, 1.0, 1.0]; // Base color remains white
       this.matrix = new Matrix4();
       this.textureNum = -2; // Color only

       this.diamondVertsXYZ = new Float32Array([
           // ... (vertex data - same as before) ...
            // Top pyramid (vertices listed in counter-clockwise order for front-facing)
           0.0, 1.0, 0.0,  // Top vertex (0)
           1.0, 0.0, 0.0,  // Right vertex (1)
           0.0, 0.0, 1.0,  // Front vertex (2)

           0.0, 1.0, 0.0,  // Top vertex (0)
           0.0, 0.0, 1.0,  // Front vertex (2)
           -1.0, 0.0, 0.0, // Left vertex (3)

           0.0, 1.0, 0.0,  // Top vertex (0)
           -1.0, 0.0, 0.0, // Left vertex (3)
           0.0, 0.0, -1.0, // Back vertex (4)

           0.0, 1.0, 0.0,  // Top vertex (0)
           0.0, 0.0, -1.0, // Back vertex (4)
           1.0, 0.0, 0.0,  // Right vertex (1)

           // Bottom pyramid (vertices listed in counter-clockwise order for front-facing)
           0.0, -1.0, 0.0, // Bottom vertex (5)
           1.0, 0.0, 0.0,  // Right vertex (1)
           0.0, 0.0, 1.0,  // Front vertex (2)

           0.0, -1.0, 0.0, // Bottom vertex (5)
           0.0, 0.0, 1.0,  // Front vertex (2)
           -1.0, 0.0, 0.0, // Left vertex (3)

           0.0, -1.0, 0.0, // Bottom vertex (5)
           -1.0, 0.0, 0.0, // Left vertex (3)
           0.0, 0.0, -1.0, // Back vertex (4)

           0.0, -1.0, 0.0, // Bottom vertex (5)
           0.0, 0.0, -1.0, // Back vertex (4)
           1.0, 0.0, 0.0   // Right vertex (1)
       ]);

       this.diamondVertsUV = new Float32Array([
           // ... (UV data - same as before) ...
           // Top pyramid
           0.5, 1.0,   1.0, 0.0,   0.0, 0.0,
           0.5, 1.0,   0.0, 0.0,   0.0, 1.0,
           0.5, 1.0,   0.0, 1.0,   1.0, 1.0,
           0.5, 1.0,   1.0, 1.0,   1.0, 0.0,
           // Bottom pyramid
           0.5, 0.0,   1.0, 1.0,   0.0, 1.0,
           0.5, 0.0,   0.0, 1.0,   0.0, 0.0,
           0.5, 0.0,   0.0, 0.0,   1.0, 0.0,
           0.5, 0.0,   1.0, 0.0,   1.0, 1.0
       ]);
   }

   render() { // Basic render function still uses uniform color
       var rgba = this.color;
       gl.uniform1i(u_whichTexture, this.textureNum);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
       gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
       drawTriangle3DUV(this.diamondVertsXYZ, this.diamondVertsUV);
   }

   renderFast() {
       gl.uniform1i(u_whichTexture, this.textureNum);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

       let vertices = this.diamondVertsXYZ;
       let uvCoords = this.diamondVertsUV;
       let n = vertices.length / 3;

       for (let i = 0; i < n; i += 3) {
           // Get the y-coordinates of the three vertices of the triangle
           let y1 = vertices[i * 3 + 1];
           let y2 = vertices[(i + 1) * 3 + 1];
           let y3 = vertices[(i + 2) * 3 + 1];

           // Apply slight color variation based on triangle index
           let variationFactor = (i / n) * 1.3; // Vary from 0 to 0.3 as i increases
           let rgba = [
               this.color[0] * (1.0 - variationFactor), // Reduce Red slightly
               this.color[1],                             // Keep Green
               this.color[2],                             // Keep Blue
               this.color[3]
           ];


           gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

           // Draw each triangle with the calculated color
           drawTriangle3DUV(
               vertices.subarray(i * 3 , (i + 3) * 3 ), // Corrected subarray ranges
               uvCoords.subarray(i * 2 , (i + 3) * 2 )   // Corrected subarray ranges
           );
       }
   }
}
