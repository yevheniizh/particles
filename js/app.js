import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import simulationVertexShader from './shaders/simulationVertex.glsl';
import simulationFragmentShader from './shaders/simulationFragment.glsl';

import t1 from '../logo.png';
import t2 from '../super.png';

import texture from '../test.jpg';

// linear interpolation helper
function lerp(a, b ,n) {
    return ( 1 - n ) * a + n * b;
}

// helper snippet
const loadImage = path => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous' // to avoid CORS if used with Canvas
      img.src = path
      img.onload = () => {
        resolve(img)
      }
      img.onerror = e => {
        reject(e)
      }
    })
}

export default class Sketch {
    constructor(options) {
        this.size = 1024;
        this.number = this.size * this.size;
        this.container = options.dom;
        this.scene = new THREE.Scene();

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setClearColor(0x222222, 1);
        this.renderer.setSize(this.width, this.height);
        this.container.append(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 0.01, 10);
        this.camera.position.z = 1;
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.time = 0;

        this.setupSettings();

        Promise.all([this.getPixelDataFromImage(t1), this.getPixelDataFromImage(t2)])
            .then(textures => {
                this.data1 = textures[0];
                this.data2 = textures[1];
                this.mouseEvents();
                this.setupFBO();
                this.addObjects();
                this.setupResize();
                this.render();
            });
    }

    setupSettings() {
        this.settings = {
            progress: 0,
        };

        this.gui = new GUI();
        this.gui.add(this.settings, 'progress', 0, 1, 0.01).onChange(
            val => {
                this.simulationMaterial.uniforms.uProgress.value = val;
            }
        )
    }

    async getPixelDataFromImage(url) {
        let img = await loadImage(url);
        let width = 200;
        let canvas = document.createElement( 'canvas' );
        canvas.width = width;
        canvas.height = width;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, width);
        let canvasData = ctx.getImageData(0, 0, width, width).data;
        
        let pixels = [];
        for (let i = 0; i < canvasData.length; i+=4) {
            let x = (i / 4) % width; // 4 because each pixel has R, G, B, A values
            let y = Math.floor( (i / 4) / width );
            // Filter by black pixels
            if (canvasData[i] < 5) {
                pixels.push({x: x/width - 0.5, y: 0.5 - y/width});
            }
        }

