//note to grader; used Gemini to make sphere class
/*
used this prompt:
you are an expert WebGL programmer, here is the code for a class that draws a cube:

(cube code here)

Please write similar code to render a unit sphere. Include longitude and latitude parameters for tessellation
*/

// additionally, asked it to turn the triangles counterclockwise and to do shading.
class Sphere {
   constructor(longitudeBands, latitudeBands) {
       this.type = 'sphere';
       this.color = [1.0, 0.5, 0.0, 1.0]; // Example: Orange color, you can change it
       this.matrix = new Matrix4();
       this.normalMatrix = new Matrix4();
       this.longitudeBands = longitudeBands;
       this.latitudeBands = latitudeBands;
       this.startLongitude = 0;          // Default start longitude, now a property
       this.endLongitude = 2 * Math.PI;   // Default end longitude, now a property
       this.vertices = [];
       this.normals = [];
       this.indices = [];
       this.indexedVertices = [];
       this.indexedNormals = [];
       this.indexedUVs = []; // Add indexedUVs
        this.initSphere();
   }

   initSphere() {
       let vertices = [];
       let normals = [];
       let indices = [];
       let uvs = []; // UV array

       for (let latNumber = 0; latNumber <= this.latitudeBands; latNumber++) {
           let theta = latNumber * Math.PI / this.latitudeBands;
           let sinTheta = Math.sin(theta);
           let cosTheta = Math.cos(theta);

           for (let longNumber = 0; longNumber <= this.longitudeBands; longNumber++) {
               // Modified longitude calculation to use start and end longitude properties
               let phi = this.startLongitude + (longNumber * (this.endLongitude - this.startLongitude) / this.longitudeBands);
               let sinPhi = Math.sin(phi);
               let cosPhi = Math.cos(phi);

               let x = cosPhi * sinTheta;
               let y = sinPhi * sinTheta;
               let z = cosTheta;
               let u = 1 - (longNumber / this.longitudeBands); // Calculate U coordinate
               let v = 1 - (latNumber / this.latitudeBands);   // Calculate V coordinate

               vertices.push(x);
               vertices.push(y);
               vertices.push(z);
               normals.push(x);
               normals.push(y);
               normals.push(z); // For a unit sphere, vertex normal is the same as vertex position
               uvs.push(u);
               uvs.push(v); // Store UV coordinates
           }
       }

       for (let latNumber = 0; latNumber < this.latitudeBands; latNumber++) {
           for (let longNumber = 0; longNumber < this.longitudeBands; longNumber++) {
               let first = (latNumber * (this.longitudeBands + 1)) + longNumber;
               let second = first + this.longitudeBands + 1;

               indices.push(first);
               indices.push(first + 1);
               indices.push(second);

               indices.push(first + 1);
               indices.push(second + 1);
               indices.push(second);
           }
       }
       this.indexedVertices = [];
       this.indexedNormals = [];
       this.indexedUVs = []; // Initialize indexedUVs
       for (let i = 0; i < indices.length; i++) {
           let index = indices[i];
           this.indexedVertices.push(vertices[index * 3 + 1]);
           this.indexedVertices.push(vertices[index * 3]);
           this.indexedVertices.push(vertices[index * 3 + 2]);
           this.indexedNormals.push(normals[index * 3 + 1]);
           this.indexedNormals.push(normals[index * 3]);
           this.indexedNormals.push(normals[index * 3 + 2]);
           this.indexedUVs.push(uvs[index * 2]); // Store indexed UV coordinates
           this.indexedUVs.push(uvs[index * 2 + 1]);
       }
   }
   renderFast() {
       var rgba = this.color;
       this.normalMatrix.setInverseOf(this.matrix).transpose();
       gl.uniform1i(u_whichTexture, this.textureNum);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
       gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
       gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
       drawTriangle3DUVNormal(
           new Float32Array(this.indexedVertices),
           new Float32Array(this.indexedUVs), // Use indexedUVs here
           new Float32Array(this.indexedNormals)
       );
   }
}
