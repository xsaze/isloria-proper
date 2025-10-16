/**
 * IslandRenderer - Renders the procedurally generated island using Pixi.js
 * Handles isometric tile rendering with proper z-sorting and GSAP animations
 * OPTIMIZED: Viewport culling for large islands (only renders visible tiles)
 */

import { useMemo, useEffect, memo, useRef } from 'react';
import { tileLoader } from '../helpers/TileLoader';
import gsap from 'gsap';

/**
 * Isometric tile dimensions and configuration
 */
const TILE_CONFIG = {
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    TILE_DEPTH: 16,  // Visual depth for stacking
    DECORATION_Y_OFFSET: -10,  // Offset decorations above tiles
    VIEWPORT_PADDING: 200  // Viewport culling padding (pixels)
};

/**
 * Convert grid coordinates to isometric world coordinates
 */
function gridToWorld(gridX, gridY) {
    const { TILE_WIDTH, TILE_HEIGHT } = TILE_CONFIG;

    // Backend WalkableGrid uses (400, 200) as origin for NPC calculations
    const backendOriginX = 400;
    const backendOriginY = 200;

    // Isometric projection (matches backend calculation)
    const worldX = ((gridX - gridY) * (TILE_WIDTH / 2)) + backendOriginX;
    const worldY = ((gridX + gridY) * (TILE_HEIGHT / 2)) + backendOriginY;

    return { x: worldX, y: worldY };
}

/**
 * Calculate z-index for proper rendering order
 * Lower values render first (behind), higher values render last (in front)
 */
function calculateZIndex(gridX, gridY, layer = 0) {
    // In isometric view, tiles further up-left render first
    return (gridY * 1000) + (gridX * 10) + layer;
}

/**
 * Check if a tile is within the viewport bounds (with padding)
 */
function isTileInViewport(worldX, worldY, offsetX, offsetY) {
    const { VIEWPORT_PADDING, TILE_WIDTH, TILE_HEIGHT } = TILE_CONFIG;
    const screenX = worldX + offsetX;
    const screenY = worldY + offsetY;

    // Account for tile size and scale (tiles are rendered at 2x scale)
    const tileVisualWidth = TILE_WIDTH * 2;
    const tileVisualHeight = TILE_HEIGHT * 2;

    return (
        screenX + tileVisualWidth >= -VIEWPORT_PADDING &&
        screenX - tileVisualWidth <= window.innerWidth + VIEWPORT_PADDING &&
        screenY + tileVisualHeight >= -VIEWPORT_PADDING &&
        screenY - tileVisualHeight <= window.innerHeight + VIEWPORT_PADDING
    );
}

/**
 * IsometricTile - A single isometric tile with mount animation
 */
const IsometricTile = memo(function IsometricTile({ tileData, gridX, gridY }) {
    const spriteRef = useRef(null);

    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;
        const { tileType, variant } = tileData;
        return tileLoader.getTexture(tileType, variant);
    }, [tileData.tileType, tileData.variant]);

    const { x, y } = useMemo(() => gridToWorld(gridX, gridY), [gridX, gridY]);
    const zIndex = useMemo(() => calculateZIndex(gridX, gridY, 0), [gridX, gridY]);

    // Mount animation: "Pop-in" effect
    useEffect(() => {
        if (!spriteRef.current) return;

        const sprite = spriteRef.current;

        // Set initial state: invisible and zero scale
        sprite.alpha = 0;
        sprite.scale.set(0);

        // Kill any existing tweens
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);

        // Create animation timeline with bouncy overshoot
        const timeline = gsap.timeline();

        // Fade in alpha
        timeline.to(sprite, {
            alpha: 1,
            duration: 0.4,
            ease: "power2.out"
        }, 0);

        // Scale up with overshoot: 0 -> 2.2 (110%) -> 2.0 (100%)
        timeline.to(sprite.scale, {
            x: 2.2,  // Overshoot to 110%
            y: 2.2,
            duration: 0.3,
            ease: "back.out(2)"
        }, 0);

        // Settle back to normal scale
        timeline.to(sprite.scale, {
            x: 2,
            y: 2,
            duration: 0.2,
            ease: "power2.inOut"
        }, 0.3);

        // Cleanup: kill animations on unmount
        return () => {
            timeline.kill();
            gsap.killTweensOf(sprite);
            gsap.killTweensOf(sprite.scale);
        };
    }, []); // Run once on mount

    if (!texture) {
        return null;
    }

    return (
        <sprite
            ref={spriteRef}
            texture={texture}
            x={x}
            y={y}
            anchor={0.5}
            zIndex={zIndex}
            alpha={0}
            scale={0}
        />
    );
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if tile data actually changed
    return prevProps.gridX === nextProps.gridX &&
           prevProps.gridY === nextProps.gridY &&
           prevProps.tileData.tileType === nextProps.tileData.tileType &&
           prevProps.tileData.variant === nextProps.tileData.variant;
});

