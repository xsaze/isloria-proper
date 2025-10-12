/**
 * Island Manager - Manages island state and regeneration
 */

import { IslandGenerator } from './IslandGenerator.js';
import { WalkableGrid } from './WalkableGrid.js';

export class IslandManager {
    constructor() {
        this.currentIsland = null;
        this.walkableGrid = null;
        this.lastMC = 0;
    }

    /**
     * Initialize island with starting MC value
     */
    initialize(initialMC = 0) {
        this.regenerateIsland(initialMC);
    }

    /**
     * Regenerate island based on MC value
     */
    regenerateIsland(mc) {
        console.log(`🏝️ Regenerating island for MC: ${mc}`);

        // Generate new island
        const islandData = IslandGenerator.generate(mc);
        this.currentIsland = islandData;
        this.lastMC = mc;

        // Create/update walkable grid
        this.walkableGrid = new WalkableGrid(islandData.gridSize);
        this.walkableGrid.updateFromIsland(islandData);

        const walkableCount = this.walkableGrid.getWalkableTileCount();
        console.log(`✅ Island generated: ${islandData.gridSize}x${islandData.gridSize}, ${walkableCount} walkable tiles`);
    }

    /**
     * Check if MC change warrants island regeneration
     */
    shouldRegenerate(newMC) {
        if (!this.currentIsland) return true;

        // Get current and new grid sizes
        const currentSize = this.currentIsland.gridSize;
        const newSize = IslandGenerator.getGridSizeFromMC(newMC);

        // Regenerate if size would change
        return currentSize !== newSize;
    }

    /**
     * Update island if MC crossed threshold
     */
    updateForMC(mc) {
        if (this.shouldRegenerate(mc)) {
            this.regenerateIsland(mc);
            return true;  // Island changed
        }
        return false;  // No change
    }

    /**
     * Get island data for network transmission
     */
    getIslandData() {
        if (!this.currentIsland) {
            return null;
        }

        return {
            gridSize: this.currentIsland.gridSize,
            tiles: this.currentIsland.tiles,
            decorations: this.currentIsland.decorations,
            walkableGrid: this.walkableGrid.getGridArray()
        };
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
