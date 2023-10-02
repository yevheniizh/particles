
import { useRef } from 'react';
import * as THREE from 'three';
import './RenderMaterial'
import './SimulationMaterial'
import { getDataTexture, getSphereTexture, getVelocityTexture } from './getDataTexture';
import { useFrame, useThree } from '@react-three/fiber';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

import simulationFragmentPosition from './shaders/simulationFragmentPosition';
import simulationFragmentVelocity from './shaders/simulationFragmentVelocity';

export function Particles(){
    const SIZE = 16;
    const { gl, viewport} = useThree();

    const simulationMaterial = useRef();
    const renderMaterial = useRef();
    const followMouse = useRef();

    const gpuCompute = new GPUComputationRenderer( SIZE, SIZE, gl );

    const pointsOnSphere = getSphereTexture(SIZE);

    const positionVariable = gpuCompute.addVariable( 'uCurrentPosition', simulationFragmentPosition, pointsOnSphere );
    const velocityVariable = gpuCompute.addVariable( 'uCurrentVelocity', simulationFragmentVelocity, getVelocityTexture(SIZE) );

    gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
    gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );

    const positionUniforms = positionVariable.material.uniforms;
    const velocityUniforms = velocityVariable.material.uniforms;

    velocityUniforms.uMouse = { value : new THREE.Vector3(0, 0, 0) };
    positionUniforms.uOriginalPosition = { value: pointsOnSphere };
    velocityUniforms.uOriginalPosition = { value: pointsOnSphere };

    gpuCompute.init();

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

    const originalPosition = getDataTexture(SIZE);

    useFrame(({mouse}) => {
        followMouse.current.position.x = mouse.x * viewport.width / 2;
        followMouse.current.position.y = mouse.y * viewport.height / 2;

        velocityUniforms.uMouse.value.x = followMouse.current.position.x;
        velocityUniforms.uMouse.value.y = followMouse.current.position.y;
    });

    useFrame(({gl}) => {
        gpuCompute.compute();
        renderMaterial.current.uniforms.uPosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;



        // gl.setRenderTarget(target0);
        // gl.render(scene, camera);
        // gl.setRenderTarget(null);

        // renderMaterial.current.uniforms.uPosition.value = target1.texture;
        // simulationMaterial.current.uniforms.uPosition.value = target0.texture;

        // // [target0, target1] = [target1, target0];

        // let temp = target0;
        // target0 = target1;
        // target1 = temp;
    });

    return(
        <>
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