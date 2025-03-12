You are an expert WebGL programmer.
Here are the sources to a project:

source_tree_to_markdown.py
`````python
#!/usr/bin/env python3

import os
import argparse

LANG_MAPPING = {
    ".c": "c",
    ".cc": "cpp",
    ".cpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".h": "cpp",
    ".hpp": "cpp",
    ".html": "html",
    ".java": "java",
    ".js": "javascript",
    ".jsx": "javascript",
    ".kt": "kotlin",
    ".lua": "lua",
    ".m": "objectivec",
    ".md": "markdown",
    ".mm": "objectivec",
    ".php": "php",
    ".pl": "perl",
    ".py": "python",
    ".rb": "ruby",
    ".rs": "rust",
    ".sh": "shell",
    ".sql": "sql",
    ".swift": "swift",
    ".ts": "typescript",
    ".tsx": "typescript",
}


def create_system_prompt(root_dir, output_file, prompt_text):
    """
    Generates a markdown document containing the names and content of source code files
    in the specified root directory and its subdirectories, excluding directories starting with a period.

    Args:
        root_dir: The root directory to search for source code files.
        output_file: The name of the output markdown file.
        prompt_text: The introductory prompt text for the markdown file.
    """

    with open(output_file, "w") as f:
        f.write(f"{prompt_text}\n\n")

        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to prevent os.walk from recursing into directories starting with '.'.
            # I'm looking at you, .git and .venv. Although, TBH .vscode might be handy to send.
            dirs[:] = [d for d in dirs if not d.startswith(".")]

            for filename in files:
                _, ext = os.path.splitext(filename)
                if ext in LANG_MAPPING:
                    filepath = os.path.join(root, filename)
                    relative_filepath = os.path.relpath(filepath, root_dir)

                    f.write(f"{relative_filepath}\n")
                    lang = LANG_MAPPING[ext]
                    # Markdown only requires 3 back-quotes. Using 5 back-quotes allows
                    # 3 back-quotes and 4 back-quotes to appear in the quoted document.
                    f.write(f"`````{lang}\n")

                    try:
                        with open(filepath, "r") as source_file:
                            f.write(source_file.read())
                    except UnicodeDecodeError:
                        f.write(
                            f"--- ERROR: Could not decode file content (non-text file?) ---\n"
                        )
                    except Exception as e:
                        f.write(f"--- ERROR: Could not read file content: {e} ---\n")

                    f.write("\n`````\n\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create a system prompt for an LLM containing code from source files, excluding dot directories."
    )
    parser.add_argument(
        "-o",
        "--output",
        default="initial_prompt.md",
        help="The name of the output markdown file.",
    )
    parser.add_argument(
        "-p",
        "--prompt",
        type=str,
        default="""You are an expert WebGL programmer.
Here are the sources to a project:""",
        help="The introductory prompt text.",
    )
    parser.add_argument(
        "-r", "--root-dir", default=".", help="The root directory of the source code."
    )

    args = parser.parse_args()

    root_dir = os.path.abspath(args.root_dir)  # Ensure root_dir is absolute path
    create_system_prompt(root_dir, args.output, args.prompt)
    print(f"Project source code prompt written to {args.output}")
    
    

`````

index.html
`````html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mine Maze!</title>
  </head>

  <body onload="main()">
    <canvas id="webgl" width="400" height="400">
    Please use a browser that supports "canvas"
    </canvas>
    <p>
      <p> Collect diamonds by walking through them! </p>
      <p id = "score"> XXX </p>
    </p>
      <p id = "numdot"> XXX </p>
      <p id = "targetXZ"> XXX </p>
      <p id = "eyeXZ"> XXX </p>
    <p>
      <button type = "button" id = "addBlock"> Add Block</button>
      <button type = "button" id = "removeBlock"> Removing Block</button>
    </p>
      Camera Angle <input type = "range" min = "0" max = "360" value = "0" class = "slider" id = "angleSlide">
    </p>
    <script src="lib/webgl-utils.js"></script>
    <script src="lib/webgl-debug.js"></script>
    <script src="lib/cuon-utils.js"></script>
    <script src="lib/Vector.js"></script>
    <script src="lib/Matrix4.js"></script>
    <script src="lib/Camera.js"></script>
    
    <script src="src/Triangle.js"></script>
    <script src="src/Cube.js"></script>
    <script src="src/Sphere.js"></script>
    <script src="src/asgn4.js"></script>

  </body>
</html>

`````

README.md
`````markdown
# cse160-asgn2

`````

initial_prompt.md
`````markdown

