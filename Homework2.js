"use strict";

var canvas;
var gl;
var program;

// matrices instanciation
var projectionMatrix;
var modelViewMatrix;
var instanceMatrix;
var modelViewMatrixLoc;
var vBuffer;

// numbers of nodes and vertices
var numChecks = 8;
var numVertices = 36;
var numNodes = 11;

// for texture
var texSize = 256;
var c;
var texture1, texture2;
var t1, t2;

// arrays instanciation
var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];
var stack = [];
var figure = [];

// create the first texture of checkerboard pattern
var image1 = new Uint8Array(4*texSize*texSize);
for ( var i = 0; i < texSize; i++ ) {
	for ( var j = 0; j <texSize; j++ ) {
		var patchx = Math.floor(i/(texSize/numChecks));
		var patchy = Math.floor(j/(texSize/numChecks));
		if(patchx%2 ^ patchy%2) c = 255;
		else c = 0;
		// image on the faces of each body part
		image1[4*i*texSize+4*j] = c;
		image1[4*i*texSize+4*j+1] = c;
		image1[4*i*texSize+4*j+2] = c;
		image1[4*i*texSize+4*j+3] = 255;
	}
}
// Create a linear decrease in intensity texture  
var image2 = new Uint8Array(4*texSize*texSize);
for ( var i = 0; i < texSize; i++ ) {
	for ( var j = 0; j <texSize; j++ ) {
		c = 1+j; // for back to front: c = 1-j 
		// linear in the form result=(1 - t) * a + t * b
		image2[4*i*texSize+4*j] = c;
		image2[4*i*texSize+4*j+1] = c;
		image2[4*i*texSize+4*j+2] = c;
		image2[4*i*texSize+4*j+3] = 255; 
	   }
}

// setting the coordinates of the texture
var texCoord = [
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 1),
  vec2(1, 0)
];

// setting the vertices
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

// setting the vertex colors
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

// Configuration of Texture
function configureTexture() {
	// texture 1
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
	// texture 2
    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[3]);
}

// body parts Id
var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 11;

//-- dimensions of each body part --

// torso
var torsoHeight = 4.0;
var torsoWidth = 10.0;
// upper arm
var upperArmHeight = 2.0;
var upperArmWidth  = 1.0;
// lower arm
var lowerArmHeight = 1.5;
var lowerArmWidth  = 1.0;
// upper leg
var upperLegHeight = 2.0;
var upperLegWidth  = 1.0;
// lower leg 
var lowerLegHeight = 1.5;
var lowerLegWidth  = 1.0;
// head
var headHeight = 2.0;
var headWidth = 3.0;
//tail
var tailHeight = 3;
var tailWidth = 0.5;

// variables for buttons
var walk = false;
var view_3D = false;

// positions of dog
var dog_position = -40;
var inc_position = 0.1;
var move_count = 0;

// upper leg position increments
var LUA_inc = 1;
var RUA_inc = 1;
var LUL_inc = 1;
var RUL_inc = 1;

// lower leg position increments
var LLA_inc = -0.5;
var RLA_inc = -0.5;
var LLL_inc = -0.5;
var RLL_inc = -0.5;

// angles for lower leg/arms
var LLA_angle = 0;
var RLA_angle = 0; 
var LLL_angle = 0;
var RLL_angle = 0;
var head_angle = 0;
var tail_angle = 40;

// angles for upper leg/arms
var LUA_angle = 180;
var RUA_angle = 180;
var LUL_angle = 180;
var RUL_angle = 180;

// angles for lower leg/arms
var LLA_angle = 0;
var RLA_angle = 0;
var LLL_angle = 0;
var RLL_angle = 0;

// theta angle for each body part
var theta = [0, head_angle, LUA_angle, LLA_angle, 
RUA_angle, LLA_angle, LUL_angle, LLA_angle, RUL_angle, 
LLA_angle, 0, tail_angle];

for( var i=0; i<=numNodes; i++) figure[i] = createNode(null, null, null, null);

//-------------------------------------------

// scaling
function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

// cube 
function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// general function for creating a node
function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

