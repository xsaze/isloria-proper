/**
 * Island Generator - Procedural island generation based on MC value
 * FIXED 80x80 GRID - Island grows from center outward
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
     * Generate island based on MC value - FIXED 80x80 GRID
     * OPTIMIZED: Only generates land and shallow water tiles (no ocean/deep water)
     */
    static generate(mc) {
        const gridSize = 80;  // Always use 80x80 grid
        const targetLandTiles = this.calculateTargetLandTiles(mc);
        // Reduced logging - only log on significant generation
        // console.log(`🏝️ Generating island: ${gridSize}x${gridSize} (MC: ${mc}, Target tiles: ${targetLandTiles})`);

        // OPTIMIZATION: Only store land tiles, not entire grid
        const landTiles = [];
        const landTileSet = new Set();

        // Create initial center island (2x2 or 3x3)
        this.createCenterIslandOptimized(landTiles, landTileSet, gridSize, targetLandTiles);

        // Grow island tile-by-tile until reaching target
        this.growIslandToTargetOptimized(landTiles, landTileSet, targetLandTiles, gridSize);

        // Assign tile types to land tiles (grass vs dirt)
        this.assignLandTileTypes(landTiles, gridSize);

        // Generate shallow water transitions
        const shallowWaterTiles = this.generateShallowWaterTransitions(landTileSet, gridSize);

        // Combine land and shallow water tiles
        const tiles = [...landTiles, ...shallowWaterTiles];

        // Generate decorations
        const decorations = this.generateDecorationsFromSet(landTiles, landTileSet);

        return {
            gridSize,
            tiles,
            decorations
        };
    }

    /**
     * Get grid size from MC value (kept for compatibility)
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
     * Create initial center island - OPTIMIZED VERSION
     * Only creates land tiles, no grid initialization
     */
    static createCenterIslandOptimized(landTiles, landTileSet, gridSize, targetLandTiles) {
        const center = Math.floor(gridSize / 2);

        // Use 3x3 center for large islands, 2x2 for smaller
        const startPositions = targetLandTiles > 50 ? [
            // 3x3 center
            { x: center - 1, y: center - 1 },
            { x: center, y: center - 1 },
            { x: center + 1, y: center - 1 },
            { x: center - 1, y: center },
            { x: center, y: center },
            { x: center + 1, y: center },
            { x: center - 1, y: center + 1 },
            { x: center, y: center + 1 },
            { x: center + 1, y: center + 1 }
        ] : [
            // 2x2 center
            { x: center, y: center },
            { x: center + 1, y: center },
            { x: center, y: center + 1 },
            { x: center + 1, y: center + 1 }
        ];

        for (const pos of startPositions) {
            landTiles.push({
                x: pos.x,
                y: pos.y,
                type: 'grass',
                variant: 'grass_full_mid',
                walkable: true
            });
            landTileSet.add(`${pos.x},${pos.y}`);
        }
    }

    /**
     * Grow island to target - OPTIMIZED VERSION
     * Only creates land tiles, no grid manipulation
     */
    static growIslandToTargetOptimized(landTiles, landTileSet, targetCount, gridSize) {
        let iterations = 0;
        const maxIterations = targetCount * 2;

        while (landTileSet.size < targetCount && iterations < maxIterations) {
            iterations++;

            // Find all water tiles adjacent to land
            const candidates = this.findGrowthCandidates(landTileSet, gridSize);

            if (candidates.length === 0) {
                // console.warn(`⚠️ No more growth candidates. Reached ${landTileSet.size}/${targetCount} tiles`);
                break;
            }

            // Randomly select one candidate
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const selectedTile = candidates[randomIndex];

            // Create new land tile
            landTiles.push({
                x: selectedTile.x,
                y: selectedTile.y,
                type: 'grass',
                variant: 'grass_full_mid',
                walkable: true
            });

            // Add to land set
            landTileSet.add(`${selectedTile.x},${selectedTile.y}`);
        }

        // console.log(`🌱 Island grown to ${landTileSet.size} land tiles`);
    }

    /**
     * Calculate target number of land tiles based on MC
     * 1 tile per 400 MC, capped at maximum tiles that fit in 80x80 grid
     */
    static calculateTargetLandTiles(mc) {
        const tilesPerMC = 1 / 400;  // 1 tile per 400 MC
        const targetTiles = Math.floor(mc * tilesPerMC);

        // Cap at reasonable maximum (80% of 80x80 grid = 5120 tiles)
        const maxTiles = Math.floor(80 * 80 * 0.8);

        // Minimum 4 tiles (2x2 starting island)
        return Math.max(4, Math.min(targetTiles, maxTiles));
    }

    /**
     * Calculate required grid size based on target land tiles
     * Grid expands to accommodate the island with water border
     */
    static calculateGridSize(targetLandTiles) {
        // Estimate island diameter (assuming roughly circular shape at 80% density)
        const estimatedDiameter = Math.ceil(Math.sqrt(targetLandTiles / 0.8)) * 2;

        // Add padding for water border (at least 5 tiles on each side)
        const gridSize = estimatedDiameter + 10;

        // Clamp between minimum 13 and maximum 100
        return Math.max(13, Math.min(gridSize, 100));
    }

    /**
     * Create initial center island (2x2 or 3x3)
     */
    static createCenterIsland(tiles, gridSize, targetLandTiles) {
        const center = Math.floor(gridSize / 2);
        const landTileSet = new Set();

        // Use 3x3 center for large islands, 2x2 for smaller
        const startPositions = targetLandTiles > 50 ? [
            // 3x3 center
            { x: center - 1, y: center - 1 },
            { x: center, y: center - 1 },
            { x: center + 1, y: center - 1 },
            { x: center - 1, y: center },
            { x: center, y: center },
            { x: center + 1, y: center },
            { x: center - 1, y: center + 1 },
            { x: center, y: center + 1 },
            { x: center + 1, y: center + 1 }
        ] : [
            // 2x2 center
            { x: center, y: center },
            { x: center + 1, y: center },
            { x: center, y: center + 1 },
            { x: center + 1, y: center + 1 }
        ];

        for (const pos of startPositions) {
            const index = pos.y * gridSize + pos.x;
            tiles[index].type = 'grass';
            tiles[index].variant = 'grass_full_mid';
            tiles[index].walkable = true;
            landTileSet.add(`${pos.x},${pos.y}`);
        }

        return landTileSet;
    }

    /**
     * Find all water tiles adjacent (orthogonally) to land
     */
    static findGrowthCandidates(landTileSet, gridSize) {
        const candidates = [];
        const cardinalDirections = [
            { dx: 0, dy: -1 },  // North
            { dx: 1, dy: 0 },   // East
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 0 }   // West
        ];

        const checkedWaterTiles = new Set();

        for (const landKey of landTileSet) {
            const [x, y] = landKey.split(',').map(Number);

            for (const dir of cardinalDirections) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                // Bounds check
                if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;

                const neighborKey = `${nx},${ny}`;

                // Skip if already land or already checked
                if (landTileSet.has(neighborKey) || checkedWaterTiles.has(neighborKey)) continue;

                checkedWaterTiles.add(neighborKey);
                candidates.push({ x: nx, y: ny });
            }
        }

        return candidates;
    }

    /**
     * Grow island tile-by-tile until reaching target
     */
    static growIslandToTarget(tiles, landTileSet, targetCount, gridSize) {
        let iterations = 0;
        const maxIterations = targetCount * 2;

        while (landTileSet.size < targetCount && iterations < maxIterations) {
            iterations++;

            // Find all water tiles adjacent to land
            const candidates = this.findGrowthCandidates(landTileSet, gridSize);

            if (candidates.length === 0) {
                console.warn(`⚠️ No more growth candidates. Reached ${landTileSet.size}/${targetCount} tiles`);
                break;
            }

            // Randomly select one candidate
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const selectedTile = candidates[randomIndex];

            // Convert to land
            const tileIndex = selectedTile.y * gridSize + selectedTile.x;
            tiles[tileIndex].type = 'grass';
            tiles[tileIndex].variant = 'grass_full_mid';
            tiles[tileIndex].walkable = true;

            // Add to land set
            landTileSet.add(`${selectedTile.x},${selectedTile.y}`);
        }

        console.log(`🌱 Island grown to ${landTileSet.size} land tiles`);
    }

    /**
     * Assign tile types to land tiles - OPTIMIZED VERSION
     * Works directly on landTiles array instead of using grid indices
     */
    static assignLandTileTypes(landTiles, gridSize) {
        const center = gridSize / 2;
        const variantCounts = {};

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
                tile.type = Math.random() < 0.5 ? 'grass' : 'dirt';
                tile.variant = tile.type === 'grass'
                    ? this.weightedRandom(GRASS_VARIANTS)
                    : this.weightedRandom(DIRT_VARIANTS);
            } else {
                tile.type = 'dirt';
                tile.variant = this.weightedRandom(DIRT_VARIANTS);
            }

            tile.walkable = true;

            // Track variants for debugging
            const key = `${tile.type}:${tile.variant}`;
            variantCounts[key] = (variantCounts[key] || 0) + 1;
        }

        // console.log('🎨 Tile variant distribution:', variantCounts);
    }

    /**
     * Generate shallow water transitions - OPTIMIZED VERSION
     * Creates new shallow water tiles only where needed
     */
    static generateShallowWaterTransitions(landTileSet, gridSize) {
        const allDirections = [
            { dx: 0, dy: -1, dir: 'N' },
            { dx: 1, dy: 0, dir: 'E' },
            { dx: 0, dy: 1, dir: 'S' },
            { dx: -1, dy: 0, dir: 'W' },
            { dx: 1, dy: -1, dir: 'NE' },
            { dx: 1, dy: 1, dir: 'SE' },
            { dx: -1, dy: 1, dir: 'SW' },
            { dx: -1, dy: -1, dir: 'NW' }
        ];

        const shallowWaterTiles = [];
        const shallowWaterSet = new Set();

        for (const landKey of landTileSet) {
            const [x, y] = landKey.split(',').map(Number);

            for (const neighbor of allDirections) {
                const nx = x + neighbor.dx;
                const ny = y + neighbor.dy;

                // Bounds check
                if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;

                const neighborKey = `${nx},${ny}`;

                // If not land and not already shallow water
                if (!landTileSet.has(neighborKey) && !shallowWaterSet.has(neighborKey)) {
                    // Assign transition variant based on direction
                    let variant;
                    if (SHALLOW_WATER_EDGES[neighbor.dir]) {
                        variant = SHALLOW_WATER_EDGES[neighbor.dir];
                    } else if (SHALLOW_WATER_CORNERS[neighbor.dir]) {
                        variant = SHALLOW_WATER_CORNERS[neighbor.dir];
                    } else {
                        variant = 'shallow_water_full';
                    }

                    shallowWaterTiles.push({
                        x: nx,
                        y: ny,
                        type: 'shallow_water',
                        variant: variant,
                        walkable: false
                    });

                    shallowWaterSet.add(neighborKey);
                }
            }
        }

        return shallowWaterTiles;
    }

    /**
     * Generate decorations on land tiles
     */
    static generateDecorationsFromSet(tiles, landTileSet) {
        const decorations = [];

        for (const landKey of landTileSet) {
            const [x, y] = landKey.split(',').map(Number);

            // Try each decoration type
            for (const [typeName, typeData] of Object.entries(DECORATION_TYPES)) {
                if (Math.random() < typeData.weight) {
                    const variant = typeData.variants[Math.floor(Math.random() * typeData.variants.length)];
                    decorations.push({
                        x,
                        y,
                        variant,
                        collision: typeData.collision
                    });
                    break;  // Only one decoration per tile
                }
            }
        }

        // console.log(`🌸 Generated ${decorations.length} decorations`);
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