`````

lib/webgl-utils.js
`````javascript
/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimationFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

   /**
    * Creates the HTLM for a failure message
    * @param {string} canvasContainerId id of container of th
    *        canvas.
    * @return {string} The html.
    */
   var makeFailHTML = function(msg) {
     return '' +
           '<div style="margin: auto; width:500px;z-index:10000;margin-top:20em;text-align:center;">' + msg + '</div>';
     return '' +
       '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
       '<td align="center">' +
       '<div style="display: table-cell; vertical-align: middle;">' +
       '<div style="">' + msg + '</div>' +
       '</div>' +
       '</td></tr></table>';
   };
   
   /**
    * Mesasge for getting a webgl browser
    * @type {string}
    */
   var GET_A_WEBGL_BROWSER = '' +
     'This page requires a browser that supports WebGL.<br/>' +
     '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';
   
   /**
    * Mesasge for need better hardware
    * @type {string}
    */
   var OTHER_PROBLEM = '' +
     "It doesn't appear your computer can support WebGL.<br/>" +
     '<a href="http://get.webgl.org">Click here for more information.</a>';
   
   /**
    * Creates a webgl context. If creation fails it will
    * change the contents of the container of the <canvas>
    * tag to an error message with the correct links for WebGL.
    * @param {Element} canvas. The canvas element to create a
    *     context from.
    * @param {WebGLContextCreationAttirbutes} opt_attribs Any
    *     creation attributes you want to pass in.
    * @param {function:(msg)} opt_onError An function to call
    *     if there is an error during creation.
    * @return {WebGLRenderingContext} The created context.
    */
   var setupWebGL = function(canvas, opt_attribs, opt_onError) {
     function handleCreationError(msg) {
         var container = document.getElementsByTagName("body")[0];
       //var container = canvas.parentNode;
       if (container) {
         var str = window.WebGLRenderingContext ?
              OTHER_PROBLEM :
              GET_A_WEBGL_BROWSER;
         if (msg) {
           str += "<br/><br/>Status: " + msg;
         }
         container.innerHTML = makeFailHTML(str);
       }
     };
   
     opt_onError = opt_onError || handleCreationError;
   
     if (canvas.addEventListener) {
       canvas.addEventListener("webglcontextcreationerror", function(event) {
             opt_onError(event.statusMessage);
           }, false);
     }
     var context = create3DContext(canvas, opt_attribs);
     if (!context) {
       if (!window.WebGLRenderingContext) {
         opt_onError("");
       } else {
         opt_onError("");
       }
     }
   
     return context;
   };
   
   /**
    * Creates a webgl context.
    * @param {!Canvas} canvas The canvas tag to get context
    *     from. If one is not passed in one will be created.
    * @return {!WebGLContext} The created context.
    */
   var create3DContext = function(canvas, opt_attribs) {
     var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
     var context = null;
     for (var ii = 0; ii < names.length; ++ii) {
       try {
         context = canvas.getContext(names[ii], opt_attribs);
       } catch(e) {}
       if (context) {
         break;
       }
     }
     return context;
   }
   
   return {
     create3DContext: create3DContext,
     setupWebGL: setupWebGL
   };
   }();
   
   /**
    * Provides requestAnimationFrame in a cross browser
    * way.
    */
   if (!window.requestAnimationFrame) {
     window.requestAnimationFrame = (function() {
       return window.requestAnimationFrame ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame ||
              window.oRequestAnimationFrame ||
              window.msRequestAnimationFrame ||
              function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000/60);
              };
     })();
   }
   
   /** * ERRATA: 'cancelRequestAnimationFrame' renamed to 'cancelAnimationFrame' to reflect an update to the W3C Animation-Timing Spec. 
    * 
    * Cancels an animation frame request. 
    * Checks for cross-browser support, falls back to clearTimeout. 
    * @param {number}  Animation frame request. */
   if (!window.cancelAnimationFrame) {
     window.cancelAnimationFrame = (window.cancelRequestAnimationFrame ||
                                    window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
                                    window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame ||
                                    window.msCancelAnimationFrame || window.msCancelRequestAnimationFrame ||
                                    window.oCancelAnimationFrame || window.oCancelRequestAnimationFrame ||
                                    window.clearTimeout);
   }