// initiate each node
function initNodes(Id) {
    var m = mat4();
	
	// change between body parts
    switch(Id) {
		// torso
		case torsoId:
		// translate in the x-axis by variable dog_position and rotate 
		m = translate(dog_position, 0.0, 0.0);
		m = mult(m, rotate(theta[torsoId], 0, 1, 0 ));
		// create the node call matrix for transformation, torso function for rendering, and head as its child
		figure[torsoId] = createNode( m, torso, null, headId ); 
		break;

		// head
		case headId:
		case head1Id:
		case head2Id:
		// translate to move head to top, left center location in relation to torso
		m = translate(0.5*torsoWidth + 0.2*headWidth, torsoHeight - 0.1*headHeight, 0.0);
		// rotate in y or z axis
		m = mult(m, rotate(theta[head1Id], 0, 1, 0))
		m = mult(m, rotate(theta[head2Id], 0, 0, 1));
		// create node, call matrix to transform, head funtion for rendering, and left upper arm as sibling
		figure[headId] = createNode( m, head, leftUpperArmId, null);
		break;	

		// left upper arm
		case leftUpperArmId:
		// translate to front, left and bottom location relative to the torso
		m = translate(0.45*torsoWidth, 0.05*torsoHeight, 0.5*torsoWidth - 0.5*upperLegWidth);
		// rotate in z-axis
		m = mult(m, rotate(theta[leftUpperArmId], 0, 0, 1));
		// create node, call matrix to transform, leftUpperArm funtion for rendering, right upper arm as sibling, and leftlowerarm as child
		figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
		break;

		// right upper arm
		// same as above but to left location and leftupperleg as sibling and rightlowerarm as child
		case rightUpperArmId:
		m = translate(0.45*torsoWidth, 0.05*torsoHeight, -0.5*torsoWidth + 0.5*upperArmWidth);
		m = mult(m, rotate(theta[rightUpperArmId], 0, 0, 1));
		figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
		break;

		// left upper leg
		// same as above but to the back of the torso and rightupperleg as sibling and leftlowerleg as child
		case leftUpperLegId:
		m = translate(-(0.5*torsoWidth - 0.5*upperLegWidth), 0.05*torsoHeight, 0.5*torsoWidth - 0.5*upperLegWidth);
		m = mult(m , rotate(theta[leftUpperLegId], 0, 0, 1));
		figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
		break;

		// right upper leg
		case rightUpperLegId:
		// same as above but to the back and right of the torso; and tail as sibling and rightlowerleg as child
		m = translate(-(0.5*torsoWidth - 0.5*upperArmWidth), 0.05*torsoHeight, -0.5*torsoWidth + 0.5*upperLegWidth);
		m = mult(m, rotate(theta[rightUpperLegId], 0, 0, 1));
		figure[rightUpperLegId] = createNode( m, rightUpperLeg, tailId, rightLowerLegId );
		break;

		// left lower arm
		// translate to bottom of upper leg, rotate z-axis and has no sibiling or child
		case leftLowerArmId:
		m = translate(0.0, 0.86*upperArmHeight, 0.0);
		m = mult(m, rotate(theta[leftLowerArmId], 0, 0, 1));
		figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
		break;

		// right lower arm
		// translate to bottom of upper leg, rotate z-axis and has no sibiling or child
		case rightLowerArmId:
		m = translate(0.0, 0.86*upperArmHeight, 0.0);
		m = mult(m, rotate(theta[rightLowerArmId], 0, 0, 1));
		figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
		break;

		// left lower leg
		// translate to bottom of upper leg, rotate z-axis and has no sibiling or child
		case leftLowerLegId:
		m = translate(0.0, 0.86*upperLegHeight, 0.0);
		m = mult(m, rotate(theta[leftLowerLegId], 0, 0, 1));
		figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
		break;
		
		// right lower leg
		// translate to bottom of upper leg, rotate z-axis and has no sibiling or child
		case rightLowerLegId:
		m = translate(0.0, 0.86*upperLegHeight, 0.0);
		m = mult(m, rotate(theta[rightLowerLegId], 0, 0, 1));
		figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
		break;

		// tail
		// translate to bottom of upper leg, rotate z-axis and has no sibiling or child
		case tailId:
		m = translate(-(0.48*torsoWidth), (torsoHeight - 0.45*tailWidth), 0.0);
		m = mult(m, rotate(theta[tailId], 1, 0, 0));
		figure[tailId] = createNode( m, tail, null, null);
		break;
	
	}

}

// general traverse function where matrices are pushed and popped to save and use them depending on their relation (root/sibling/child)
function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

//---- creating a function for each body part
// modelview is translated in y-axis by half of the part's height, scale by its dimensions
// flatten matrices and draw the parts ----
function torso() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function tail() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    cube();

	// for color
	var cBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

	var vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vColor );

	// for position
	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	// for texture coordinates
	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

	var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord );

    configureTexture();

	// activate and bind each texture
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);
	
	// buttons for walking and viewing in 3D
	document.getElementById("buttonWalk").onclick = function(){walk = !walk;};
	document.getElementById("button3D").onclick = function(){view_3D = !view_3D;};
	
	// initiate each node
    for(i=0; i<=numNodes; i++) initNodes(i);

    render();
}


