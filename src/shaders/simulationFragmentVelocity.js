export default `
    uniform float uProgress;
    // uniform sampler2D uCurrentPosition;
    uniform sampler2D uOriginalPosition;
    uniform vec3 uMouse;
    uniform float uTime;

    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vec2 vUv = gl_FragCoord.xy / resolution.xy;
        float offset = rand(vUv);
        vec3 position = texture2D( uCurrentPosition, vUv ).xyz;
        vec3 original = texture2D( uOriginalPosition, vUv ).xyz;
        vec3 velocity = texture2D( uCurrentVelocity, vUv ).xyz;

        // vec3 finalOriginal = original;

        // vec2 finalOriginal = mix(original, original1, uProgress);

        velocity *= 0.9;

        // mouse attraction to shape force
        vec3 direction = normalize( original - position );
        float dist = length( original - position );
        if( dist > 0.01 ) {
            velocity += direction * 0.001;
        }

        // mouse repel force
        float mouseDistance = distance( position, uMouse );
        float maxDistance = 0.6;
        if( mouseDistance < maxDistance ) {
            vec3 direction = normalize( position - uMouse );
            velocity += direction * ( 1.0 - mouseDistance / maxDistance ) * 0.01;
        }

        // lifespan of a particle
        // float lifespan = 10.;
        // float age = mod( uTime + lifespan * offset, lifespan ); // 0...20
        // if( age < 0.1 ) {
        //     // velocity = vec2(0.0,0.001);
        //     position.xyz = finalOriginal;
        // }

        // position.xy += velocity;

        gl_FragColor = vec4( velocity, 1. );
    }
`;