`````

lib/webgl-debug.js
`````javascript
//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

   /**
    * Wrapped logging function.
    * @param {string} msg Message to log.
    */
   var log = function(msg) {
     if (window.console && window.console.log) {
       window.console.log(msg);
     }
   };
   
   /**
    * Which arguements are enums.
    * @type {!Object.<number, string>}
    */
   var glValidEnumContexts = {
   
     // Generic setters and getters
   
     'enable': { 0:true },
     'disable': { 0:true },
     'getParameter': { 0:true },
   
     // Rendering
   
     'drawArrays': { 0:true },
     'drawElements': { 0:true, 2:true },
   
     // Shaders
   
     'createShader': { 0:true },
     'getShaderParameter': { 1:true },
     'getProgramParameter': { 1:true },
   
     // Vertex attributes
   
     'getVertexAttrib': { 1:true },
     'vertexAttribPointer': { 2:true },
   
     // Textures
   
     'bindTexture': { 0:true },
     'activeTexture': { 0:true },
     'getTexParameter': { 0:true, 1:true },
     'texParameterf': { 0:true, 1:true },
     'texParameteri': { 0:true, 1:true, 2:true },
     'texImage2D': { 0:true, 2:true, 6:true, 7:true },
     'texSubImage2D': { 0:true, 6:true, 7:true },
     'copyTexImage2D': { 0:true, 2:true },
     'copyTexSubImage2D': { 0:true },
     'generateMipmap': { 0:true },
   
     // Buffer objects
   
     'bindBuffer': { 0:true },
     'bufferData': { 0:true, 2:true },
     'bufferSubData': { 0:true },
     'getBufferParameter': { 0:true, 1:true },
   
     // Renderbuffers and framebuffers
   
     'pixelStorei': { 0:true, 1:true },
     'readPixels': { 4:true, 5:true },
     'bindRenderbuffer': { 0:true },
     'bindFramebuffer': { 0:true },
     'checkFramebufferStatus': { 0:true },
     'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
     'framebufferTexture2D': { 0:true, 1:true, 2:true },
     'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
     'getRenderbufferParameter': { 0:true, 1:true },
     'renderbufferStorage': { 0:true, 1:true },
   
     // Frame buffer operations (clear, blend, depth test, stencil)
   
     'clear': { 0:true },
     'depthFunc': { 0:true },
     'blendFunc': { 0:true, 1:true },
     'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
     'blendEquation': { 0:true },
     'blendEquationSeparate': { 0:true, 1:true },
     'stencilFunc': { 0:true },
     'stencilFuncSeparate': { 0:true, 1:true },
     'stencilMaskSeparate': { 0:true },
     'stencilOp': { 0:true, 1:true, 2:true },
     'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },
   
     // Culling
   
     'cullFace': { 0:true },
     'frontFace': { 0:true },
   };
   
   /**
    * Map of numbers to names.
    * @type {Object}
    */
   var glEnums = null;
   
   /**
    * Initializes this module. Safe to call more than once.
    * @param {!WebGLRenderingContext} ctx A WebGL context. If
    *    you have more than one context it doesn't matter which one
    *    you pass in, it is only used to pull out constants.
    */
   function init(ctx) {
     if (glEnums == null) {
       glEnums = { };
       for (var propertyName in ctx) {
         if (typeof ctx[propertyName] == 'number') {
           glEnums[ctx[propertyName]] = propertyName;
         }
       }
     }
   }
   
   /**
    * Checks the utils have been initialized.
    */
   function checkInit() {
     if (glEnums == null) {
       throw 'WebGLDebugUtils.init(ctx) not called';
     }
   }
   
   /**
    * Returns true or false if value matches any WebGL enum
    * @param {*} value Value to check if it might be an enum.
    * @return {boolean} True if value matches one of the WebGL defined enums
    */
   function mightBeEnum(value) {
     checkInit();
     return (glEnums[value] !== undefined);
   }
   
   /**
    * Gets an string version of an WebGL enum.
    *
    * Example:
    *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
    *
    * @param {number} value Value to return an enum for
    * @return {string} The string version of the enum.
    */
   function glEnumToString(value) {
     checkInit();
     var name = glEnums[value];
     return (name !== undefined) ? name :
         ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
   }
   
   /**
    * Returns the string version of a WebGL argument.
    * Attempts to convert enum arguments to strings.
    * @param {string} functionName the name of the WebGL function.
    * @param {number} argumentIndx the index of the argument.
    * @param {*} value The value of the argument.
    * @return {string} The value as a string.
    */
   function glFunctionArgToString(functionName, argumentIndex, value) {
     var funcInfo = glValidEnumContexts[functionName];
     if (funcInfo !== undefined) {
       if (funcInfo[argumentIndex]) {
         return glEnumToString(value);
       }
     }
     return value.toString();
   }
   
   /**
    * Given a WebGL context returns a wrapped context that calls
    * gl.getError after every command and calls a function if the
    * result is not gl.NO_ERROR.
    *
    * @param {!WebGLRenderingContext} ctx The webgl context to
    *        wrap.
    * @param {!function(err, funcName, args): void} opt_onErrorFunc
    *        The function to call when gl.getError returns an
    *        error. If not specified the default function calls
    *        console.log with a message.
    */
   function makeDebugContext(ctx, opt_onErrorFunc) {
     init(ctx);
     opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
           // apparently we can't do args.join(",");
           var argStr = "";
           for (var ii = 0; ii < args.length; ++ii) {
             argStr += ((ii == 0) ? '' : ', ') +
                 glFunctionArgToString(functionName, ii, args[ii]);
           }
           log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
               "(" + argStr + ")");
         };
   
     // Holds booleans for each GL error so after we get the error ourselves
     // we can still return it to the client app.
     var glErrorShadow = { };
   
     // Makes a function that calls a WebGL function and then calls getError.
     function makeErrorWrapper(ctx, functionName) {
       return function() {
         var result = ctx[functionName].apply(ctx, arguments);
         var err = ctx.getError();
         if (err != 0) {
           glErrorShadow[err] = true;
           opt_onErrorFunc(err, functionName, arguments);
         }
         return result;
       };
     }
   
     // Make a an object that has a copy of every property of the WebGL context
     // but wraps all functions.
     var wrapper = {};
     for (var propertyName in ctx) {
       if (typeof ctx[propertyName] == 'function') {
          wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
        } else {
          wrapper[propertyName] = ctx[propertyName];
        }
     }
   
     // Override the getError function with one that returns our saved results.
     wrapper.getError = function() {
       for (var err in glErrorShadow) {
         if (glErrorShadow[err]) {
           glErrorShadow[err] = false;
           return err;
         }
       }
       return ctx.NO_ERROR;
     };
   
     return wrapper;
   }
   
   function resetToInitialState(ctx) {
     var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
     var tmp = ctx.createBuffer();
     ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
     for (var ii = 0; ii < numAttribs; ++ii) {
       ctx.disableVertexAttribArray(ii);
       ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
       ctx.vertexAttrib1f(ii, 0);
     }
     ctx.deleteBuffer(tmp);
   
     var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
     for (var ii = 0; ii < numTextureUnits; ++ii) {
       ctx.activeTexture(ctx.TEXTURE0 + ii);
       ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
       ctx.bindTexture(ctx.TEXTURE_2D, null);
     }
   
     ctx.activeTexture(ctx.TEXTURE0);
     ctx.useProgram(null);
     ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
     ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
     ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
     ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
     ctx.disable(ctx.BLEND);
     ctx.disable(ctx.CULL_FACE);
     ctx.disable(ctx.DEPTH_TEST);
     ctx.disable(ctx.DITHER);
     ctx.disable(ctx.SCISSOR_TEST);
     ctx.blendColor(0, 0, 0, 0);
     ctx.blendEquation(ctx.FUNC_ADD);
     ctx.blendFunc(ctx.ONE, ctx.ZERO);
     ctx.clearColor(0, 0, 0, 0);
     ctx.clearDepth(1);
     ctx.clearStencil(-1);
     ctx.colorMask(true, true, true, true);
     ctx.cullFace(ctx.BACK);
     ctx.depthFunc(ctx.LESS);
     ctx.depthMask(true);
     ctx.depthRange(0, 1);
     ctx.frontFace(ctx.CCW);
     ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
     ctx.lineWidth(1);
     ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
     ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
     ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
     ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
     // TODO: Delete this IF.
     if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
       ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
     }
     ctx.polygonOffset(0, 0);
     ctx.sampleCoverage(1, false);
     ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
     ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
     ctx.stencilMask(0xFFFFFFFF);
     ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
     ctx.viewport(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
     ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);
   
     // TODO: This should NOT be needed but Firefox fails with 'hint'
     while(ctx.getError());
   }
   
   function makeLostContextSimulatingContext(ctx) {
     var wrapper_ = {};
     var contextId_ = 1;
     var contextLost_ = false;
     var resourceId_ = 0;
     var resourceDb_ = [];
     var onLost_ = undefined;
     var onRestored_ = undefined;
     var nextOnRestored_ = undefined;
   
     // Holds booleans for each GL error so can simulate errors.
     var glErrorShadow_ = { };
   
     function isWebGLObject(obj) {
       //return false;
       return (obj instanceof WebGLBuffer ||
               obj instanceof WebGLFramebuffer ||
               obj instanceof WebGLProgram ||
               obj instanceof WebGLRenderbuffer ||
               obj instanceof WebGLShader ||
               obj instanceof WebGLTexture);
     }
   
     function checkResources(args) {
       for (var ii = 0; ii < args.length; ++ii) {
         var arg = args[ii];
         if (isWebGLObject(arg)) {
           return arg.__webglDebugContextLostId__ == contextId_;
         }
       }
       return true;
     }
   
     function clearErrors() {
       var k = Object.keys(glErrorShadow_);
       for (var ii = 0; ii < k.length; ++ii) {
         delete glErrorShdow_[k];
       }
     }
   
     // Makes a function that simulates WebGL when out of context.
     function makeLostContextWrapper(ctx, functionName) {
       var f = ctx[functionName];
       return function() {
         // Only call the functions if the context is not lost.
         if (!contextLost_) {
           if (!checkResources(arguments)) {
             glErrorShadow_[ctx.INVALID_OPERATION] = true;
             return;
           }
           var result = f.apply(ctx, arguments);
           return result;
         }
       };
     }
   
     for (var propertyName in ctx) {
       if (typeof ctx[propertyName] == 'function') {
          wrapper_[propertyName] = makeLostContextWrapper(ctx, propertyName);
        } else {
          wrapper_[propertyName] = ctx[propertyName];
        }
     }
   
     function makeWebGLContextEvent(statusMessage) {
       return {statusMessage: statusMessage};
     }
   
     function freeResources() {
       for (var ii = 0; ii < resourceDb_.length; ++ii) {
         var resource = resourceDb_[ii];
         if (resource instanceof WebGLBuffer) {
           ctx.deleteBuffer(resource);
         } else if (resource instanceof WebctxFramebuffer) {
           ctx.deleteFramebuffer(resource);
         } else if (resource instanceof WebctxProgram) {
           ctx.deleteProgram(resource);
         } else if (resource instanceof WebctxRenderbuffer) {
           ctx.deleteRenderbuffer(resource);
         } else if (resource instanceof WebctxShader) {
           ctx.deleteShader(resource);
         } else if (resource instanceof WebctxTexture) {
           ctx.deleteTexture(resource);
         }
       }
     }
   
     wrapper_.loseContext = function() {
       if (!contextLost_) {
         contextLost_ = true;
         ++contextId_;
         while (ctx.getError());
         clearErrors();
         glErrorShadow_[ctx.CONTEXT_LOST_WEBGL] = true;
         setTimeout(function() {
             if (onLost_) {
               onLost_(makeWebGLContextEvent("context lost"));
             }
           }, 0);
       }
     };
   
     wrapper_.restoreContext = function() {
       if (contextLost_) {
         if (onRestored_) {
           setTimeout(function() {
               freeResources();
               resetToInitialState(ctx);
               contextLost_ = false;
               if (onRestored_) {
                 var callback = onRestored_;
                 onRestored_ = nextOnRestored_;
                 nextOnRestored_ = undefined;
                 callback(makeWebGLContextEvent("context restored"));
               }
             }, 0);
         } else {
           throw "You can not restore the context without a listener"
         }
       }
     };
   
     // Wrap a few functions specially.
     wrapper_.getError = function() {
       if (!contextLost_) {
         var err;
         while (err = ctx.getError()) {
           glErrorShadow_[err] = true;
         }
       }
       for (var err in glErrorShadow_) {
         if (glErrorShadow_[err]) {
           delete glErrorShadow_[err];
           return err;
         }
       }
       return ctx.NO_ERROR;
     };
   
     var creationFunctions = [
       "createBuffer",
       "createFramebuffer",
       "createProgram",
       "createRenderbuffer",
       "createShader",
       "createTexture"
     ];
     for (var ii = 0; ii < creationFunctions.length; ++ii) {
       var functionName = creationFunctions[ii];
       wrapper_[functionName] = function(f) {
         return function() {
           if (contextLost_) {
             return null;
           }
           var obj = f.apply(ctx, arguments);
           obj.__webglDebugContextLostId__ = contextId_;
           resourceDb_.push(obj);
           return obj;
         };
       }(ctx[functionName]);
     }
   
     var functionsThatShouldReturnNull = [
       "getActiveAttrib",
       "getActiveUniform",
       "getBufferParameter",
       "getContextAttributes",
       "getAttachedShaders",
       "getFramebufferAttachmentParameter",
       "getParameter",
       "getProgramParameter",
       "getProgramInfoLog",
       "getRenderbufferParameter",
       "getShaderParameter",
       "getShaderInfoLog",
       "getShaderSource",
       "getTexParameter",
       "getUniform",
       "getUniformLocation",
       "getVertexAttrib"
     ];
     for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
       var functionName = functionsThatShouldReturnNull[ii];
       wrapper_[functionName] = function(f) {
         return function() {
           if (contextLost_) {
             return null;
           }
           return f.apply(ctx, arguments);
         }
       }(wrapper_[functionName]);
     }
   
     var isFunctions = [
       "isBuffer",
       "isEnabled",
       "isFramebuffer",
       "isProgram",
       "isRenderbuffer",
       "isShader",
       "isTexture"
     ];
     for (var ii = 0; ii < isFunctions.length; ++ii) {
       var functionName = isFunctions[ii];
       wrapper_[functionName] = function(f) {
         return function() {
           if (contextLost_) {
             return false;
           }
           return f.apply(ctx, arguments);
         }
       }(wrapper_[functionName]);
     }
   
     wrapper_.checkFramebufferStatus = function(f) {
       return function() {
         if (contextLost_) {
           return ctx.FRAMEBUFFER_UNSUPPORTED;
         }
         return f.apply(ctx, arguments);
       };
     }(wrapper_.checkFramebufferStatus);
   
     wrapper_.getAttribLocation = function(f) {
       return function() {
         if (contextLost_) {
           return -1;
         }
         return f.apply(ctx, arguments);
       };
     }(wrapper_.getAttribLocation);
   
     wrapper_.getVertexAttribOffset = function(f) {
       return function() {
         if (contextLost_) {
           return 0;
         }
         return f.apply(ctx, arguments);
       };
     }(wrapper_.getVertexAttribOffset);
   
     wrapper_.isContextLost = function() {
       return contextLost_;
     };
   
     function wrapEvent(listener) {
       if (typeof(listener) == "function") {
         return listener;
       } else {
         return function(info) {
           listener.handleEvent(info);
         }
       }
     }
   
     wrapper_.registerOnContextLostListener = function(listener) {
       onLost_ = wrapEvent(listener);
     };
   
     wrapper_.registerOnContextRestoredListener = function(listener) {
       if (contextLost_) {
         nextOnRestored_ = wrapEvent(listener);
       } else {
         onRestored_ = wrapEvent(listener);
       }
     }
   
     return wrapper_;
   }
   
   return {
     /**
      * Initializes this module. Safe to call more than once.
      * @param {!WebGLRenderingContext} ctx A WebGL context. If
      *    you have more than one context it doesn't matter which one
      *    you pass in, it is only used to pull out constants.
      */
     'init': init,
   
     /**
      * Returns true or false if value matches any WebGL enum
      * @param {*} value Value to check if it might be an enum.
      * @return {boolean} True if value matches one of the WebGL defined enums
      */
     'mightBeEnum': mightBeEnum,
   
     /**
      * Gets an string version of an WebGL enum.
      *
      * Example:
      *   WebGLDebugUtil.init(ctx);
      *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
      *
      * @param {number} value Value to return an enum for
      * @return {string} The string version of the enum.
      */
     'glEnumToString': glEnumToString,
   
     /**
      * Converts the argument of a WebGL function to a string.
      * Attempts to convert enum arguments to strings.
      *
      * Example:
      *   WebGLDebugUtil.init(ctx);
      *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
      *
      * would return 'TEXTURE_2D'
      *
      * @param {string} functionName the name of the WebGL function.
      * @param {number} argumentIndx the index of the argument.
      * @param {*} value The value of the argument.
      * @return {string} The value as a string.
      */
     'glFunctionArgToString': glFunctionArgToString,
   
     /**
      * Given a WebGL context returns a wrapped context that calls
      * gl.getError after every command and calls a function if the
      * result is not NO_ERROR.
      *
      * You can supply your own function if you want. For example, if you'd like
      * an exception thrown on any GL error you could do this
      *
      *    function throwOnGLError(err, funcName, args) {
      *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
      *            funcName;
      *    };
      *
      *    ctx = WebGLDebugUtils.makeDebugContext(
      *        canvas.getContext("webgl"), throwOnGLError);
      *
      * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
      * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
      *     to call when gl.getError returns an error. If not specified the default
      *     function calls console.log with a message.
      */
     'makeDebugContext': makeDebugContext,
   
     /**
      * Given a WebGL context returns a wrapped context that adds 4
      * functions.
      *
      * ctx.loseContext:
      *   simulates a lost context event.
      *
      * ctx.restoreContext:
      *   simulates the context being restored.
      *
      * ctx.registerOnContextLostListener(listener):
      *   lets you register a listener for context lost. Use instead
      *   of addEventListener('webglcontextlostevent', listener);
      *
      * ctx.registerOnContextRestoredListener(listener):
      *   lets you register a listener for context restored. Use
      *   instead of addEventListener('webglcontextrestored',
      *   listener);
      *
      * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
      */
     'makeLostContextSimulatingContext': makeLostContextSimulatingContext,
   
     /**
      * Resets a context to the initial state.
      * @param {!WebGLRenderingContext} ctx The webgl context to
      *     reset.
      */
     'resetToInitialState': resetToInitialState
   };
   
   }();
   
   
