/**
 * Island Manager - Manages island state and regeneration
 */

import { IslandGenerator } from './IslandGenerator.js';
import { WalkableGrid } from './WalkableGrid.js';
import { OceanRocksGrid } from './OceanRocksGrid.js';
import { GRASS_VARIANTS, DIRT_VARIANTS, DEEP_WATER_VARIANTS } from './islandConfig.js';

export class IslandManager {
    constructor() {
        this.currentIsland = null;
        this.walkableGrid = null;
        this.oceanRocksGrid = null;  // Prerendered ocean rocks (static)
        this.lastMC = 0;
        this.maxGridSize = 80;  // Maximum island size
        this.targetLandTiles = 0;  // Target number of land tiles based on MC
        this.cachedIslandData = null;  // Cache for network transmission
        this.islandDataDirty = true;   // Flag to track if cache needs update

        // OPTIMIZATION: Track tile changes for delta updates
        this.lastTileUpdate = {
            added: [],
            removed: [],
            timestamp: Date.now()
        };
    }

    /**
     * Initialize island with starting MC value
     */
    initialize(initialMC = 0) {
        // Generate prerendered ocean rocks grid once at startup
        this.oceanRocksGrid = new OceanRocksGrid(this.maxGridSize);
        console.log('🌊 Ocean rocks grid initialized:', this.oceanRocksGrid.getStats());

        this.regenerateIsland(initialMC);
    }

    /**
     * Regenerate island based on MC value (initial generation only)
     */
    regenerateIsland(mc) {
        // console.log(`🏝️ Generating island for MC: ${mc}`);

        // Generate island with dynamic grid size
        const islandData = IslandGenerator.generate(mc);
        this.currentIsland = islandData;
        this.lastMC = mc;

        // Calculate target land tiles based on MC
        this.targetLandTiles = IslandGenerator.calculateTargetLandTiles(mc);

        // Create/update walkable grid using the island's actual grid size
        this.walkableGrid = new WalkableGrid(islandData.gridSize);
        this.walkableGrid.updateFromIsland(islandData);

        // Mark cache as dirty
        this.islandDataDirty = true;

        const walkableCount = this.walkableGrid.getWalkableTileCount();
        console.log(`✅ Island generated: ${islandData.gridSize}x${islandData.gridSize}, ${walkableCount} walkable tiles`);
    }

    /**
     * Calculate target number of land tiles based on MC (delegates to IslandGenerator)
     */
    calculateTargetLandTiles(mc) {
        return IslandGenerator.calculateTargetLandTiles(mc);
    }

    /**
     * Update island based on MC change
     * Simple and accurate: adds/removes exact number of tiles needed
     */
    updateForMC(mc) {
        if (!this.currentIsland) {
            this.regenerateIsland(mc);
            return true;
        }

        try {
            const targetLandTiles = this.calculateTargetLandTiles(mc);
            const currentLandTiles = this.currentIsland.tiles.filter(t => t.walkable).length;

            // Calculate exact difference
            const difference = targetLandTiles - currentLandTiles;

            // No change needed
            if (difference === 0) {
                this.lastMC = mc;
                return false;
            }

            // Grow or shrink by exact amount
            if (difference > 0) {
                // Need to add tiles
                this.growIsland(difference);
            } else {
                // Need to remove tiles (pass positive number)
                this.shrinkIsland(Math.abs(difference));
            }

            this.lastMC = mc;
            this.targetLandTiles = targetLandTiles;

            // Update walkable grid
            this.walkableGrid.updateFromIsland(this.currentIsland);

            // Mark cache as dirty
            this.islandDataDirty = true;

            return true;
        } catch (error) {
            console.error('❌ Error updating island:', error);
            // Fallback: regenerate island
            this.regenerateIsland(mc);
            return true;
        }
    }

