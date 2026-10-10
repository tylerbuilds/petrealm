# Drawing Petrealm

Petrealm's scenery, companions, supplies and treasures are original SVG art,
included under the project's MIT licence. The game downloads no fonts, images
or textures from other sites.

The world has five materials: leafy greens, warm cream paper, rosy clay,
golden wood and lavender moonlight. The colours live at the top of
`styles.css`. Dark ink, generous buttons and quiet space behind words keep
the little details from making the game harder to use.

## Where the drawings live

| File | Drawings |
| --- | --- |
| `src/art.js` | Meadow sky, world map, supplies and the first three companions |
| `src/creatures.js` | Animal and monster companions, with their wardrobe anchors |
| `src/world-art.js` | Meadow buildings, market stalls, glen lanterns, training grove and guides |
| `src/trail-art.js` | Woodland, pond and ridge trails, and their nine treasures |

The meadow and place arrivals have separate portrait compositions on phones.
They keep the buildings and small discoveries in view while leaving room for
the companion. The map's signposts sit below the drawing on small screens.

Keep the SVGs self-contained. Avoid global IDs, scripts, external image links
and filters that make a whole landscape costly to paint. A companion may
appear several times on one page, so one drawing must never change another.

The landscape stays still. Only the meadow companion gently moves; the
browser's reduced-motion setting switches that off. Clothing, growth and
treasure placement use the existing save data.

## Your own scenery

Choose **Scenery** beside the map button to open **Your world art**. Pick a
picture for your meadow, or for the market, games and training arrivals.
**Fill the scene** crops the edges to fill the space. **Show whole picture**
keeps the whole drawing in view. **Use Petrealm scenery** brings the original
art back.

Pictures stay on this device, in this browser. They aren't included in a world
save file and aren't uploaded anywhere. Keep the original files if you want
to use them on another device.

PNG, JPEG and WebP pictures can be up to 8 MiB, 6,000 pixels on either side and
25 million pixels altogether. The game checks the file before decoding it,
then resizes and re-encodes it to no more than 1,600 pixels on either side and
512 KiB per picture. Only one picture is prepared at a time.

`src/world-theme.js` keeps the two pictures and their fit choices under
`petrealm.world-art.v1`. This is separate from every world save and recovery
key. Failed storage writes retain the previous pictures. Closing the panel,
changing places or switching tabs cancels a pending choice. If a retained
picture can't be opened, the original scenery returns and the panel explains
how to choose another.