`````

lib/Vector.js
`````javascript
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


`````

lib/Camera.js
`````javascript
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
  
`````

lib/cuon-utils.js
`````javascript
// cuon-utils.js (c) 2012 kanda and matsuda
/**
 * Create a program object and make current
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return true, if the program object was created and successfully made current 
 */
function initShaders(gl, vshader, fshader) {
   var program = createProgram(gl, vshader, fshader);
   if (!program) {
     console.log('Failed to create program');
     return false;
   }
 
   gl.useProgram(program);
   gl.program = program;
 
   return true;
 }
 
 /**
  * Create the linked program object
  * @param gl GL context
  * @param vshader a vertex shader program (string)
  * @param fshader a fragment shader program (string)
  * @return created program object, or null if the creation has failed
  */
 function createProgram(gl, vshader, fshader) {
   // Create shader object
   var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
   var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
   if (!vertexShader || !fragmentShader) {
     return null;
   }
 
   // Create a program object
   var program = gl.createProgram();
   if (!program) {
     return null;
   }
 
   // Attach the shader objects
   gl.attachShader(program, vertexShader);
   gl.attachShader(program, fragmentShader);
 
   // Link the program object
   gl.linkProgram(program);
 
   // Check the result of linking
   var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
   if (!linked) {
     var error = gl.getProgramInfoLog(program);
     console.log('Failed to link program: ' + error);
     gl.deleteProgram(program);
     gl.deleteShader(fragmentShader);
     gl.deleteShader(vertexShader);
     return null;
   }
   return program;
 }
 
 /**
  * Create a shader object
  * @param gl GL context
  * @param type the type of the shader object to be created
  * @param source shader program (string)
  * @return created shader object, or null if the creation has failed.
  */
 function loadShader(gl, type, source) {
   // Create shader object
   var shader = gl.createShader(type);
   if (shader == null) {
     console.log('unable to create shader');
     return null;
   }
 
   // Set the shader program
   gl.shaderSource(shader, source);
 
   // Compile the shader
   gl.compileShader(shader);
 
   // Check the result of compilation
   var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
   if (!compiled) {
     var error = gl.getShaderInfoLog(shader);
     console.log('Failed to compile shader: ' + error);
     gl.deleteShader(shader);
     return null;
   }
 
   return shader;
 }
 
 /** 
  * Initialize and get the rendering for WebGL
  * @param canvas <cavnas> element
  * @param opt_debug flag to initialize the context for debugging
  * @return the rendering context for WebGL
  */
 function getWebGLContext(canvas, opt_debug) {
   // Get the rendering context for WebGL
   var gl = WebGLUtils.setupWebGL(canvas);
   if (!gl) return null;
 
   // if opt_debug is explicitly false, create the context for debugging
   if (arguments.length < 2 || opt_debug) {
     gl = WebGLDebugUtils.makeDebugContext(gl);
   }
 
   return gl;
 }
 
