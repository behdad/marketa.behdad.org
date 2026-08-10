import io
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from loft import display_svg

data = await googlefonts("Fraunces")
font = TTFont(io.BytesIO(data))
glyphs = font.getGlyphSet()
hb_font = hb.Font(hb.Face(data))
buffer = hb.Buffer()
buffer.add_str("LoftType")
buffer.guess_segment_properties()
hb.shape(hb_font, buffer)
extents = hb_font.get_font_extents("ltr")
ascent, descent = extents.ascender, extents.descender

x = 0
paths = []
for info, position in zip(buffer.glyph_infos, buffer.glyph_positions):
    name = font.getGlyphName(info.codepoint)
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    gx = x + position.x_offset
    gy = position.y_offset
    paths.append(f'<path d="{pen.getCommands()}" transform="translate({gx} {gy})"/>')
    x += position.x_advance

height = ascent - descent
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x} {height}">
<g transform="translate(0 {ascent}) scale(1 -1)" fill="#8e3a4a">
{''.join(paths)}
</g></svg>'''
display_svg(svg)
