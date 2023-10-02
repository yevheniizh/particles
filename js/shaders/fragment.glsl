varying vec2 vUv;
varying float vLife;
uniform sampler2D uTexture;
void main() {
    if(vLife < 0.001) discard; // do not render particle until its run
    vec4 color = texture2D( uTexture, vUv );
    gl_FragColor = vec4( 1.,1.,1., vLife );
    // gl_FragColor = color;
}