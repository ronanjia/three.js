/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.WebVRCamera = function ( display, renderer ) {

	var scope = this;

	var frameData = null;

	if ( 'VRFrameData' in window ) {

		frameData = new window.VRFrameData();

	}

	var cameraL = new THREE.PerspectiveCamera();
	cameraL.bounds = new THREE.Vector4( 0.0, 0.0, 0.5, 1.0 );
	cameraL.layers.enable( 1 );

	var cameraR = new THREE.PerspectiveCamera();
	cameraR.bounds = new THREE.Vector4( 0.5, 0.0, 0.5, 1.0 );
	cameraR.layers.enable( 2 );

	//

	var currentSize, currentPixelRatio;

	function onVRDisplayPresentChange() {

		if ( display.isPresenting ) {

			var eyeParameters = display.getEyeParameters( 'left' );
			var renderWidth = eyeParameters.renderWidth;
			var renderHeight = eyeParameters.renderHeight;

			currentPixelRatio = renderer.getPixelRatio();
			currentSize = renderer.getSize();

			renderer.setPixelRatio( 1 );
			renderer.setSize( renderWidth * 2, renderHeight, false );

			scope.enabled = true;

		} else if ( scope.enabled ) {

			scope.enabled = false;

			renderer.setPixelRatio( currentPixelRatio );
			renderer.setSize( currentSize.width, currentSize.height, true );

		}

	}

	window.addEventListener( 'vrdisplaypresentchange', onVRDisplayPresentChange, false );

	//

	THREE.ArrayCamera.call( this, [ cameraL, cameraR ] );

	//

	this.onBeforeRender = function () {

		display.depthNear = scope.near;
		display.depthFar = scope.far;

		display.getFrameData( frameData );

		//

		var pose = frameData.pose;

		if ( pose.orientation !== null ) {

			scope.quaternion.fromArray( pose.orientation );

		}

		if ( pose.position !== null ) {

			scope.position.fromArray( pose.position );

		} else {

			scope.position.set( 0, 0, 0 );

		}

		//

		cameraL.matrixWorldInverse.elements = frameData.leftViewMatrix;
		cameraR.matrixWorldInverse.elements = frameData.rightViewMatrix;

		cameraL.projectionMatrix.elements = frameData.leftProjectionMatrix;
		cameraR.projectionMatrix.elements = frameData.rightProjectionMatrix;

		// HACK @mrdoob
		// Ideally we'll merge both projection matrices so we can frustum cull

		scope.projectionMatrix.elements = cameraL.projectionMatrix.elements;

		//

		var layers = display.getLayers();

		if ( layers.length ) {

			var layer = layers[ 0 ];

			if ( layer.leftBounds !== null && layer.leftBounds.length === 4 ) {

				cameraL.bounds.fromArray( layer.leftBounds );

			}

			if ( layer.rightBounds !== null && layer.rightBounds.length === 4 ) {

				cameraR.bounds.fromArray( layer.rightBounds );

			}

		}

	};

	this.onAfterRender = function () {

		if ( display.isPresenting ) display.submitFrame();

	};

};

THREE.WebVRCamera.prototype = Object.assign( Object.create( THREE.ArrayCamera.prototype ), {

	constructor: THREE.WebVRCamera,

	isWebVRCamera: true

} );
