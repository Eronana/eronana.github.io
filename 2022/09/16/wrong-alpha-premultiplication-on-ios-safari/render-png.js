(function() {
  const regl = createREGL(document.getElementById('texture-canvas'));
  const image = document.getElementById('original-image');
  const draw = () => regl({
    frag: `
    precision mediump float;
    uniform sampler2D texture;
    varying vec2 uv;
    void main () {
      vec4 color = texture2D(texture, uv);
      vec3 emissiveColor = vec3(1, 0, 0); // let red be the emissive color
      gl_FragColor = vec4(color.rgb + color.a * emissiveColor, 1);
    }
    `,
    vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    void main () {
      gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
      uv = position.xy * 0.5 + 0.5;
    }`,

    attributes: {
      position: [
        -2, 0,
        0, -2,
        2, 2,
      ],
    },

    uniforms: {
      texture: regl.texture(image)
    },
    count: 3,
  })();
  if (image.complete) {
    draw();
  } else {
    image.onload = draw;
  }
})();