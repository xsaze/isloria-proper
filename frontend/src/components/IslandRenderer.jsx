/**
 * IslandRenderer - Renders the procedurally generated island using Pixi.js
 * Handles isometric tile rendering with proper z-sorting and GSAP animations
 * OPTIMIZED: Viewport culling for large islands (only renders visible tiles)
 */

import { useMemo, useEffect, memo, useRef, useState, useCallback } from 'react';
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
const IsometricTile = memo(function IsometricTile({ tileData, gridX, gridY, spriteRefs }) {
    const spriteRef = useRef(null);

    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;
        const { tileType, variant } = tileData;
        return tileLoader.getTexture(tileType, variant);
    }, [tileData.tileType, tileData.variant]);

    const { x, y } = useMemo(() => gridToWorld(gridX, gridY), [gridX, gridY]);
    const zIndex = useMemo(() => calculateZIndex(gridX, gridY, 0), [gridX, gridY]);

    // Store sprite ref in parent's map for exit animations
    useEffect(() => {
        if (spriteRef.current && spriteRefs) {
            const key = `${gridX}-${gridY}`;
            spriteRefs.current.set(key, spriteRef.current);

            return () => {
                spriteRefs.current.delete(key);
            };
        }
    }, [gridX, gridY, spriteRefs]);

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
    // Custom comparison - re-render if any relevant prop changed
    return prevProps.gridX === nextProps.gridX &&
           prevProps.gridY === nextProps.gridY &&
           prevProps.tileData.tileType === nextProps.tileData.tileType &&
           prevProps.tileData.variant === nextProps.tileData.variant;
});

/**
 * IslandDecoration - Renders a decoration on a tile with mount animation
 */
const IslandDecoration = memo(function IslandDecoration({ decoration, gridX, gridY, spriteRefs }) {
    const spriteRef = useRef(null);

    const texture = useMemo(() => {
        if (!tileLoader.isLoaded()) return null;
        const { decorationType, variant } = decoration;
        return tileLoader.getDecorationTexture(decorationType, variant);
    }, [decoration]);

    const { x, y } = useMemo(() => gridToWorld(gridX, gridY), [gridX, gridY]);
    const zIndex = useMemo(() => calculateZIndex(gridX, gridY, 1), [gridX, gridY]);

    // Store sprite ref in parent's map for exit animations
    useEffect(() => {
        if (spriteRef.current && spriteRefs) {
            const key = `deco-${gridX}-${gridY}`;
            spriteRefs.current.set(key, spriteRef.current);

            return () => {
                spriteRefs.current.delete(key);
            };
        }
    }, [gridX, gridY, spriteRefs]);

    // Mount animation: "Pop-in" effect (same as tiles)
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

    if (!texture) return null;

    return (
        <sprite
            ref={spriteRef}
            texture={texture}
            x={x}
            y={y + TILE_CONFIG.DECORATION_Y_OFFSET}
            anchor={0.5}
            zIndex={zIndex}
            alpha={0}
            scale={0}
        />
    );
}, (prevProps, nextProps) => {
    // Custom comparison - re-render if any relevant prop changed
    return prevProps.gridX === nextProps.gridX &&
           prevProps.gridY === nextProps.gridY &&
           prevProps.decoration.decorationType === nextProps.decoration.decorationType &&
           prevProps.decoration.variant === nextProps.decoration.variant;
});

/**
 * IslandRenderer - Main island rendering component
 */
