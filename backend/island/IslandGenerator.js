/**
 * Island Generator - Procedural island generation based on MC value
 */

import {
    MC_SIZE_THRESHOLDS,
    GRASS_VARIANTS,
    DIRT_VARIANTS,
    DEEP_WATER_VARIANTS,
    OCEAN_ROCK_VARIANTS,
    SHALLOW_WATER_EDGES,
    SHALLOW_WATER_CORNERS,
    DECORATION_TYPES,
    WALK_CONFIG
} from './islandConfig.js';

export class IslandGenerator {
    /**
     * Generate island based on MC value
     */
    static generate(mc) {
        // Determine grid size based on MC
        const gridSize = this.getGridSizeFromMC(mc);
        console.log(`🏝️ Generating island: ${gridSize}x${gridSize} (MC: ${mc})`);

        // Initialize grid with deep water
        const tiles = this.initializeGrid(gridSize);

        // Calculate target land tiles (roughly 50-70% of grid)
        const targetLandTiles = Math.floor(gridSize * gridSize * 0.6);

        // Generate land using random walk
        const landTiles = this.generateLandTiles(gridSize, targetLandTiles);

        // Assign tile types to land tiles
        this.assignLandTileTypes(landTiles, gridSize);

        // Update tiles array with land tiles
        for (const landTile of landTiles) {
            const index = landTile.y * gridSize + landTile.x;
            tiles[index] = landTile;
        }

        // Generate shallow water transitions
        this.generateShallowWaterTransitions(tiles, landTiles, gridSize);

        // Add ocean rocks to deep water
        this.addOceanRocks(tiles, gridSize);

        // Generate decorations
        const decorations = this.generateDecorations(landTiles);

        return {
            gridSize,
            tiles,
            decorations
        };
    }

    /**
     * Get grid size from MC value
     */
    static getGridSizeFromMC(mc) {
        for (const threshold of MC_SIZE_THRESHOLDS) {
            if (mc <= threshold.maxMC) {
                return threshold.gridSize;
            }
        }
        return MC_SIZE_THRESHOLDS[MC_SIZE_THRESHOLDS.length - 1].gridSize;
    }

