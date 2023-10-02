
import './RenderMaterial'
const SIZE = 32;


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

export function Particles(){
    return(
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
            <renderMaterial />
        </points>
    )
}