    /**
     * Find growth candidates (water tiles adjacent to land)
     */
    findGrowthCandidates() {
        const { gridSize, tiles } = this.currentIsland;

        // Create a map for quick tile lookup
        const tileMap = new Map();
        for (const tile of tiles) {
            tileMap.set(`${tile.x},${tile.y}`, tile);
        }

        // Find all water tiles adjacent to land
        const candidates = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const key = `${x},${y}`;
                const tile = tileMap.get(key);

                // If this is a water tile
                if (!tile || !tile.walkable) {
                    // Check if it's adjacent to land
                    const neighbors = [
                        {dx: 0, dy: -1}, {dx: 1, dy: 0},
                        {dx: 0, dy: 1}, {dx: -1, dy: 0}
                    ];

                    for (const {dx, dy} of neighbors) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                            const neighborTile = tileMap.get(`${nx},${ny}`);
                            if (neighborTile && neighborTile.walkable) {
                                candidates.push({x, y});
                                break;
                            }
                        }
                    }
                }
            }
        }

        return candidates;
    }

    /**
     * Grow island by converting water tiles adjacent to land into land
     */
    growIsland(tilesToAdd) {
        const { gridSize, tiles } = this.currentIsland;

        // Create a map for quick tile lookup
        const tileMap = new Map();
        for (const tile of tiles) {
            tileMap.set(`${tile.x},${tile.y}`, tile);
        }

        // Get growth candidates
        const candidates = this.findGrowthCandidates();

        // Calculate center for distance-based tile selection
        const center = gridSize / 2;

        // Clear delta tracking
        this.lastTileUpdate.added = [];
        this.lastTileUpdate.removed = [];

        // Convert exact number of tiles requested
        const tilesToConvert = Math.min(tilesToAdd, candidates.length);
        for (let i = 0; i < tilesToConvert; i++) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const {x, y} = candidates.splice(randomIndex, 1)[0];

            // Calculate distance from center to determine tile type
            const distFromCenter = Math.sqrt(
                Math.pow(x - center, 2) + Math.pow(y - center, 2)
            );
            const maxDist = gridSize / 2;
            const normalizedDist = distFromCenter / maxDist;

            // Determine tile type and variant based on distance (same as IslandGenerator)
            let tileType, tileVariant;
            if (normalizedDist < 0.4) {
                tileType = 'grass';
                tileVariant = this.weightedRandom(GRASS_VARIANTS);
            } else if (normalizedDist < 0.7) {
                tileType = Math.random() < 0.5 ? 'grass' : 'dirt';
                tileVariant = tileType === 'grass'
                    ? this.weightedRandom(GRASS_VARIANTS)
                    : this.weightedRandom(DIRT_VARIANTS);
            } else {
                tileType = 'dirt';
                tileVariant = this.weightedRandom(DIRT_VARIANTS);
            }

            // Convert water tile to land
            const key = `${x},${y}`;
            const existingTile = tileMap.get(key);

            const newTile = {
                x, y,
                type: tileType,
                variant: tileVariant,
                walkable: true
            };

            if (existingTile) {
                // Update existing water tile to land
                existingTile.type = tileType;
                existingTile.variant = tileVariant;
                existingTile.walkable = true;
                this.lastTileUpdate.added.push(existingTile);
            } else {
                // Add new land tile
                tiles.push(newTile);
                tileMap.set(key, tiles[tiles.length - 1]);
                this.lastTileUpdate.added.push(newTile);
            }
        }

        // Update timestamp
        this.lastTileUpdate.timestamp = Date.now();

        // console.log(`🌱 Island grew by ${tilesToConvert} tiles`);
        return tilesToConvert;
    }

    /**
     * Find edge tiles (land tiles adjacent to water)
     */
    findEdgeTiles() {
        const { gridSize, tiles } = this.currentIsland;

        // Find all land tiles on the edge (adjacent to water)
        const tileMap = new Map();
        for (const tile of tiles) {
            tileMap.set(`${tile.x},${tile.y}`, tile);
        }

        const edgeTiles = [];
        for (const tile of tiles) {
            if (!tile.walkable) continue;

            const {x, y} = tile;
            const neighbors = [
                {dx: 0, dy: -1}, {dx: 1, dy: 0},
                {dx: 0, dy: 1}, {dx: -1, dy: 0}
            ];

            // Check if adjacent to water (either no tile or non-walkable)
            for (const {dx, dy} of neighbors) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                    const neighborTile = tileMap.get(`${nx},${ny}`);
                    if (!neighborTile || !neighborTile.walkable) {
                        edgeTiles.push(tile);
                        break;
                    }
                }
            }
        }

        return edgeTiles;
    }

    /**
     * Shrink island by removing edge land tiles
     */
    shrinkIsland(tilesToRemove) {
        const { tiles } = this.currentIsland;

        // Clear delta tracking
        this.lastTileUpdate.added = [];
        this.lastTileUpdate.removed = [];

        // Get edge tiles
        const edgeTiles = this.findEdgeTiles();

        // Remove exact number of tiles requested
        const tilesToConvert = Math.min(tilesToRemove, edgeTiles.length);
        const tilesToRemoveSet = new Set();

        for (let i = 0; i < tilesToConvert; i++) {
            const randomIndex = Math.floor(Math.random() * edgeTiles.length);
            const tile = edgeTiles.splice(randomIndex, 1)[0];
            tilesToRemoveSet.add(tile);
            this.lastTileUpdate.removed.push({
                x: tile.x,
                y: tile.y,
                type: tile.type,
                variant: tile.variant
            });
        }

        // Remove tiles from array
        this.currentIsland.tiles = tiles.filter(tile => !tilesToRemoveSet.has(tile));

        // Update timestamp
        this.lastTileUpdate.timestamp = Date.now();

        // console.log(`🌊 Island shrunk by ${tilesToConvert} tiles`);
        return tilesToConvert;
    }

    /**
     * Weighted random selection (same as IslandGenerator)
     */
    weightedRandom(weights) {
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

    /**
     * Get delta update (only changed tiles since last update)
     * OPTIMIZED: For continuous MC updates, only send what changed
     */
    getDeltaUpdate() {
        if (this.lastTileUpdate.added.length === 0 && this.lastTileUpdate.removed.length === 0) {
            return null;
        }

        return {
            added: this.lastTileUpdate.added.map(tile => ({
                x: tile.x,
                y: tile.y,
                tileType: tile.type,
                variant: `${tile.variant}.png`
            })),
            removed: this.lastTileUpdate.removed.map(tile => ({
                x: tile.x,
                y: tile.y,
                tileType: tile.type
            })),
            timestamp: this.lastTileUpdate.timestamp
        };
    }

    /**
     * Clear delta tracking after it's been sent
     */
    clearDeltaUpdate() {
        this.lastTileUpdate.added = [];
        this.lastTileUpdate.removed = [];
    }

    /**
     * Get island data for network transmission (with caching)
     * OPTIMIZED: Only send island tiles (land, shallow water) + static ocean rocks
     */
    getIslandData() {
        if (!this.currentIsland || !this.currentIsland.tiles) {
            return null;
        }

        // Return cached data if available and not dirty
        if (!this.islandDataDirty && this.cachedIslandData) {
            return this.cachedIslandData;
        }

        try {
            // OPTIMIZATION: Only send island tiles (land, shallow water)
            // Ocean/deep water is rendered as background color on frontend
            const islandTiles = this.currentIsland.tiles
                .map(tile => ({
                    x: tile.x,
                    y: tile.y,
                    tileType: tile.type,
                    variant: `${tile.variant}.png`
                }));

            // Get prerendered ocean rocks (static, never changes)
            const oceanRocks = this.oceanRocksGrid ? this.oceanRocksGrid.getOceanRocks() : [];

            // Combine island tiles with ocean rocks
            const allTiles = [...islandTiles, ...oceanRocks];

            // Log only on significant changes (reduce console spam)
            // console.log(`📤 Sending ${islandTiles.length} island tiles + ${oceanRocks.length} ocean rocks = ${allTiles.length} total`);

            // Add gridX/gridY to decorations for frontend rendering
            const decorations = this.currentIsland.decorations || [];
            const decorationsWithGrid = decorations.map(deco => ({
                gridX: deco.x,
                gridY: deco.y,
                decorationType: this.getDecorationType(deco.variant),
                variant: `${deco.variant}.png`,
                collision: deco.collision
            }));

            // Cache the result
            this.cachedIslandData = {
                gridSize: this.currentIsland.gridSize,
                tiles: allTiles,  // Island tiles + ocean rocks
                decorations: decorationsWithGrid,
                walkableGrid: this.walkableGrid ? this.walkableGrid.getGridArray() : []
            };

            this.islandDataDirty = false;

            return this.cachedIslandData;
        } catch (error) {
            console.error('❌ Error getting island data:', error);
            return null;
        }
    }

    /**
     * Helper to determine decoration type from variant name
     */
    getDecorationType(variant) {
        if (variant.startsWith('flower')) return 'flowers';
        if (variant.startsWith('rock')) return 'rocks';
        if (variant.startsWith('log')) return 'logs';
        if (variant.startsWith('dirt_rock')) return 'dirt_rocks';
        return 'flowers';  // fallback
    }

    /**
     * Get walkable grid instance
     */
    getWalkableGrid() {
        return this.walkableGrid;
    }

    /**
     * Check if world position is walkable
     */
    isPositionWalkable(x, y) {
        if (!this.walkableGrid) return false;
        return this.walkableGrid.isWalkable(x, y);
    }

    /**
     * Get walkable boundaries for NPC spawning/movement
     */
    getWalkableBoundaries() {
        if (!this.walkableGrid) {
            return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
        }
        return this.walkableGrid.getBoundaries();
    }

    /**
     * Get random walkable position for NPC spawning
     */
    getRandomWalkablePosition() {
        if (!this.walkableGrid) {
            return { worldX: 400, worldY: 300 };
        }
        return this.walkableGrid.getRandomWalkablePosition();
    }

    /**
     * Get random walkable position near center for NPC spawning
     * @param {number} maxRadius - Maximum distance from center in grid tiles (default: 5)
     */
    getRandomWalkablePositionNearCenter(maxRadius = 5) {
        if (!this.walkableGrid) {
            return { worldX: 400, worldY: 300 };
        }
        return this.walkableGrid.getRandomWalkablePositionNearCenter(maxRadius);
    }

    /**
     * Get island statistics
     */
    getStats() {
        if (!this.currentIsland) {
            return { gridSize: 0, tiles: 0, decorations: 0, walkable: 0 };
        }

        return {
            gridSize: this.currentIsland.gridSize,
            tiles: this.currentIsland.tiles.length,
            decorations: this.currentIsland.decorations.length,
            walkable: this.walkableGrid.getWalkableTileCount()
        };
    }
}