var render = function() {
	// Create a delay in order to control the speed of the rotation
	setTimeout( function() {

	// projection matrix for 2D and 3D
	projectionMatrix = ortho(-50.0,50.0,-20.0, 20.0,-50.0,50.0);
	
	// model view for 2D
	modelViewMatrix = mat4();

	// model view for 3D
	if (view_3D){
		var eye = vec3(10.0, -10.0, 30.0);
		const at = vec3(3.0, 1.0, -1.0);
		const up = vec3(0.0, 1.0, 0.0);
		modelViewMatrix = lookAt(eye, at, up);		
	}
	
	// To send ModelView info vertex and fragment shaders
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")
	
	gl.clear( gl.COLOR_BUFFER_BIT );
		
	if (walk) {
		// initialize count of movement
		move_count += 1 // add one each time goes through loop
		
		// for the head
		if (theta[head1Id] < 90)
			head_angle += 2;
		theta[head1Id] = head_angle; // rotate the head so it looks at viewer when walking
		
		//for the tail
		if (move_count % 5 == 0) // if has moved 5 times
			tail_angle *= -1 //change the tail angle direction to its opposite
		theta[tailId] = tail_angle;
		

		// for leftUpperArm
		// start by moving the left front leg
		if (Math.abs(LUA_angle-180) == 30) // if angle btw 0 and 30
			LUA_inc *= -1; // change direction of rotation
		LUA_angle += LUA_inc;			
		theta[leftUpperArmId] = LUA_angle;
		
		// wait for 20 counts to start the rest of the animation in the dog
		if (move_count > 20) {
		
			// for the torso
			dog_position += inc_position; // translate the dog by the increment
			if (dog_position > 55) dog_position = -55; // if dog is at the end of screen, return to start 
			
			//
			// front legs
			//
		
			// for leftLowerArm
			if (Math.abs(LLA_angle) == 20) // if angle btw 0 and 20
				LLA_inc *= -1; // change direction of rotation
			LLA_angle += LLA_inc;	
			theta[leftLowerArmId] = LLA_angle;
			
			// wait for 30 counts
			if (move_count > 30) {
				// for rightUpperArm		
				if (Math.abs(RUA_angle-180) == 30) // if angle btw 0 and 30
					RUA_inc *= -1; // change direction of rotation
				RUA_angle -= RUA_inc;			
				theta[rightUpperArmId] = RUA_angle;
			}

			// for rightLowerArm
			if (Math.abs(RLA_angle) == 20) // if angle btw 0 and 20
				RLA_inc *= -1; // change direction of rotation
			RLA_angle -= RLA_inc;	
			theta[rightLowerArmId] = RLA_angle;
				
			//
			// back legs
			//
			
			// wait for 40 counts
			if (move_count > 40) {	
				// for leftupperleg
				if (Math.abs(LUL_angle-180) == 30) // if angle btw 0 and 30
					LUL_inc *= -1; // change direction of rotation
				LUL_angle -= LUL_inc;			
				theta[leftUpperLegId] = LUL_angle;
			}
			// for leftLowerArm
			if (Math.abs(LLL_angle) == 20) // if angle btw 0 and 20
				LLL_inc *= -1; // change direction of rotation
			LLL_angle += LLL_inc;	
			theta[leftLowerLegId] = LLL_angle;			
			
			// for rightUpperArm		
			if (Math.abs(RUL_angle-180) == 30) // if angle btw 0 and 30
				RUL_inc *= -1; // change direction of rotation
			RUL_angle += RUL_inc;			
			theta[rightUpperLegId] = RUL_angle;
			
			// for rightLowerArm
			if (Math.abs(RLL_angle) == 20) // if angle btw 0 and 20
				RLL_inc *= -1; // change direction of rotation
			RLL_angle -= RLL_inc;	
			theta[rightLowerLegId] = RLL_angle;
	
		}
		
		
	}else { // when not walking:
		// for head
		if (theta[head1Id] > 0)
			head_angle -= 2; // rotate the head back straight
		theta[head1Id] = head_angle; 
		
		// for tail
		theta[tailId] = Math.abs(tail_angle); // return tail to original position
	}
	
	// initiate all nodes
	for(i=0; i<=numNodes; i++) initNodes(i);
	// traverse the torso
	traverse(torsoId);
	// animate render
	requestAnimFrame(render);
	
	}, 30);
}
