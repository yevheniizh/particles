varying vec2 vUv;
uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform vec3 uMouse;
void main() {
    vec2 position = texture2D( uCurrentPosition, vUv ).xy;
    vec2 original = texture2D( uOriginalPosition, vUv ).xy;

    vec2 force = original - uMouse.xy;

    float len = length(force);
    float forceFactor = 1./max(1.,len * 5.);

    vec2 positionToGo = original + normalize( force ) * forceFactor * 0.6;

    position.xy += (positionToGo - position.xy) * 0.1;

    // position.xy += normalize( position.xy ) * 0.001;

    gl_FragColor = vec4( position, 0.0, 1.0 );
}