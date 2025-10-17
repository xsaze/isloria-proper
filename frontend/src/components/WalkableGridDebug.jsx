/**
 * WalkableGridDebug - Visualizes the walkable grid as a semi-transparent overlay
 * Helps debug NPC walkability issues by showing exactly which tiles are walkable
 */

import { useMemo } from 'react';

// Match backend coordinate system
const TILE_CONFIG = {
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
};

/**
 * Convert grid coordinates to isometric world coordinates
 */
function gridToWorld(gridX, gridY) {
    const { TILE_WIDTH, TILE_HEIGHT } = TILE_CONFIG;
    const backendOriginX = 400;
    const backendOriginY = 200;

    const worldX = ((gridX - gridY) * (TILE_WIDTH / 2)) + backendOriginX;
    const worldY = ((gridX + gridY) * (TILE_HEIGHT / 2)) + backendOriginY;

    return { x: worldX, y: worldY };
}

/**
 * WalkableGridDebug component
 */
export function WalkableGridDebug({ walkableGrid, gridSize, visible = true }) {
    // Generate debug tiles
    const debugTiles = useMemo(() => {
        if (!walkableGrid || !gridSize || !visible) {
            return [];
        }

        const tiles = [];

        for (let gridY = 0; gridY < gridSize; gridY++) {
            for (let gridX = 0; gridX < gridSize; gridX++) {
                const isWalkable = walkableGrid[gridY]?.[gridX] === 1;

                if (isWalkable) {
                    const { x, y } = gridToWorld(gridX, gridY);
                    tiles.push({
                        x,
                        y,
                        gridX,
                        gridY
                    });
                }
            }
        }

        return tiles;
    }, [walkableGrid, gridSize, visible]);

    if (!visible || debugTiles.length === 0) {
        return null;
    }

    // Calculate offset to center island on screen
    const centerTile = Math.floor(gridSize / 2);
    const { x: islandCenterX, y: islandCenterY } = gridToWorld(centerTile, centerTile);
    const centerOffsetX = (window.innerWidth / 2) - islandCenterX;
    const centerOffsetY = (window.innerHeight / 2) - islandCenterY;

    return (
        <container
            x={centerOffsetX}
            y={centerOffsetY}
            sortableChildren={false}
            interactiveChildren={false}
        >
            {debugTiles.map(({ x, y, gridX, gridY }) => (
                <graphics
                    key={`walkable-${gridX}-${gridY}`}
                    x={x}
                    y={y}
                    draw={(g) => {
                        g.clear();

                        // Draw semi-transparent green diamond to show walkable area
                        g.beginFill(0x00ff00, 0.3); // Green with 30% opacity
                        g.lineStyle(1, 0x00ff00, 0.5); // Green border

                        // Draw isometric diamond shape
                        const w = TILE_CONFIG.TILE_WIDTH / 2;
                        const h = TILE_CONFIG.TILE_HEIGHT / 2;

                        g.moveTo(0, -h);  // Top
                        g.lineTo(w, 0);   // Right
                        g.lineTo(0, h);   // Bottom
                        g.lineTo(-w, 0);  // Left
                        g.lineTo(0, -h);  // Back to top

                        g.endFill();
                    }}
                />
            ))}
        </container>
    );
}

export default WalkableGridDebug;