        const data = new Float32Array( 4 * this.number ); // 4 corresponds to 4 dimensions of vec4 from shader
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const index = i * this.size + j;
                let randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
                if (Math.random() > 0.9) {
                    randomPixel = {x: 3 * (Math.random() - 0.5), y: 3 * (Math.random() - 0.5)}
                }
                data[ 4 * index ] = randomPixel.x + (Math.random() - 0.5) * 0.01;
                data[ 4 * index + 1 ] = randomPixel.y + (Math.random() - 0.5) * 0.01;
                data[ 4 * index + 2 ] = ( Math.random() - 0.5 ) * 0.01;
                data[ 4 * index + 3 ] = ( Math.random() - 0.5 ) * 0.01;
            }    
        }
        
        let dataTexture = new THREE.DataTexture( data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType );
        dataTexture.needsUpdate = true;

        return dataTexture;
    }

    mouseEvents() {
        this.planeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshBasicMaterial(),
        );

        this.dummy = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 32, 32),
            new THREE.MeshNormalMaterial(),
        )
        this.scene.add( this.dummy );

        window.addEventListener('mousemove', (e) => {
            this.pointer.x = (e.clientX / this.width) * 2 - 1;
            this.pointer.y = -(e.clientY / this.height) * 2 + 1;
            this.raycaster.setFromCamera( this.pointer, this.camera );

            const intersects = this.raycaster.intersectObjects( [this.planeMesh] );
            if ( intersects.length > 0 ) {
                this.dummy.position.copy(intersects[0].point);
                this.simulationMaterial.uniforms.uMouse.value = intersects[0].point;
            }
        });
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    // Frame Buffer Output
    setupFBO() {
        // Create data texture
        this.material = new THREE.MeshNormalMaterial();

        const data = new Float32Array( 4 * this.number ); // 4 corresponds to 4 dimensions of vec4 from shader
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const index = i * this.size + j;
                data[ 4 * index ] = lerp( -0.5, 0.5, j / ( this.size - 1 ) );
                data[ 4 * index + 1 ] = lerp( -0.5, 0.5, i / ( this.size - 1 ) );
                data[ 4 * index + 2 ] = 0;
                data[ 4 * index + 3 ] = 1;
            }    
        }
        
        this.positions = new THREE.DataTexture( data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType );
        this.positions.needsUpdate = true;

        // Create FBO scene
        this.sceneFBO = new THREE.Scene();
        this.cameraFBO = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2);
        this.cameraFBO.position.z = 1;
        this.cameraFBO.lookAt(new THREE.Vector3( 0, 0, 0 ))

        let geo = new THREE.PlaneGeometry( 2, 2, 2, 2 );
        this.simulationMaterial = new THREE.MeshBasicMaterial( {
            color: 0xff0000,
            wireframe: true,
        } );
        this.simulationMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0},
                uMouse: {value: new THREE.Vector3(0, 0, 0)},
                uTime: {value:0},
                uProgress: {value:0},
                uCurrentPosition: {value: this.data1},
                uOriginalPosition: {value: this.data1},
                uOriginalPosition1: {value: this.data2},
            },
            vertexShader: simulationVertexShader,
            fragmentShader: simulationFragmentShader,
        });
        this.simulationMesh = new THREE.Mesh(geo, this.simulationMaterial);
        this.sceneFBO.add(this.simulationMesh);

        this.renderTarget = new THREE.WebGLRenderTarget(this.size, this.size, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        })

        this.renderTarget1 = new THREE.WebGLRenderTarget(this.size, this.size, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        })
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        
        this.camera.updateProjectionMatrix();
    }

    addObjects() {
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array( 3 * this.number ); // 3 means per each vertex
        const uvs = new Float32Array( 2 * this.number ); // 2 dimensional coordinates
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const index = i * this.size + j;

                positions[ 3 * index ] = ( j / this.size ) - 0.5;
                positions[ 3 * index + 1 ] = ( i / this.size ) - 0.5;
                positions[ 3 * index + 2 ] = 0;
                uvs[ 2 * index ] = j / (this.size - 1);
                uvs[ 2 * index + 1 ] = i / (this.size - 1);
            }    
        }
        this.geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) )
        this.geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) )

    

        this.material = new THREE.MeshNormalMaterial();

        const data = new Float32Array( 4 * this.number ); // 4 corresponds to 4 dimensions of vec4 from shader
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const index = i * this.size + j;
                data[ 4 * index ] = Math.random() * 2 - 1;
                data[ 4 * index + 1 ] = Math.random() * 2 - 1;
                data[ 4 * index + 2 ] = 0;
                data[ 4 * index + 3 ] = 1;
            }    
        }
        
        this.positions = new THREE.DataTexture( data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType );
        this.positions.needsUpdate = true;


        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0},
                // uTexture: { value: new THREE.TextureLoader().load(texture) },
                uTexture: { value: this.positions },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            wireframe: false,
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.mesh);
    }
    
    render() {
        this.time += 0.05;

        this.material.uniforms.time.value = this.time; // to have access to the 'time' from shaders?
        
        // this.renderer.render(this.scene, this.camera);
        
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.sceneFBO, this.cameraFBO);
        
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);

        // swap render targets
        const tmp = this.renderTarget;
        this.renderTarget = this.renderTarget1;
        this.renderTarget1 = tmp;

        this.material.uniforms.uTexture.value = this.renderTarget.texture;
        this.simulationMaterial.uniforms.uCurrentPosition.value = this.renderTarget1.texture;
        this.simulationMaterial.uniforms.uTime.value = this.time;

        window.requestAnimationFrame(this.render.bind(this))
    }
}

new Sketch({
    dom: document.getElementById('container'),
});