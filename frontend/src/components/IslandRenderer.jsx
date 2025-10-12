/**
 * IslandRenderer - Renders the procedurally generated island using Pixi.js
 * Handles isometric tile rendering with proper z-sorting and decoration placement
 */

import { useMemo } from 'react';
import { tileLoader } from '../helpers/TileLoader';

/**
 * Isometric tile dimensions and configuration
 */
const TILE_CONFIG = {
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    TILE_DEPTH: 16,  // Visual depth for stacking
    DECORATION_Y_OFFSET: -10  // Offset decorations above tiles
};

/**
 * Convert grid coordinates to isometric world coordinates
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {number} gridSize - Size of the grid
 * @returns {{x: number, y: number}} World coordinates
 */
function gridToWorld(gridX, gridY, gridSize) {
    const { TILE_WIDTH, TILE_HEIGHT } = TILE_CONFIG;

    // Center the island on screen
    const offsetX = 400;
    const offsetY = 200;

    // Isometric projection
    const worldX = ((gridX - gridY) * (TILE_WIDTH / 2)) + offsetX;
    const worldY = ((gridX + gridY) * (TILE_HEIGHT / 2)) + offsetY;

    return { x: worldX, y: worldY };
}

/**
 * Calculate z-index for proper rendering order
 * Lower values render first (behind), higher values render last (in front)
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {number} layer - Layer offset (0=tile, 1=decoration)
 * @returns {number} Z-index
 */
function calculateZIndex(gridX, gridY, layer = 0) {
    // In isometric view, tiles further up-left render first
    // Formula: gridY * 1000 + gridX + layer offset
    return (gridY * 1000) + (gridX * 10) + layer;
}

/**
 * IslandTile - Renders a single isometric tile
 */
function IslandTile({ tileData, gridX, gridY, gridSize }) {
    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;

        const { tileType, variant } = tileData;
        return tileLoader.getTexture(tileType, variant);
    }, [tileData]);

    const { x, y } = gridToWorld(gridX, gridY, gridSize);
    const zIndex = calculateZIndex(gridX, gridY, 0);

    if (!texture) return null;

    return (
        <sprite
            texture={texture}
            x={x}
            y={y}
            anchor={[0.5, 0.5]}
            zIndex={zIndex}
        />
    );
}

/**
 * IslandDecoration - Renders a decoration on a tile
 */
function IslandDecoration({ decoration, gridX, gridY, gridSize }) {
    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;

        const { decorationType, variant } = decoration;
        return tileLoader.getDecorationTexture(decorationType, variant);
    }, [decoration]);

    const { x, y } = gridToWorld(gridX, gridY, gridSize);
    const zIndex = calculateZIndex(gridX, gridY, 1);  // Layer 1 for decorations

    if (!texture) return null;

    return (
        <sprite
            texture={texture}
            x={x}
            y={y + TILE_CONFIG.DECORATION_Y_OFFSET}
            anchor={[0.5, 0.75]}  // Anchor at bottom center for proper placement
            zIndex={zIndex}
        />
    );
}

/**
 * IslandRenderer - Main island rendering component
 * @param {Object} props
 * @param {Object} props.islandData - Island data from backend (gridSize, tiles, decorations)
 * @param {number} props.x - X position of island container
 * @param {number} props.y - Y position of island container
 */
export function IslandRenderer({ islandData, x = 0, y = 0 }) {
    if (!islandData || !tileLoader.isLoaded()) {
        return null;
    }

    const { gridSize, tiles, decorations } = islandData;

    // Flatten tiles into renderable array with grid coordinates
    const tileElements = useMemo(() => {
        const elements = [];

        for (let gridY = 0; gridY < gridSize; gridY++) {
            for (let gridX = 0; gridX < gridSize; gridX++) {
                const tileData = tiles[gridY][gridX];
                if (!tileData) continue;

                elements.push(
                    <IslandTile
                        key={`tile-${gridX}-${gridY}`}
                        tileData={tileData}
                        gridX={gridX}
                        gridY={gridY}
                        gridSize={gridSize}
                    />
                );
            }
        }

        return elements;
    }, [gridSize, tiles]);

    // Render decorations
    const decorationElements = useMemo(() => {
        if (!decorations || decorations.length === 0) return [];

        return decorations.map((decoration, index) => (
            <IslandDecoration
                key={`decoration-${index}`}
                decoration={decoration}
                gridX={decoration.gridX}
                gridY={decoration.gridY}
                gridSize={gridSize}
            />
        ));
    }, [decorations, gridSize]);

    return (
        <container x={x} y={y} sortableChildren>
            {tileElements}
            {decorationElements}
        </container>
    );
}

export default IslandRenderer;