export function IslandRenderer({ islandData, x = 0, y = 0 }) {
    // Current rendered tiles and decorations state
    const [currentTiles, setCurrentTiles] = useState([]);
    const [currentDecorations, setCurrentDecorations] = useState([]);
    const spriteRefsMap = useRef(new Map());
    const pendingUpdateRef = useRef(false);
    const pendingDecoUpdateRef = useRef(false);
    const prevTilesRef = useRef([]);
    const prevDecorationsRef = useRef([]);

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

    // Helper function to animate tile removal
    const animateTileRemoval = useCallback((tile, onComplete) => {
        const key = `${tile.x}-${tile.y}`;
        const sprite = spriteRefsMap.current.get(key);

        if (!sprite) {
            onComplete();
            return;
        }

        // Kill any existing tweens
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);

        // Ensure sprite is visible before animating out
        sprite.alpha = 1;
        sprite.scale.set(2);

        // Create exit animation timeline (reverse of entry animation)
        const timeline = gsap.timeline({
            onComplete: onComplete
        });

        // Scale down with undershoot: 2.0 (100%) -> 1.8 (90%) -> 0
        // First compress slightly
        timeline.to(sprite.scale, {
            x: 1.8,  // Undershoot to 90%
            y: 1.8,
            duration: 0.1,
            ease: "power2.inOut"
        }, 0);

        // Then shrink to zero with bounce
        timeline.to(sprite.scale, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: "back.in(2)"
        }, 0.2);
    }, []);

    // Helper function to animate decoration removal
    const animateDecorationRemoval = useCallback((decoration, onComplete) => {
        const key = `deco-${decoration.gridX}-${decoration.gridY}`;
        const sprite = spriteRefsMap.current.get(key);

        if (!sprite) {
            onComplete();
            return;
        }

        // Kill any existing tweens
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);

        // Ensure sprite is visible before animating out
        sprite.alpha = 1;
        sprite.scale.set(2);

        // Create exit animation timeline (same as tiles)
        const timeline = gsap.timeline({
            onComplete: onComplete
        });

        // Scale down with undershoot: 2.0 (100%) -> 1.8 (90%) -> 0
        timeline.to(sprite.scale, {
            x: 1.8,
            y: 1.8,
            duration: 0.1,
            ease: "power2.inOut"
        }, 0);

        timeline.to(sprite.scale, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: "back.in(2)"
        }, 0.2);
    }, []);

    // Compare and handle tile state changes
    useEffect(() => {
        if (!Array.isArray(tiles)) return;

        // Skip if we're already processing an update
        if (pendingUpdateRef.current) return;

        const prevTiles = prevTilesRef.current;

        // First render - just set tiles
        if (prevTiles.length === 0) {
            setCurrentTiles(tiles);
            prevTilesRef.current = tiles;
            return;
        }

        // Check if tiles actually changed
        const prevTileMap = new Map(prevTiles.map(t => [`${t.x}-${t.y}`, t]));
        const newTileMap = new Map(tiles.map(t => [`${t.x}-${t.y}`, t]));

        // Quick check: if same length and all keys exist, tiles haven't changed
        if (prevTiles.length === tiles.length) {
            const allSame = tiles.every(tile => prevTileMap.has(`${tile.x}-${tile.y}`));
            if (allSame) {
                return; // No change, don't update
            }
        }

        // Find removed tiles
        const removedTiles = prevTiles.filter(tile => !newTileMap.has(`${tile.x}-${tile.y}`));

        // If tiles were removed, animate them first, then update state
        if (removedTiles.length > 0) {
            pendingUpdateRef.current = true;

            let completedAnimations = 0;
            const totalAnimations = removedTiles.length;

            removedTiles.forEach(tile => {
                animateTileRemoval(tile, () => {
                    completedAnimations++;

                    // When all animations complete, update state
                    if (completedAnimations === totalAnimations) {
                        setCurrentTiles(tiles);
                        prevTilesRef.current = tiles;
                        pendingUpdateRef.current = false;
                    }
                });
            });
        } else {
            // Tiles were added or unchanged - update immediately (entry animation will play)
            setCurrentTiles(tiles);
            prevTilesRef.current = tiles;
        }
    }, [tiles, animateTileRemoval]);

    // Compare and handle decoration state changes
    useEffect(() => {
        if (!Array.isArray(decorations)) return;

        // Skip if we're already processing an update
        if (pendingDecoUpdateRef.current) return;

        const prevDecorations = prevDecorationsRef.current;

        // First render - just set decorations
        if (prevDecorations.length === 0) {
            setCurrentDecorations(decorations);
            prevDecorationsRef.current = decorations;
            return;
        }

        // Check if decorations actually changed
        const prevDecoMap = new Map(prevDecorations.map(d => [`${d.gridX}-${d.gridY}`, d]));
        const newDecoMap = new Map(decorations.map(d => [`${d.gridX}-${d.gridY}`, d]));

        // Quick check: if same length and all keys exist, decorations haven't changed
        if (prevDecorations.length === decorations.length) {
            const allSame = decorations.every(deco => prevDecoMap.has(`${deco.gridX}-${deco.gridY}`));
            if (allSame) {
                return; // No change, don't update
            }
        }

        // Find removed decorations
        const removedDecorations = prevDecorations.filter(deco => !newDecoMap.has(`${deco.gridX}-${deco.gridY}`));

        // If decorations were removed, animate them first, then update state
        if (removedDecorations.length > 0) {
            pendingDecoUpdateRef.current = true;

            let completedAnimations = 0;
            const totalAnimations = removedDecorations.length;

            removedDecorations.forEach(deco => {
                animateDecorationRemoval(deco, () => {
                    completedAnimations++;

                    // When all animations complete, update state
                    if (completedAnimations === totalAnimations) {
                        setCurrentDecorations(decorations);
                        prevDecorationsRef.current = decorations;
                        pendingDecoUpdateRef.current = false;
                    }
                });
            });
        } else {
            // Decorations were added or unchanged - update immediately (entry animation will play)
            setCurrentDecorations(decorations);
            prevDecorationsRef.current = decorations;
        }
    }, [decorations, animateDecorationRemoval]);

    // Render tiles with viewport culling
    const tileElements = useMemo(() => {
        // Filter tiles by viewport visibility
        const visibleTiles = currentTiles.filter(tile => {
            const { x: worldX, y: worldY } = gridToWorld(tile.x, tile.y);
            return isTileInViewport(worldX, worldY, centerOffsetX, centerOffsetY);
        });

        return visibleTiles.map((tile) => {
            const tileKey = `${tile.tileType}-${tile.x}-${tile.y}`;

            return (
                <IsometricTile
                    key={`tile-${tileKey}`}
                    tileData={tile}
                    gridX={tile.x}
                    gridY={tile.y}
                    spriteRefs={spriteRefsMap}
                />
            );
        });
    }, [currentTiles, centerOffsetX, centerOffsetY]);

    // Render decorations with viewport culling
    const decorationElements = useMemo(() => {
        if (!currentDecorations || currentDecorations.length === 0) return [];

        // Filter decorations by viewport visibility
        const visibleDecorations = currentDecorations.filter(decoration => {
            const { x: worldX, y: worldY } = gridToWorld(decoration.gridX, decoration.gridY);
            return isTileInViewport(worldX, worldY, centerOffsetX, centerOffsetY);
        });

        return visibleDecorations.map((decoration) => (
            <IslandDecoration
                key={`decoration-${decoration.gridX}-${decoration.gridY}`}
                decoration={decoration}
                gridX={decoration.gridX}
                gridY={decoration.gridY}
                spriteRefs={spriteRefsMap}
            />
        ));
    }, [currentDecorations, centerOffsetX, centerOffsetY]);

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
