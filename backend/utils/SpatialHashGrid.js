/**
 * Spatial Hash Grid - Optimizes collision detection from O(n²) to O(n)
 * Divides the world into cells and only checks NPCs in nearby cells
 */

export class SpatialHashGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();  // Map of cell keys to arrays of NPC IDs
    }

    /**
     * Get the cell key for a given position
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Clear the grid (call at start of each frame)
     */
    clear() {
        this.grid.clear();
    }

    /**
     * Insert an NPC into the grid
     */
    insert(npcId, x, y) {
        const key = this.getCellKey(x, y);

        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }

        this.grid.get(key).push(npcId);
    }

    /**
     * Get all nearby NPCs within collision range
     * Returns NPCs in the same cell and 8 adjacent cells
     */
    getNearby(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);

        const nearby = [];

        // Check 3x3 grid of cells (current cell + 8 neighbors)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                const cell = this.grid.get(key);

                if (cell) {
                    nearby.push(...cell);
                }
            }
        }

        return nearby;
    }

    /**
     * Rebuild the entire grid from NPCs Map
     * Call this once per frame before collision checks
     */
    rebuild(npcsMap) {
        this.clear();

        for (const [npcId, npc] of npcsMap.entries()) {
            this.insert(npcId, npc.x, npc.y);
        }
    }

    /**
     * Get grid statistics for debugging
     */
    getStats() {
        return {
            cellCount: this.grid.size,
            totalEntries: Array.from(this.grid.values()).reduce((sum, cell) => sum + cell.length, 0),
            cellSize: this.cellSize
        };
    }
}
