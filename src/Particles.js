
import { useRef } from 'react';
import * as THREE from 'three';
import './RenderMaterial'
import './SimulationMaterial'
import { getDataTexture } from './getDataTexture';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';

export function Particles(){
    const SIZE = 1024;

    const particles = new Float32Array(SIZE * SIZE * 3);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const k = i * SIZE + j;
            particles[k * 3 + 0] = 5*i / SIZE;
            particles[k * 3 + 1] = 5*j / SIZE;
            particles[k * 3 + 2] = 0;
        }
    }

    const ref = new Float32Array(SIZE * SIZE * 2);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const k = i * SIZE + j;
            ref[k * 2 + 0] = i / (SIZE-1);
            ref[k * 2 + 1] = j / (SIZE-1);
        }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    let target0 = useFBO( SIZE, SIZE, {
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        type: THREE.FloatType,
    });
    let target1 = useFBO( SIZE, SIZE, {
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        type: THREE.FloatType,
    });
    const simulationMaterial = useRef();
    const renderMaterial = useRef();
    const followMouse = useRef();

    const { viewport } = useThree();

    const originalPosition = getDataTexture(SIZE);

    useFrame(({mouse}) => {
        followMouse.current.position.x = mouse.x * viewport.width / 2;
        followMouse.current.position.y = mouse.y * viewport.height / 2;

        simulationMaterial.current.uniforms.uMouse.value.x = followMouse.current.position.x;
        simulationMaterial.current.uniforms.uMouse.value.y = followMouse.current.position.y;
    });

    useFrame(({gl}) => {
        gl.setRenderTarget(target0);
        gl.render(scene, camera);
        gl.setRenderTarget(null);

        renderMaterial.current.uniforms.uPosition.value = target1.texture;
        simulationMaterial.current.uniforms.uPosition.value = target0.texture;

        // [target0, target1] = [target1, target0];

        let temp = target0;
        target0 = target1;
        target1 = temp;
    });

    return(
        <>
            {createPortal(
                <mesh>
                    <planeGeometry args={[2, 2]} />
                    <simulationMaterial
                        ref={simulationMaterial}
                        uPosition={originalPosition}
                        uOriginalPosition={originalPosition}
                    />
                </mesh>,
                scene,
            )}
            <mesh ref={followMouse}>
                <sphereGeometry args={[0.1, 32, 32]} />
                <meshBasicMaterial color="red" />
            </mesh>
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count ={particles.length / 3}
                        array={particles}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-ref"
                        count ={ref.length / 3}
                        array={ref}
                        itemSize={2}
                    />
                </bufferGeometry>
                <renderMaterial transparent blending={THREE.AdditiveBlending} ref={renderMaterial} />
            </points>
        </>
    )
}