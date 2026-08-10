const { hb, font } = await harfbuzz();
const buffer = hb.createBuffer();
buffer.addText("LoftType");
buffer.guessSegmentProperties();
hb.shape(font, buffer);

const extents = font.hExtents();
let x = 0;
const paths = buffer.json().map(glyph => {
  const path = font.glyphToPath(glyph.g);
  const transform = `translate(${x + glyph.dx} ${glyph.dy})`;
  x += glyph.ax;
  return `<path d="${path}" transform="${transform}"/>`;
});

const height = extents.ascender - extents.descender;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height}">
<g transform="translate(0 ${extents.ascender}) scale(1 -1)" fill="#8e3a4a">
${paths.join("")}
</g></svg>`;
display_svg(svg);
