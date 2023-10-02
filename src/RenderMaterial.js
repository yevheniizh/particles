import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const RenderMaterial = shaderMaterial(
    {
        uPosition: null,
    },
    // vertex shader
    `
    attribute vec2 ref;
    varying vec2 vRef;
    uniform sampler2D uPosition;
    void main() {
      vRef = ref;
      vec3 pos = texture2D(uPosition, ref).rgb;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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