    /**
     * Initialize grid with deep water tiles
     */
    static initializeGrid(gridSize) {
        const tiles = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                tiles.push({
                    x,
                    y,
                    type: 'deep_water',
                    variant: this.weightedRandom(DEEP_WATER_VARIANTS),
                    walkable: false
                });
            }
        }
        return tiles;
    }

    /**
     * Generate land tiles using random walk algorithm
     */
    static generateLandTiles(gridSize, targetCount) {
        const landTiles = new Set();
        const center = Math.floor(gridSize / 2);

        // Start from center
        const startTile = { x: center, y: center };
        landTiles.add(`${startTile.x},${startTile.y}`);

        // Current positions for multiple walkers
        const walkers = [{ ...startTile }];

        // Random walk until target reached
        while (landTiles.size < targetCount && walkers.length > 0) {
            const walker = walkers[Math.floor(Math.random() * walkers.length)];

            // Pick random direction (weighted toward cardinal)
            const direction = this.getRandomDirection();
            const newX = walker.x + direction.dx;
            const newY = walker.y + direction.dy;

            // Check bounds
            if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                const key = `${newX},${newY}`;
                if (!landTiles.has(key)) {
                    landTiles.add(key);
                    walkers.push({ x: newX, y: newY });

                    // Occasionally remove walkers to keep island compact
                    if (Math.random() < 0.1 && walkers.length > 2) {
                        walkers.splice(Math.floor(Math.random() * walkers.length), 1);
                    }
                }
                // Move walker
                walker.x = newX;
                walker.y = newY;
            }
        }

        // Convert Set to array of tile objects
        const result = [];
        for (const key of landTiles) {
            const [x, y] = key.split(',').map(Number);
            result.push({ x, y, type: 'grass', variant: 'grass_full_mid', walkable: true });
        }

        return result;
    }

    /**
     * Get random direction with weighted preference for cardinal directions
     */
    static getRandomDirection() {
        const rand = Math.random();
        const directions = {
            cardinal: [
                { dx: 0, dy: -1 },  // North
                { dx: 1, dy: 0 },   // East
                { dx: 0, dy: 1 },   // South
                { dx: -1, dy: 0 }   // West
            ],
            diagonal: [
                { dx: 1, dy: -1 },  // NE
                { dx: 1, dy: 1 },   // SE
                { dx: -1, dy: 1 },  // SW
                { dx: -1, dy: -1 }  // NW
            ]
        };

        if (rand < WALK_CONFIG.CARDINAL_WEIGHT) {
            return directions.cardinal[Math.floor(Math.random() * directions.cardinal.length)];
        } else {
            return directions.diagonal[Math.floor(Math.random() * directions.diagonal.length)];
        }
    }

    /**
     * Assign tile types to land tiles (grass vs dirt based on position)
     */
    static assignLandTileTypes(landTiles, gridSize) {
        const center = gridSize / 2;

        for (const tile of landTiles) {
            // Calculate distance from center
            const distFromCenter = Math.sqrt(
                Math.pow(tile.x - center, 2) + Math.pow(tile.y - center, 2)
            );
            const maxDist = gridSize / 2;
            const normalizedDist = distFromCenter / maxDist;

            // Center = grass, edges = dirt
            if (normalizedDist < 0.4) {
                tile.type = 'grass';
                tile.variant = this.weightedRandom(GRASS_VARIANTS);
            } else if (normalizedDist < 0.7) {
                // Mix of grass and dirt
                tile.type = Math.random() < 0.5 ? 'grass' : 'dirt';
                tile.variant = tile.type === 'grass'
                    ? this.weightedRandom(GRASS_VARIANTS)
                    : this.weightedRandom(DIRT_VARIANTS);
            } else {
                // Outer ring = mostly dirt
                tile.type = 'dirt';
                tile.variant = this.weightedRandom(DIRT_VARIANTS);
            }

            tile.walkable = true;
        }
    }

    /**
     * Generate shallow water transitions at land edges
     */
    static generateShallowWaterTransitions(tiles, landTiles, gridSize) {
        const landSet = new Set(landTiles.map(t => `${t.x},${t.y}`));

        for (const landTile of landTiles) {
            const { x, y } = landTile;

            // Check 8 neighbors for water
            const neighbors = [
                { dx: 0, dy: -1, dir: 'N' },
                { dx: 1, dy: 0, dir: 'E' },
                { dx: 0, dy: 1, dir: 'S' },
                { dx: -1, dy: 0, dir: 'W' },
                { dx: 1, dy: -1, dir: 'NE' },
                { dx: 1, dy: 1, dir: 'SE' },
                { dx: -1, dy: 1, dir: 'SW' },
                { dx: -1, dy: -1, dir: 'NW' }
            ];

            for (const neighbor of neighbors) {
                const nx = x + neighbor.dx;
                const ny = y + neighbor.dy;

                // Check bounds
                if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;

                const neighborKey = `${nx},${ny}`;
                if (!landSet.has(neighborKey)) {
                    // This is a water tile adjacent to land
                    const tileIndex = ny * gridSize + nx;
                    const waterTile = tiles[tileIndex];

                    // Only update if still deep water
                    if (waterTile.type === 'deep_water') {
                        waterTile.type = 'shallow_water';

                        // Assign transition variant based on direction
                        if (SHALLOW_WATER_EDGES[neighbor.dir]) {
                            waterTile.variant = SHALLOW_WATER_EDGES[neighbor.dir];
                        } else if (SHALLOW_WATER_CORNERS[neighbor.dir]) {
                            waterTile.variant = SHALLOW_WATER_CORNERS[neighbor.dir];
                        } else {
                            waterTile.variant = 'shallow_water_full';
                        }

                        waterTile.walkable = false;  // Shallow water = shore boundary
                    }
                }
            }
        }
    }

    /**
     * Add ocean rocks to deep water tiles
     */
    static addOceanRocks(tiles, gridSize) {
        for (const tile of tiles) {
            if (tile.type === 'deep_water' && Math.random() < WALK_CONFIG.OCEAN_ROCK_CHANCE) {
                tile.type = 'ocean_rocks';
                tile.variant = this.weightedRandom(OCEAN_ROCK_VARIANTS);
                tile.walkable = false;
            }
        }
    }

    /**
     * Generate decorations on land tiles
     */
    static generateDecorations(landTiles) {
        const decorations = [];

        for (const tile of landTiles) {
            // Try each decoration type
            for (const [typeName, typeData] of Object.entries(DECORATION_TYPES)) {
                if (Math.random() < typeData.weight) {
                    const variant = typeData.variants[Math.floor(Math.random() * typeData.variants.length)];
                    decorations.push({
                        x: tile.x,
                        y: tile.y,
                        variant,
                        collision: typeData.collision
                    });
                    break;  // Only one decoration per tile
                }
            }
        }

        console.log(`🌸 Generated ${decorations.length} decorations`);
        return decorations;
    }

    /**
     * Weighted random selection
     */
    static weightedRandom(weights) {
        const items = Object.keys(weights);
        const cumulativeWeights = [];
        let sum = 0;

        for (const item of items) {
            sum += weights[item];
            cumulativeWeights.push(sum);
        }

        const random = Math.random() * sum;
        for (let i = 0; i < cumulativeWeights.length; i++) {
            if (random < cumulativeWeights[i]) {
                return items[i];
            }
        }

        return items[items.length - 1];
    }
}
