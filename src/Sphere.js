//note to grader; used Gemini to make sphere class
/*
used this prompt:
you are an expert WebGL programmer, here is the code for a class that draws a cube:

(cube code here)

Please write similar code to render a unit sphere. Include longitude and latitude parameters for tessellation
*/

// additionally, asked it to turn the triangles counterclockwise and to do shading.
class Sphere {
   constructor(longitudeBands, latitudeBands, sphereToCopy = null) {
       this.type = 'sphere';
       this.color = [1.0, 0.5, 0.0, 1.0]; // Example: Orange color, you can change it
       this.matrix = new Matrix4();
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

       if (sphereToCopy instanceof Sphere) {
           // Deep copy constructor
           this.copy(sphereToCopy);
       } else {
           // Regular constructor
           this.initSphere();
       }
   }

   copy(sphereToCopy) {
       if (!sphereToCopy) { // Add check for null or undefined sphereToCopy
           console.error("Error: sphereToCopy is null or undefined in copy constructor.");
           return; // Or throw an error, or initialize as a default sphere.
       }
       if (!sphereToCopy.matrix || !sphereToCopy.matrix.elements) { // Add check for null or undefined matrix or elements
           console.error("Error: sphereToCopy.matrix or sphereToCopy.matrix.elements is invalid in copy constructor.");
           return; // Or throw an error, or initialize as a default matrix.
       }

       this.type = sphereToCopy.type;
       this.color = [...sphereToCopy.color]; // Create a new array for color
       // Create a new Matrix4 object and set its elements to avoid reference issues.
       this.matrix = new Matrix4(sphereToCopy.matrix);
       this.longitudeBands = sphereToCopy.longitudeBands;
       this.latitudeBands = sphereToCopy.latitudeBands;
       this.startLongitude = sphereToCopy.startLongitude; // Copy startLongitude property
       this.endLongitude = sphereToCopy.endLongitude;     // Copy endLongitude property
       this.vertices = [...sphereToCopy.vertices]; // Create a new array for vertices
       this.normals = [...sphereToCopy.normals]; // Create a new array for normals
       this.indices = [...sphereToCopy.indices]; // Create a new array for indices
       this.indexedVertices = [...sphereToCopy.indexedVertices]; // Create a new array for indexedVertices
       this.indexedNormals = [...sphereToCopy.indexedNormals]; // Create a new array for indexedNormals
       this.indexedUVs = [...sphereToCopy.indexedUVs]; // Copy indexedUVs
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
           this.indexedVertices.push(vertices[index * 3]);
           this.indexedVertices.push(vertices[index * 3 + 1]);
           this.indexedVertices.push(vertices[index * 3 + 2]);
           this.indexedNormals.push(normals[index * 3]);
           this.indexedNormals.push(normals[index * 3 + 1]);
           this.indexedNormals.push(normals[index * 3 + 2]);
           this.indexedUVs.push(uvs[index * 2]); // Store indexed UV coordinates
           this.indexedUVs.push(uvs[index * 2 + 1]);
       }
   }


   render() { // Keep the old render method for now, or you can remove it if you only want renderFast
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

       for (let i = 0; i < this.indexedVertices.length; i += 9) {
           let v1 = [this.indexedVertices[i], this.indexedVertices[i+1], this.indexedVertices[i+2]];
           let v2 = [this.indexedVertices[i+3], this.indexedVertices[i+4], this.indexedVertices[i+5]];
           let v3 = [this.indexedVertices[i+6], this.indexedVertices[i+7], this.indexedVertices[i+8]];

           // Calculate shading factor based on vertex X position (side to side)
           let shadingFactor = (v2[1] + 1) / 2; // Map x from [-1, 1] to [0, 1]

           // Calculate brighter color
           let brighterColor = this.color.map(c => Math.min(c * 0.875, 1.0)); // Increased brightness factor to 1.8

           // Interpolate between original color and brighter color
           let rgba = this.color.map((originalC, index) => originalC + (brighterColor[index] - originalC) * shadingFactor);


           gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
           drawTriangle3D([
               v1[0], v1[1], v1[2],
               v2[0], v2[1], v2[2],
               v3[0], v3[1], v3[2]
           ]);
       }
   }

   renderFast() {
       var rgba = this.color;
       gl.uniform1i(u_whichTexture, this.textureNum);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
       gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
       drawTriangle3DUVNormal(
           new Float32Array(this.indexedVertices),
           new Float32Array(this.indexedUVs), // Use indexedUVs here
           new Float32Array(this.indexedNormals)
       );
   }


   calculateFaceNormal(v1, v2, v3) {
       let a = subtractVectors(v2, v1);
       let b = subtractVectors(v3, v1);
       let normal = crossProduct(a, b);
       return normalizeVector(normal);
   }
}

// Helper vector functions (you might already have these or similar)
function subtractVectors(v1, v2) {
   return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

function crossProduct(v1, v2) {
   return [
       v1[1] * v2[2] - v1[2] * v2[1],
       v1[2] * v2[0] - v1[0] * v2[2],
       v1[0] * v2[1] - v1[1] * v2[0]
   ];
}

function normalizeVector(v) {
   let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
   if (length > 0) {
       return [v[0] / length, v[1] / length, v[2] / length]; // Corrected normalizeVector to return 3 components if needed
   } else {
       return [0, 0, 0]; // Avoid division by zero
   }
}