/**
 * IslandDecoration - Renders a decoration on a tile
 */
const IslandDecoration = memo(function IslandDecoration({ decoration, gridX, gridY }) {
    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;
        const { decorationType, variant } = decoration;
        return tileLoader.getDecorationTexture(decorationType, variant);
    }, [decoration]);

    const { x, y } = useMemo(() => gridToWorld(gridX, gridY), [gridX, gridY]);
    const zIndex = useMemo(() => calculateZIndex(gridX, gridY, 1), [gridX, gridY]);

    if (!texture) return null;

    return (
        <sprite
            texture={texture}
            x={x}
            y={y + TILE_CONFIG.DECORATION_Y_OFFSET}
            anchor={0.5}
            zIndex={zIndex}
            scale={2}
        />
    );
});

/**
 * IslandRenderer - Main island rendering component
 */
export function IslandRenderer({ islandData, x = 0, y = 0 }) {
    if (!islandData || !tileLoader.isLoaded()) {
        return null;
    }

    const { gridSize, tiles, decorations } = islandData;

    // Calculate offset to center the island on screen
    const centerTile = Math.floor(gridSize / 2);
    const { x: islandCenterX, y: islandCenterY } = gridToWorld(centerTile, centerTile, gridSize);

    // Calculate how much to offset to center the island's center tile on screen
    const centerOffsetX = (window.innerWidth / 2) - islandCenterX;
    const centerOffsetY = (window.innerHeight / 2) - islandCenterY;

    // Render tiles with viewport culling
    const tileElements = useMemo(() => {
        if (!Array.isArray(tiles)) {
            return [];
        }

        // Filter tiles by viewport visibility
        const visibleTiles = tiles.filter(tile => {
            const { x: worldX, y: worldY } = gridToWorld(tile.x, tile.y);
            return isTileInViewport(worldX, worldY, centerOffsetX, centerOffsetY);
        });

        // Log viewport culling stats (only in development)
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
            console.log(`🔍 Viewport culling: ${visibleTiles.length}/${tiles.length} tiles visible`);
        }

        return visibleTiles.map((tile) => {
            const tileKey = `${tile.tileType}-${tile.x}-${tile.y}`;

            return (
                <IsometricTile
                    key={`tile-${tileKey}`}
                    tileData={tile}
                    gridX={tile.x}
                    gridY={tile.y}
                />
            );
        });
    }, [tiles, centerOffsetX, centerOffsetY]);

    // Render decorations with viewport culling
    const decorationElements = useMemo(() => {
        if (!decorations || decorations.length === 0) return [];

        // Filter decorations by viewport visibility
        const visibleDecorations = decorations.filter(decoration => {
            const { x: worldX, y: worldY } = gridToWorld(decoration.gridX, decoration.gridY);
            return isTileInViewport(worldX, worldY, centerOffsetX, centerOffsetY);
        });

        return visibleDecorations.map((decoration, index) => (
            <IslandDecoration
                key={`decoration-${decoration.gridX}-${decoration.gridY}-${index}`}
                decoration={decoration}
                gridX={decoration.gridX}
                gridY={decoration.gridY}
            />
        ));
    }, [decorations, centerOffsetX, centerOffsetY]);

    return (
        <container
            x={x + centerOffsetX}
            y={y + centerOffsetY}
            sortableChildren
            interactiveChildren={false}
        >
            {tileElements}
            {decorationElements}
        </container>
    );
}

export default IslandRenderer;
