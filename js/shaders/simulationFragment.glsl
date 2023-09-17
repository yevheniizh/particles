varying vec2 vUv;
uniform float uProgress;
uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform sampler2D uOriginalPosition1;
uniform vec3 uMouse;
void main() {
    vec2 position = texture2D( uCurrentPosition, vUv ).xy;
    vec2 original = texture2D( uOriginalPosition, vUv ).xy;
    vec2 original1 = texture2D( uOriginalPosition1, vUv ).xy;

    vec2 velocity = texture2D( uCurrentPosition, vUv ).zw;

    vec2 finalOriginal = mix(original, original1, uProgress);

    velocity *= 0.99;

    // mouse attraction to shape force
    vec2 direction = normalize( finalOriginal - position );
    float dist = length( finalOriginal - position );
    if( dist > 0.01 ) {
        velocity += direction * 0.0001;
    }


    // mouse repel force
    float mouseDistance = distance( position, uMouse.xy );
    float maxDistance = 0.1;
    if( mouseDistance < maxDistance ) {
        vec2 direction = normalize( position - uMouse.xy );
        velocity += direction * ( 1.0 - mouseDistance / maxDistance ) * 0.01;
    }

    position.xy += velocity;

    gl_FragColor = vec4( position, velocity );
}