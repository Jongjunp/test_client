import logo from './logo.svg';
import './App.css';
import axios from "axios";
import { useEffect } from "react";

//parameter 전달을 위해서 필요한 항목
axios.default.paramsSerializer = params => {
  return JSON.stringify(params);
}

const signindata = {email: "pybkey@gmail.com", password: "passwordispassword"};

const signupdata = {
  email: "johndoe@gmail.com",
  password: "idontknow",
  name:"John doe",
  nickname: "Noone"
}

var tokendata;

function App() {
  const callApi = async () => {
    //axios.post("/users/signup", JSON.stringify(signupdata), {headers:
    //  {"Content-Type": `application/json`}}).then((res) => console.log(res));
    axios.get('/users/signin', { params:{email: "pybkey@gmail.com", password: "passwordispassword"} }).then((res) => tokendata = res.token);  
  };

  useEffect(() => {
    callApi();
  }, []);

  return (
  <body>
    <div id="info">
      <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - instancing - performance
    </div>
    <div id="container"></div>
    <script type="module">
      import * as THREE from '../build/three.module.js';
		  import Stats from './jsm/libs/stats.module.js';
		  import { GUI } from './jsm/libs/lil-gui.module.min.js';
		  import { OrbitControls } from './jsm/controls/OrbitControls.js';
		  import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';
		  let container, stats, gui, guiStatsEl;
		  let camera, controls, scene, renderer, material;
      
		const Method = {
			INSTANCED: 'INSTANCED',
			MERGED: 'MERGED',
			NAIVE: 'NAIVE'
		};
		const api = {
			method: Method.INSTANCED,
			count: 1000
		};
		init();
		initMesh();
		animate();
		function clean() {
			const meshes = [];
			scene.traverse( function ( object ) {
				if ( object.isMesh ) meshes.push( object );
			});
			for ( let i = 0; i < meshes.length; i ++ ) {
				const mesh = meshes[ i ];
				mesh.material.dispose();
				mesh.geometry.dispose();
				scene.remove( mesh );
			}
		}
		const randomizeMatrix = function () {
			const position = new THREE.Vector3();
			const rotation = new THREE.Euler();
			const quaternion = new THREE.Quaternion();
			const scale = new THREE.Vector3();

			return function ( matrix ) {
				position.x = Math.random() * 40 - 20;
				position.y = Math.random() * 40 - 20;
				position.z = Math.random() * 40 - 20;
				rotation.x = Math.random() * 2 * Math.PI;
				rotation.y = Math.random() * 2 * Math.PI;
				rotation.z = Math.random() * 2 * Math.PI;
				quaternion.setFromEuler( rotation );
				scale.x = scale.y = scale.z = Math.random() * 1;
				matrix.compose( position, quaternion, scale );
			};
		}();
		function initMesh() {
			clean();
			// make instances
			new THREE.BufferGeometryLoader()
				.setPath( 'models/json/' )
				.load( 'suzanne_buffergeometry.json', function ( geometry ) {
					material = new THREE.MeshNormalMaterial();
					geometry.computeVertexNormals();
					console.time( api.method + ' (build)' );
					switch ( api.method ) {
						case Method.INSTANCED:
							makeInstanced( geometry );
							break;
						case Method.MERGED:
							makeMerged( geometry );
							break;
						case Method.NAIVE:
							makeNaive( geometry );
							break;
					}
					console.timeEnd( api.method + ' (build)' );
				} );
		}

		function makeInstanced( geometry ) {
			const matrix = new THREE.Matrix4();
			const mesh = new THREE.InstancedMesh( geometry, material, api.count );
			for ( let i = 0; i < api.count; i ++ ) {
				randomizeMatrix( matrix );
				mesh.setMatrixAt( i, matrix );
			}
			scene.add( mesh );
			const geometryByteLength = getGeometryByteLength( geometry );
			guiStatsEl.innerHTML = [
				'<i>GPU draw calls</i>: 1',
				'<i>GPU memory</i>: ' + formatBytes( api.count * 16 + geometryByteLength, 2 )
			].join( '<br/>' );
		}

		function makeMerged( geometry ) {
			const geometries = [];
			const matrix = new THREE.Matrix4();
			for ( let i = 0; i < api.count; i ++ ) {
				randomizeMatrix( matrix );
				const instanceGeometry = geometry.clone();
				instanceGeometry.applyMatrix4( matrix );
				geometries.push( instanceGeometry );
			}

			const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries( geometries );
			scene.add( new THREE.Mesh( mergedGeometry, material ) );
			guiStatsEl.innerHTML = [
				'<i>GPU draw calls</i>: 1',
				'<i>GPU memory</i>: ' + formatBytes( getGeometryByteLength( mergedGeometry ), 2 )
			].join( '<br/>' );
		}

		function makeNaive( geometry ) {
			const matrix = new THREE.Matrix4();
			for ( let i = 0; i < api.count; i ++ ) {
				randomizeMatrix( matrix );
				const mesh = new THREE.Mesh( geometry, material );
				mesh.applyMatrix4( matrix );
				scene.add( mesh );
			}
			const geometryByteLength = getGeometryByteLength( geometry );
			guiStatsEl.innerHTML = [
				'<i>GPU draw calls</i>: ' + api.count,
				'<i>GPU memory</i>: ' + formatBytes( api.count * 16 + geometryByteLength, 2 )
			].join( '<br/>' );
		}

		function init() {
			const width = window.innerWidth;
			const height = window.innerHeight;
			camera = new THREE.PerspectiveCamera( 70, width / height, 1, 100 );
			camera.position.z = 30;
			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( width, height );
			renderer.outputEncoding = THREE.sRGBEncoding;
			container = document.getElementById( 'container' );
			container.appendChild( renderer.domElement );
			scene = new THREE.Scene();
			scene.background = new THREE.Color( 0xffffff );
			controls = new OrbitControls( camera, renderer.domElement );
			controls.autoRotate = true;

			// stats
			stats = new Stats();
			container.appendChild( stats.dom );

			// gui
			gui = new GUI();
			gui.add( api, 'method', Method ).onChange( initMesh );
			gui.add( api, 'count', 1, 10000 ).step( 1 ).onChange( initMesh );
			const perfFolder = gui.addFolder( 'Performance' );
			guiStatsEl = document.createElement( 'div' );
			guiStatsEl.classList.add( 'gui-stats' );
			perfFolder.$children.appendChild( guiStatsEl );
			perfFolder.open();

			// listeners
			window.addEventListener( 'resize', onWindowResize );
			Object.assign( window, { scene } );
		}

		function onWindowResize() {
			const width = window.innerWidth;
			const height = window.innerHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize( width, height );
		}

		function animate() {
			requestAnimationFrame( animate );
			controls.update();
			stats.update();
			render();
		}

		function render() {
			renderer.render( scene, camera );
		}

		function getGeometryByteLength( geometry ) {
			let total = 0;
			if ( geometry.index ) total += geometry.index.array.byteLength;
			for ( const name in geometry.attributes ) {
				total += geometry.attributes[ name ].array.byteLength;
			}
			return total;
		}

		function formatBytes( bytes, decimals ) {
			if ( bytes === 0 ) return '0 bytes';
			const k = 1024;
			const dm = decimals < 0 ? 0 : decimals;
			const sizes = [ 'bytes', 'KB', 'MB' ];
			const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
			return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];
		}
	</script>

</body>
  );
}

export default App;
