import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const SimulationMaterial = shaderMaterial(
    {
        uPosition:         null,
        uOriginalPosition: null,
        uMouse:            new THREE.Vector3(-10, -10, -10),
    },
    // vertex shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 2.0;
    }
    `,
    `
    varying vec2 vUv;
    uniform sampler2D uPosition;
    uniform sampler2D uOriginalPosition;
    uniform vec3 uMouse;
    void main() {
        vec2 position = texture2D( uPosition, vUv ).xy;
        vec2 original = texture2D( uOriginalPosition, vUv ).xy;
        vec2 velocity = texture2D( uPosition, vUv ).zw;
    
        velocity *= 0.99;
    
        // mouse attraction to shape force
        vec2 direction = normalize( original - position );
        float dist = length( original - position );
        if( dist > 0.01 ) {
            velocity += direction * 0.0001;
        }
    
    
        // mouse repel force
        float mouseDistance = distance( position, uMouse.xy );
        float maxDistance = 0.4;
        if( mouseDistance < maxDistance ) {
            vec2 direction = normalize( position - uMouse.xy );
            velocity += direction * ( 1.0 - mouseDistance / maxDistance ) * 0.01;
        }

        position.xy += velocity;
    
        gl_FragColor = vec4( position, velocity );
    }
    `,
)

extend({ SimulationMaterial })