"use strict";
// Initialize varaibles for program
var canvas;
var gl;
var numVertices  = 36;
var program;

// Variables for buttons
var flag = true;
var direction = true;
var change_persp = true;
var shading = true;

// Arrays
var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

// Axis numbers
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis; //current axis

// Angle in each axis
var theta = [45.0, 45.0, 45.0];

// Initialize sliders for scale and translating
var scale_qty = 0.50;	
var translate_x = 0.0;
var translate_y = 0.0;
var translate_z = 0.0;

// ModelView and projection variables
var modelViewMatrix
var projectionMatrix;

// For camera
var eye = vec3(0.0, 0.0, 1.0);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);	

// For perspective and orthogonal projections
var near = 0.1; 
var far = 3;

// For orthogonal projection
var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

// For perspective projection
var  fovy = 95.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0; // Viewport aspect ratio

// Specifying the light properties
var lightPosition = vec4(10.0, 10.0, -2.0, 1.0 ); // position is right by 10, up by 10, and away from us by 2, w=1 means light is positional
var lightAmbient = vec4(0.0, 1.0, 1.0, 1.0 ); // one light source, color white  
var lightDiffuse = vec4(0.0, 1.0, 1.0, 1.0 ); 
var lightSpecular = vec4( 0.0, 1.0, 1.0, 1.0 ); 

// Specifying the material properties for Jade (greenish rock)
// from: http://devernay.free.fr/cours/opengl/materials.html
var materialAmbient = vec4( 0.135, 0.2225, 0.1575, 1.0 ); // gives the object some color when dark
var materialDiffuse = vec4( 0.54, 0.89, 0.63, 1.0); // the more a part of an object faces the light source, the brighter it becomes
var materialSpecular = vec4( 0.316228, 0.316228, 0.316228, 1.0 ); // simulates the bright spot of a light that appears on shiny objects
var materialShininess = 200; // higher shininess of an object means it properly reflects the light instead of scattering it all around

// Defining the vertices of the cube
var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// Defining the colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

// Function for the cube vertices
function quad(a, b, c, d) {
	
	// Getting the normals from each vertex edge
	var t1 = subtract(vertices[b], vertices[a]);
	var t2 = subtract(vertices[c], vertices[b]);	
	var normal = vec3 (cross(t1, t2));
	
	pointsArray.push(vertices[a]);
	normalsArray.push(normal);

	pointsArray.push(vertices[b]);
	normalsArray.push(normal);

	pointsArray.push(vertices[c]);
	normalsArray.push(normal);

	pointsArray.push(vertices[a]);
	normalsArray.push(normal);

	pointsArray.push(vertices[c]);
	normalsArray.push(normal);

	pointsArray.push(vertices[d]);
	normalsArray.push(normal);
}

// Colors of the cube
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();
	
	// Position
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	// Normal
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    // Light for Phong shading
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program,"shininess"),materialShininess);
	
	// Light for Gouraud shading
    var ambientProduct_g = mult(lightAmbient, materialAmbient);
    var diffuseProduct_g = mult(lightDiffuse, materialDiffuse);
    var specularProduct_g = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct_g"),flatten(ambientProduct_g));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct_g"),flatten(diffuseProduct_g) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct_g"),flatten(specularProduct_g) );
	gl.uniform1f(gl.getUniformLocation(program,"shininess_g"),materialShininess);
	
	// Buttons for each axis, toggle, direction of rotation, shading, and projection type
	document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
	document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
	document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
	document.getElementById("ButtonT").onclick = function(){flag = !flag;};
	document.getElementById("ButtonC").onclick = function(){direction = !direction}; //to change the direction of rotation
	document.getElementById("ButtonSh").onclick = function(){shading = !shading}; //to change the shading type
	document.getElementById("ButtonPers").onclick = function(){change_persp = !change_persp;};

	
	// Slider for each scale factor, translation in x y and z, and near and far
	document.getElementById("scaleSlider").onchange = function(event) {scale_qty = event.target.value;};
	document.getElementById("trans_xSlider").onchange = function(event) {translate_x = event.target.value;};
	document.getElementById("trans_ySlider").onchange = function(event) {translate_y = event.target.value;};
	document.getElementById("trans_zSlider").onchange = function(event) {translate_z = event.target.value;};
	document.getElementById("nearSlider").onchange = function(event) {near = event.target.value;};
	document.getElementById("farSlider").onchange = function(event) {far = event.target.value;};
	
    render();
}

var render = function() {
	// Create a delay in order to control the speed of the rotation
	setTimeout( function() {
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Change the direction of rotation when cube is rotating
		if(flag){
		  if(direction)
			theta[axis] += 2.0;
		  else
			theta[axis] -= 2.0;}
	
		gl.uniform1f(gl.getUniformLocation(program,"shading"), shading);
		
		// Define the ModelView using function LookAt from MV.js
		modelViewMatrix = lookAt(eye, at, up);

		// To scale the cube
		modelViewMatrix[0][0] = modelViewMatrix[0][0] * scale_qty; 
		modelViewMatrix[1][1] = modelViewMatrix[1][1] * scale_qty; 
		modelViewMatrix[2][2] = modelViewMatrix[2][2] * scale_qty;
	
		// To translate the cube
		modelViewMatrix = mult( modelViewMatrix, translate(translate_x, translate_y, translate_z));
		
		// To rotate the cube
		modelViewMatrix = mult( modelViewMatrix, rotateX(theta[0]) );
		modelViewMatrix = mult( modelViewMatrix, rotateY(theta[1]) );
		modelViewMatrix = mult( modelViewMatrix, rotateZ(theta[2]) );
		
		// To send ModelView info vertex and fragment shaders
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));


		if (change_persp)
			// For orthographic projection
			projectionMatrix = ortho(left, right, bottom, ytop, near, far);
		else 
			// For perspective projection
			projectionMatrix = perspective(fovy, aspect, near, far);

		// To send Projection info vertex and fragment shaders
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

		gl.drawArrays( gl.TRIANGLES, 0, numVertices );
		requestAnimFrame(render);	
	}, 30);
	
}




