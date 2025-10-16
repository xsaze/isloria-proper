2.5D Isometric tiles for Growing Island scene

Types:

1. /decorations - Can only be placed on top of land tiles, since they are not fullsize tiles. Keep them on a seperate grid, and just overlay them on top of the main island.

2. /deep_water - They fill the whole grid initially and gradually getting replaced when the island grows.

3. /dirt - Type of land tiles.

4. /grass - Type of land tiles.

5. /ocean_rocks - These have a chance to be generated instead of deep_water tiles 1:10 ratio.

6. /shallow_water - These are mainly for shore tiles but can also be generated on the land as ponds/rivers. Create this around the island dynamically as it grows/shrinks. There are directions in their names, the direction is supposed to be a transition to the land.

Generation logic:

Random walk with some parameters:

- Keep a relatively square shape while generating the island, instead of truly random directions.

- Generate new land tiles with weighted chance based on adjastent tiles (excluding deep_water tiles since they will always be there)

Ex. If there is grass adjascent, chance for generated tile to be grass increases so its not totally random and there are biomes.

- Initial island size is 2x2 tiles.

- Generate/remove a tile for every 400 increase/decrease in "mc" state variable
