/**
 * Walkable Grid for NPC collision detection with island terrain
 */

import { TILE_DIMENSIONS } from './islandConfig.js';

export class WalkableGrid {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.grid = [];  // 2D array: 1 = walkable, 0 = blocked
        this.tileWidth = TILE_DIMENSIONS.WIDTH;
        this.tileHeight = TILE_DIMENSIONS.HEIGHT;

        // World space origin (matches IslandRenderer frontend offset)
        this.originX = 400;
        this.originY = 200;

        // Initialize empty grid
        this.initializeGrid();
    }

    /**
     * Initialize grid with all tiles blocked
     */
    initializeGrid() {
        this.grid = Array(this.gridSize)
            .fill(0)
            .map(() => Array(this.gridSize).fill(0));
    }

    /**
     * Convert world pixel coordinates to grid coordinates
     * Inverse isometric projection
     */
    worldToGrid(worldX, worldY) {
        // Adjust for origin offset
        const relX = worldX - this.originX;
        const relY = worldY - this.originY;

        // Inverse isometric transformation
        const gridX = Math.floor((relX / (this.tileWidth / 2) + relY / (this.tileHeight / 2)) / 2);
        const gridY = Math.floor((relY / (this.tileHeight / 2) - relX / (this.tileWidth / 2)) / 2);

        return { gridX, gridY };
    }

    /**
     * Convert grid coordinates to world pixel coordinates
     * Isometric projection
     */
    gridToWorld(gridX, gridY) {
        const worldX = (gridX - gridY) * (this.tileWidth / 2) + this.originX;
        const worldY = (gridX + gridY) * (this.tileHeight / 2) + this.originY;

        return { worldX, worldY };
    }

    /**
     * Check if world position is walkable
     */
    isWalkable(worldX, worldY) {
        const { gridX, gridY } = this.worldToGrid(worldX, worldY);

        // Check bounds
        if (gridX < 0 || gridY < 0 || gridX >= this.gridSize || gridY >= this.gridSize) {
            return false;  // Out of bounds = not walkable
        }

        return this.grid[gridY][gridX] === 1;
    }

    /**
     * Check if grid coordinate is walkable
     */
    isGridWalkable(gridX, gridY) {
        if (gridX < 0 || gridY < 0 || gridX >= this.gridSize || gridY >= this.gridSize) {
            return false;
        }
        return this.grid[gridY][gridX] === 1;
    }

    /**
     * Set walkability for a grid tile
     */
    setWalkable(gridX, gridY, walkable) {
        if (gridX >= 0 && gridY >= 0 && gridX < this.gridSize && gridY < this.gridSize) {
            this.grid[gridY][gridX] = walkable ? 1 : 0;
        }
    }

    /**
     * Update entire grid from island data
     * OPTIMIZED: Works with sparse tile arrays (only land/shallow water tiles)
     */
    updateFromIsland(islandData) {
        // Reset grid (all non-walkable)
        this.initializeGrid();

        // Mark land tiles as walkable, but exclude outermost tiles as safety margin
        // Note: Island tiles array now only contains land and shallow water, no deep water
        for (const tile of islandData.tiles) {
            if (tile.walkable) {
                // Skip tiles on the outer edge (1 tile margin)
                const isOuterEdge = tile.x === 0 || tile.y === 0 ||
                                   tile.x === this.gridSize - 1 ||
                                   tile.y === this.gridSize - 1;

                if (!isOuterEdge) {
                    this.setWalkable(tile.x, tile.y, true);
                }
            }
        }

        // Block tiles with collision decorations
        for (const deco of islandData.decorations) {
            if (deco.collision) {
                this.setWalkable(deco.x, deco.y, false);
            }
        }

        console.log(`🗺️ Walkable grid updated: ${this.gridSize}x${this.gridSize} (with 1-tile safety margin)`);
    }

    /**
     * Get boundaries of walkable area (in world pixels)
     * Useful for constraining NPC spawns and movement
     */
    getBoundaries() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    const { worldX, worldY } = this.gridToWorld(x, y);
                    minX = Math.min(minX, worldX);
                    minY = Math.min(minY, worldY);
                    maxX = Math.max(maxX, worldX + this.tileWidth);
                    maxY = Math.max(maxY, worldY + this.tileHeight);
                }
            }
        }

        // Add padding to boundaries
        const padding = 20;
        return {
            minX: minX + padding,
            minY: minY + padding,
            maxX: maxX - padding,
            maxY: maxY - padding
        };
    }

    /**
     * Get random walkable position (for spawning NPCs)
     */
    getRandomWalkablePosition() {
        const walkableTiles = [];

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    walkableTiles.push({ x, y });
                }
            }
        }

        if (walkableTiles.length === 0) {
            // No walkable tiles, return center
            const center = Math.floor(this.gridSize / 2);
            return this.gridToWorld(center, center);
        }

        const randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
        return this.gridToWorld(randomTile.x, randomTile.y);
    }

    /**
     * Get random walkable position near center (for spawning NPCs)
     * @param {number} maxRadius - Maximum distance from center in grid tiles (default: 5)
     */
    getRandomWalkablePositionNearCenter(maxRadius = 5) {
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);
        const nearCenterTiles = [];

        // Find walkable tiles within radius of center
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    const distFromCenter = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                    );
                    if (distFromCenter <= maxRadius) {
                        nearCenterTiles.push({ x, y });
                    }
                }
            }
        }

        // If no tiles near center, fall back to any walkable tile
        if (nearCenterTiles.length === 0) {
            console.warn('⚠️ No walkable tiles near center, using any walkable tile');
            return this.getRandomWalkablePosition();
        }

        const randomTile = nearCenterTiles[Math.floor(Math.random() * nearCenterTiles.length)];
        return this.gridToWorld(randomTile.x, randomTile.y);
    }

    /**
     * Get grid as 2D array (for sending to frontend)
     */
    getGridArray() {
        return this.grid;
    }

    /**
     * Count walkable tiles
     */
    getWalkableTileCount() {
        let count = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    count++;
                }
            }
        }
        return count;
    }
}
