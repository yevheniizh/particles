varying vec2 vUv;
uniform sampler2D uTexture;
void main() {
    vec4 position = texture2D( uTexture, vUv );
    // gl_FragColor = vec4( vUv,0., 1.0 );

    // position.x += 0.001;
    position.xy += normalize(position.xy - vec2(0.5,0.5)) * 0.01;

    gl_FragColor = position;
}