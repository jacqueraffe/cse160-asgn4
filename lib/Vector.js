// NOTE TO GRADER: created with the help of AI prompt:
// Make a Camera class using gl.lookAt() and WASDQE controls.
// which added some utility methods to this class

/**
  * Constructor of Vector3
  * If opt_src is specified, new vector is initialized by opt_src.
  * @param opt_src source vector(option)
  */
var Vector3 = function(opt_src) {
   var v = new Float32Array(3);
   if (opt_src && typeof opt_src === 'object') {
     v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2];
   }
   this.elements = v;
 }
 /**
  * Set vector value.
  * @param src source vector
  * @return this
  */
 Vector3.prototype.set = function(src) {
   var v = this.elements;
   var s = src.elements;

   if (s === v) {
     return;
   }

   v[0] = s[0];
   v[1] = s[1];
   v[2] = s[2];

   return this;
 };
 
 /**
   * Normalize.
   * @return this
   */
 Vector3.prototype.normalize = function() {
   var v = this.elements;
   var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
   if(g){
     if(g == 1)
         return this;
    } else {
      v[0] = 0; v[1] = 0; v[2] = 0;
      return this;
    }
    g = 1/g;
    v[0] = c*g; v[1] = d*g; v[2] = e*g;
    return this;
 };

 /**
  * Cross product of two vector3s
  * @param v vector3
  * @param result vector3
  * @return result
  */
 Vector3.cross = function(v1, v2, result) {
    var a = v1.elements;
    var b = v2.elements;
    var res = result.elements;

    res[0] = a[1] * b[2] - a[2] * b[1];
    res[1] = a[2] * b[0] - a[0] * b[2];
    res[2] = a[0] * b[1] - a[1] * b[0];

    return result;
};

/**
 * Add two vectors.
 * @param other The vector to be added.
 * @return this
 */
Vector3.prototype.add = function(other) {
    this.elements[0] += other.elements[0];
    this.elements[1] += other.elements[1];
    this.elements[2] += other.elements[2];
    return this;
};

/**
 * Subtract two vectors.
 * @param other The vector to be subtracted.
 * @return this
 */
Vector3.prototype.sub = function(other) {
    this.elements[0] -= other.elements[0];
    this.elements[1] -= other.elements[1];
    this.elements[2] -= other.elements[2];
    return this;
};
/**
 * Scale vector.
 * @param scalar The scalar value.
 * @return this
 */
Vector3.prototype.scale = function(scalar) {
    this.elements[0] *= scalar;
    this.elements[1] *= scalar;
    this.elements[2] *= scalar;
    return this;
};


 /**
  * Constructor of Vector4
  * If opt_src is specified, new vector is initialized by opt_src.
  * @param opt_src source vector(option)
  */
 var Vector4 = function(opt_src) {
   var v = new Float32Array(4);
   if (opt_src && typeof opt_src === 'object') {
     v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2]; v[3] = opt_src[3];
   }
   this.elements = v;
 }