`````

lib/Matrix4.js
`````javascript
// NOTE TO GRADER: created with the help of AI prompt:
// Make a Camera class using gl.lookAt() and WASDQE controls.
// which added some utility methods to this class

// cuon-matrix.js (c) 2012 kanda and matsuda
/**
 * This is a class treating 4x4 matrix.
 * This class contains the function that is equivalent to OpenGL matrix stack.
 * The matrix after conversion is calculated by multiplying a conversion matrix from the right.
 * The matrix is replaced by the calculated result.
 */

/**
 * Constructor of Matrix4
 * If opt_src is specified, new matrix is initialized by opt_src.
 * Otherwise, new matrix is initialized by identity matrix.
 * @param opt_src source matrix(option)
 */
var Matrix4 = function(opt_src) {
   var i, s, d;
   if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
     s = opt_src.elements;
     d = new Float32Array(16);
     for (i = 0; i < 16; ++i) {
       d[i] = s[i];
     }
     this.elements = d;
   } else {
     this.elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
   }
 };

 /**
  * Set the identity matrix.
  * @return this
  */
 Matrix4.prototype.setIdentity = function() {
   var e = this.elements;
   e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
   e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
   e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
   e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
   return this;
 };

 /**
  * Copy matrix.
  * @param src source matrix
  * @return this
  */
 Matrix4.prototype.set = function(src) {
   var i, s, d;

   s = src.elements;
   d = this.elements;

   if (s === d) {
     return;
   }

   for (i = 0; i < 16; ++i) {
     d[i] = s[i];
   }

   return this;
 };

 /**
  * Multiply the matrix from the right.
  * @param other The multiply matrix
  * @return this
  */
 Matrix4.prototype.concat = function(other) {
   var i, e, a, b, ai0, ai1, ai2, ai3;

   // Calculate e = a * b
   e = this.elements;
   a = this.elements;
   b = other.elements;

   // If e equals b, copy b to temporary matrix.
   if (e === b) {
     b = new Float32Array(16);
     for (i = 0; i < 16; ++i) {
       b[i] = e[i];
     }
   }

   for (i = 0; i < 4; i++) {
     ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
     e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
     e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
     e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
     e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
   }

   return this;
 };
 Matrix4.prototype.multiply = Matrix4.prototype.concat;

 /**
  * Multiply the three-dimensional vector.
  * @param pos  The multiply vector
  * @return The result of multiplication(Float32Array)
  */
 Matrix4.prototype.multiplyVector3 = function(pos) {
   var e = this.elements;
   var p = pos.elements;
   var v = new Vector3();
   var result = v.elements;

   result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[12];
   result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[13];
   result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];

   return v;
 };

 /**
  * Multiply the four-dimensional vector.
  * @param pos  The multiply vector
  * @return The result of multiplication(Float32Array)
  */
 Matrix4.prototype.multiplyVector4 = function(pos) {
   var e = this.elements;
   var p = pos.elements;
   var v = new Vector4();
   var result = v.elements;

   result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + p[3] * e[12];
   result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + p[3] * e[13];
   result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
   result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

   return v;
 };

 /**
  * Transpose the matrix.
  * @return this
  */
 Matrix4.prototype.transpose = function() {
   var e, t;

   e = this.elements;

   t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
   t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
   t = e[ 3];  e[ 3] = e[12];  e[12] = t;
   t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
   t = e[ 7];  e[ 7] = e[13];  e[13] = t;
   t = e[11];  e[11] = e[14];  e[14] = t;

   return this;
 };

 /**
  * Calculate the inverse matrix of specified matrix, and set to this.
  * @param other The source matrix
  * @return this
  */
 Matrix4.prototype.setInverseOf = function(other) {
   var i, s, d, inv, det;

   s = other.elements;
   d = this.elements;
   inv = new Float32Array(16);

   inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
             + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
   inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
             - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
   inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
             + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
   inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
             - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];

   inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
             - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
   inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
             + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
   inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
             - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
   inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
             + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];

   inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
             + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
   inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
             - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
   inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
             + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
   inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
             - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];

   inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
             - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
   inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
             + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
   inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
             - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
   inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
             + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];

   det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
   if (det === 0) {
     return this;
   }

   det = 1 / det;
   for (i = 0; i < 16; i++) {
     d[i] = inv[i] * det;
   }

   return this;
 };

 /**
  * Calculate the inverse matrix of this, and set to this.
  * @return this
  */
 Matrix4.prototype.invert = function() {
   return this.setInverseOf(this);
 };

 /**
  * Set the orthographic projection matrix.
  * @param left The coordinate of the left of clipping plane.
  * @param right The coordinate of the right of clipping plane.
  * @param bottom The coordinate of the bottom of clipping plane.
  * @param top The coordinate of the top top clipping plane.
  * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
  * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
  * @return this
  */
 Matrix4.prototype.setOrtho = function(left, right, bottom, top, near, far) {
   var e, rw, rh, rd;

   if (left === right || bottom === top || near === far) {
     throw 'null frustum';
   }

   rw = 1 / (right - left);
   rh = 1 / (top - bottom);
   rd = 1 / (far - near);

   e = this.elements;

   e[0]  = 2 * rw;
   e[1]  = 0;
   e[2]  = 0;
   e[3]  = 0;

   e[4]  = 0;
   e[5]  = 2 * rh;
   e[6]  = 0;
   e[7]  = 0;

   e[8]  = 0;
   e[9]  = 0;
   e[10] = -2 * rd;
   e[11] = 0;

   e[12] = -(right + left) * rw;
   e[13] = -(top + bottom) * rh;
   e[14] = -(far + near) * rd;
   e[15] = 1;

   return this;
 };

 /**
  * Multiply the orthographic projection matrix from the right.
  * @param left The coordinate of the left of clipping plane.
  * @param right The coordinate of the right of clipping plane.
  * @param bottom The coordinate of the bottom of clipping plane.
  * @param top The coordinate of the top top clipping plane.
  * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
  * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
  * @return this
  */
 Matrix4.prototype.ortho = function(left, right, bottom, top, near, far) {
   return this.concat(new Matrix4().setOrtho(left, right, bottom, top, near, far));
 };

 /**
  * Set the perspective projection matrix.
  * @param left The coordinate of the left of clipping plane.
  * @param right The coordinate of the right of clipping plane.
  * @param bottom The coordinate of the bottom of clipping plane.
  * @param top The coordinate of the top top clipping plane.
  * @param near The distances to the nearer depth clipping plane. This value must be plus value.
  * @param far The distances to the farther depth clipping plane. This value must be plus value.
  * @return this
  */
 Matrix4.prototype.setFrustum = function(left, right, bottom, top, near, far) {
   var e, rw, rh, rd;

   if (left === right || top === bottom || near === far) {
     throw 'null frustum';
   }
   if (near <= 0) {
     throw 'near <= 0';
   }
   if (far <= 0) {
     throw 'far <= 0';
   }

   rw = 1 / (right - left);
   rh = 1 / (top - bottom);
   rd = 1 / (far - near);

   e = this.elements;

   e[ 0] = 2 * near * rw;
   e[ 1] = 0;
   e[ 2] = 0;
   e[ 3] = 0;

   e[ 4] = 0;
   e[ 5] = 2 * near * rh;
   e[ 6] = 0;
   e[ 7] = 0;

   e[ 8] = (right + left) * rw;
   e[ 9] = (top + bottom) * rh;
   e[10] = -(far + near) * rd;
   e[11] = -1;

   e[12] = 0;
   e[13] = 0;
   e[14] = -2 * near * far * rd;
   e[15] = 0;

   return this;
 };

 /**
  * Multiply the perspective projection matrix from the right.
  * @param left The coordinate of the left of clipping plane.
  * @param right The coordinate of the right of clipping plane.
  * @param bottom The coordinate of the bottom of clipping plane.
  * @param top The coordinate of the top top clipping plane.
  * @param near The distances to the nearer depth clipping plane. This value must be plus value.
  * @param far The distances to the farther depth clipping plane. This value must be plus value.
  * @return this
  */
 Matrix4.prototype.frustum = function(left, right, bottom, top, near, far) {
   return this.concat(new Matrix4().setFrustum(left, right, bottom, top, near, far));
 };

 /**
  * Set the perspective projection matrix by fovy and aspect.
  * @param fovy The angle between the upper and lower sides of the frustum.
  * @param aspect The aspect ratio of the frustum. (width/height)
  * @param near The distances to the nearer depth clipping plane. This value must be plus value.
  * @param far The distances to the farther depth clipping plane. This value must be plus value.
  * @return this
  */
 Matrix4.prototype.setPerspective = function(fovy, aspect, near, far) {
   var e, rd, s, ct;

   if (near === far || aspect === 0) {
     throw 'null frustum';
   }
   if (near <= 0) {
     throw 'near <= 0';
   }
   if (far <= 0) {
     throw 'far <= 0';
   }

   fovy = Math.PI * fovy / 180 / 2;
   s = Math.sin(fovy);
   if (s === 0) {
     throw 'null frustum';
   }

   rd = 1 / (far - near);
   ct = Math.cos(fovy) / s;

   e = this.elements;

   e[0]  = ct / aspect;
   e[1]  = 0;
   e[2]  = 0;
   e[3]  = 0;

   e[4]  = 0;
   e[5]  = ct;
   e[6]  = 0;
   e[7]  = 0;

   e[8]  = 0;
   e[9]  = 0;
   e[10] = -(far + near) * rd;
   e[11] = -1;

   e[12] = 0;
   e[13] = 0;
   e[14] = -2 * near * far * rd;
   e[15] = 0;

   return this;
 };

 /**
  * Multiply the perspective projection matrix from the right.
  * @param fovy The angle between the upper and lower sides of the frustum.
  * @param aspect The aspect ratio of the frustum. (width/height)
  * @param near The distances to the nearer depth clipping plane. This value must be plus value.
  * @param far The distances to the farther depth clipping plane. This value must be plus value.
  * @return this
  */
 Matrix4.prototype.perspective = function(fovy, aspect, near, far) {
   return this.concat(new Matrix4().setPerspective(fovy, aspect, near, far));
 };

 /**
  * Set the matrix for scaling.
  * @param x The scale factor along the X axis
  * @param y The scale factor along the Y axis
  * @param z The scale factor along the Z axis
  * @return this
  */
 Matrix4.prototype.setScale = function(x, y, z) {
   var e = this.elements;
   e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
   e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
   e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
   e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
   return this;
 };

 /**
  * Multiply the matrix for scaling from the right.
  * @param x The scale factor along the X axis
  * @param y The scale factor along the Y axis
  * @param z The scale factor along the Z axis
  * @return this
  */
 Matrix4.prototype.scale = function(x, y, z) {
   var e = this.elements;
   e[0] *= x;  e[4] *= y;  e[8]  *= z;
   e[1] *= x;  e[5] *= y;  e[9]  *= z;
   e[2] *= x;  e[6] *= y;  e[10] *= z;
   e[3] *= x;  e[7] *= y;  e[11] *= z;
   return this;
 };

 /**
  * Set the matrix for translation.
  * @param x The X value of a translation.
  * @param y The Y value of a translation.
  * @param z The Z value of a translation.
  * @return this
  */
 Matrix4.prototype.setTranslate = function(x, y, z) {
   var e = this.elements;
   e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
   e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
   e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
   e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
   return this;
 };

 /**
  * Multiply the matrix for translation from the right.
  * @param x The X value of a translation.
  * @param y The Y value of a translation.
  * @param z The Z value of a translation.
  * @return this
  */
 Matrix4.prototype.translate = function(x, y, z) {
   var e = this.elements;
   e[12] += e[0] * x + e[4] * y + e[8]  * z;
   e[13] += e[1] * x + e[5] * y + e[9]  * z;
   e[14] += e[2] * x + e[6] * y + e[10] * z;
   e[15] += e[3] * x + e[7] * y + e[11] * z;
   return this;
 };

 /**
  * Set the matrix for rotation.
  * The vector of rotation axis may not be normalized.
  * @param angle The angle of rotation (degrees)
  * @param x The X coordinate of vector of rotation axis.
  * @param y The Y coordinate of vector of rotation axis.
  * @param z The Z coordinate of vector of rotation axis.
  * @return this
  */
 Matrix4.prototype.setRotate = function(angle, x, y, z) {
   var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

   angle = Math.PI * angle / 180;
   e = this.elements;

   s = Math.sin(angle);
   c = Math.cos(angle);

   if (0 !== x && 0 === y && 0 === z) {
     // Rotation around X axis
     if (x < 0) {
       s = -s;
     }
     e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
     e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
     e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
     e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
   } else if (0 === x && 0 !== y && 0 === z) {
     // Rotation around Y axis
     if (y < 0) {
       s = -s;
     }
     e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
     e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
     e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
     e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
   } else if (0 === x && 0 === y && 0 !== z) {
     // Rotation around Z axis
     if (z < 0) {
       s = -s;
     }
     e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
     e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
     e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
     e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
   } else {
     // Rotation around another axis
     len = Math.sqrt(x*x + y*y + z*z);
     if (len !== 1) {
       rlen = 1 / len;
       x *= rlen;
       y *= rlen;
       z *= rlen;
     }
     nc = 1 - c;
     xy = x * y;
     yz = y * z;
     zx = z * x;
     xs = x * s;
     ys = y * s;
     zs = z * s;

     e[ 0] = x*x*nc +  c;
     e[ 1] = xy *nc + zs;
     e[ 2] = zx *nc - ys;
     e[ 3] = 0;

     e[ 4] = xy *nc - zs;
     e[ 5] = y*y*nc +  c;
     e[ 6] = yz *nc + xs;
     e[ 7] = 0;

     e[ 8] = zx *nc + ys;
     e[ 9] = yz *nc - xs;
     e[10] = z*z*nc +  c;
     e[11] = 0;

     e[12] = 0;
     e[13] = 0;
     e[14] = 0;
     e[15] = 1;
   }

   return this;
 };

 /**
  * Multiply the matrix for rotation from the right.
  * The vector of rotation axis may not be normalized.
  * @param angle The angle of rotation (degrees)
  * @param x The X coordinate of vector of rotation axis.
  * @param y The Y coordinate of vector of rotation axis.
  * @param z The Z coordinate of vector of rotation axis.
  * @return this
  */
 Matrix4.prototype.rotate = function(angle, x, y, z) {
   return this.concat(new Matrix4().setRotate(angle, x, y, z));
 };

 /**
  * Set the viewing matrix.
  * @param eyeX, eyeY, eyeZ The position of the eye point.
  * @param centerX, centerY, centerZ The position of the reference point.
  * @param upX, upY, upZ The direction of the up vector.
  * @return this
  */
 Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
   var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

   fx = centerX - eyeX;
   fy = centerY - eyeY;
   fz = centerZ - eyeZ;

   // Normalize f.
   rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
   fx *= rlf;
   fy *= rlf;
   fz *= rlf;

   // Calculate cross product of f and up.
   sx = fy * upZ - fz * upY;
   sy = fz * upX - fx * upZ;
   sz = fx * upY - fy * upX;

   // Normalize s.
   rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
   sx *= rls;
   sy *= rls;
   sz *= rls;

   // Calculate cross product of s and f.
   ux = sy * fz - sz * fy;
   uy = sz * fx - sx * fz;
   uz = sx * fy - sy * fx;

   // Set to this.
   e = this.elements;
   e[0] = sx;
   e[1] = ux;
   e[2] = -fx;
   e[3] = 0;

   e[4] = sy;
   e[5] = uy;
   e[6] = -fy;
   e[7] = 0;

   e[8] = sz;
   e[9] = uz;
   e[10] = -fz;
   e[11] = 0;

   e[12] = 0;
   e[13] = 0;
   e[14] = 0;
   e[15] = 1;

   // Translate.
   return this.translate(-eyeX, -eyeY, -eyeZ);
 };

 /**
  * Multiply the viewing matrix from the right.
  * @param eyeX, eyeY, eyeZ The position of the eye point.
  * @param centerX, centerY, centerZ The position of the reference point.
  * @param upX, upY, upZ The direction of the up vector.
  * @return this
  */
 Matrix4.prototype.lookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
   return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
 };

 /**
  * Multiply the matrix for project vertex to plane from the right.
  * @param plane The array[A, B, C, D] of the equation of plane "Ax + By + Cz + D = 0".
  * @param light The array which stored coordinates of the light. if light[3]=0, treated as parallel light.
  * @return this
  */
 Matrix4.prototype.dropShadow = function(plane, light) {
   var mat = new Matrix4();
   var e = mat.elements;

   var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];

   e[ 0] = dot - light[0] * plane[0];
   e[ 1] =     - light[1] * plane[0];
   e[ 2] =     - light[2] * plane[0];
   e[ 3] =     - light[3] * plane[0];

   e[ 4] =     - light[0] * plane[1];
   e[ 5] = dot - light[1] * plane[1];
   e[ 6] =     - light[2] * plane[1];
   e[ 7] =     - light[3] * plane[1];

   e[ 8] =     - light[0] * plane[2];
   e[ 9] =     - light[1] * plane[2];
   e[10] = dot - light[2] * plane[2];
   e[11] =     - light[3] * plane[2];

   e[12] =     - light[0] * plane[3];
   e[13] =     - light[1] * plane[3];
   e[14] =     - light[2] * plane[3];
   e[15] = dot - light[3] * plane[3];

   return this.concat(mat);
 }

 /**
  * Multiply the matrix for project vertex to plane from the right.(Projected by parallel light.)
  * @param normX, normY, normZ The normal vector of the plane.(Not necessary to be normalized.)
  * @param planeX, planeY, planeZ The coordinate of arbitrary points on a plane.
  * @param lightX, lightY, lightZ The vector of the direction of light.(Not necessary to be normalized.)
  * @return this
  */
 Matrix4.prototype.dropShadowDirectionally = function(normX, normY, normZ, planeX, planeY, planeZ, lightX, lightY, lightZ) {
   var a = planeX * normX + planeY * normY + planeZ * normZ;
   return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
 };


