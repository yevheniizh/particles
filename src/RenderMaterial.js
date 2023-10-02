import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";


const RenderMaterial = shaderMaterial(
    {
        time: 0,
    },
    // vertex shader
    `
    attribute vec2 ref;
    varying vec2 vRef;
    void main() {
      vRef = ref;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 5.0;
    }
    `,
    `
    varying vec2 vRef;
    void main() {
      gl_FragColor.rgba = vec4(vRef,0., 1.0);
    }
    `,
)

extend({ RenderMaterial })