`````

src/Sphere.js
`````javascript
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
   }

   initSphere() {
       let vertices = [];
       let normals = [];
       let indices = [];

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

               vertices.push(x);
               vertices.push(y);
               vertices.push(z);

               normals.push(x);
               normals.push(y);
               normals.push(z); // For a unit sphere, vertex normal is the same as vertex position
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
       for (let i = 0; i < indices.length; i++) {
           let index = indices[i];
           this.indexedVertices.push(vertices[index * 3]);
           this.indexedVertices.push(vertices[index * 3 + 1]);
           this.indexedVertices.push(vertices[index * 3 + 2]);
           this.indexedNormals.push(normals[index * 3]);
           this.indexedNormals.push(normals[index * 3 + 1]);
           this.indexedNormals.push(normals[index * 3 + 2]);
       }
   }


   render() {
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


`````

src/Triangle.js
`````javascript
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

`````

src/asgn4.js
`````javascript
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
let g_score = 0;

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

function drawPearls(pearls) {
  var pearl = new Sphere();
  pearl.color = [170/256, 210/255, 229/255, 1.0];
  pearl.textureNum = -2;
  var n = 0;
  for (var d=0; d<pearls.length; d++){
    pearl.matrix.setIdentity();
    pearl.matrix.translate(pearls[d][0], 2, pearls[d][1]);
    pearl.matrix.rotate(g_seconds*30, 0, 1, 0);
    pearl.matrix.translate(0, (Math.cos(g_seconds*Math.PI))*0.2, 0);
    pearl.renderFast();
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
  
  if (g_pearls.length < 30){
    var x = Math.floor(Math.random() * (32));
    var y = Math.floor(Math.random() * (32));
    if (g_map[y][x] == 0){
      g_pearls = g_pearls.concat([[y-16,x-16]]);
    }
  }
  
  collectPearls();
  
  drawPearls(g_pearls);

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

`````

src/Cube.js
`````javascript
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
            // xy0 face
          0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0,
          0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0,
          // xy1
          0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
          0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
          // 0yz
          -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,
          -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,
          // 1yz
          1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
          1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
          // x0z
          0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,
          0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,
          // x1z face
          0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
          0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0
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

`````

