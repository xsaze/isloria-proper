# PixiJS Viewport Integration Guide for Isloria

This guide provides step-by-step instructions for integrating `pixi-viewport` into the Isloria game to enable pan/zoom functionality with mouse wheel and touch gestures.

## Table of Contents
1. [Current Implementation Overview](#current-implementation-overview)
2. [Installation & Setup](#installation--setup)
3. [React Integration Pattern](#react-integration-pattern)
4. [Viewport Configuration](#viewport-configuration)
5. [Plugin Setup](#plugin-setup)
6. [Migration Strategy](#migration-strategy)
7. [Complete Implementation Example](#complete-implementation-example)
8. [TypeScript Support](#typescript-support)
9. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
10. [Performance Considerations](#performance-considerations)

---

## Current Implementation Overview

### Architecture Summary
- **File**: [frontend/src/components/GameCanvas.jsx](../frontend/src/components/GameCanvas.jsx)
- **Current Camera**: Static centering logic (no pan/zoom)
- **Coordinate System**: Isometric projection with backend origin at (400, 200)
- **Rendering Scale**: 2x (TILE_WIDTH: 64px, TILE_HEIGHT: 32px)
- **Viewport Culling**: Active (200px padding)

### Component Hierarchy
```
GameCanvas
└── Application (Pixi/React wrapper)
    └── Container (main canvas container)
        ├── OceanBackground (solid color rectangle)
        ├── IslandRenderer (tiles + decorations)
        │   ├── IsometricTile
        │   └── IslandDecoration
        └── Npc (animated sprites)
```

### Current Centering Logic
Currently implemented in two places (needs consolidation):
- [GameCanvas.jsx:123-138](../frontend/src/components/GameCanvas.jsx) - Main centering calculation
- [IslandRenderer.jsx:284-289](../frontend/src/components/IslandRenderer.jsx) - Duplicate centering

The viewport will replace this static centering with dynamic camera control.

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install pixi-viewport
```

### 2. Verify Compatible Versions

Based on your current setup and pixi-viewport requirements:

```json
{
  "dependencies": {
    "pixi.js": "^8.2.6",
    "@pixi/react": "^8.0.0",
    "pixi-viewport": "^6.0.0"
  }
}
```

**Important**: pixi-viewport v6+ requires PixiJS v8+. Your current setup should be compatible.

---

## React Integration Pattern

### Using the `extend()` API

The `@pixi/react` library provides an `extend()` function to register custom Pixi classes as React components.

#### Step 1: Extend Viewport Class

Add this to the top of your [GameCanvas.jsx](../frontend/src/components/GameCanvas.jsx):

```javascript
import { Stage, Container, extend } from '@pixi/react';
import { Viewport } from 'pixi-viewport';

// Register Viewport as a React component
extend({ Viewport });
```

#### Step 2: Use as JSX Component

Once extended, you can use `<viewport>` as a React component:

```jsx
<viewport
  screenWidth={window.innerWidth}
  screenHeight={window.innerHeight}
  worldWidth={2000}
  worldHeight={2000}
>
  {/* Your game content here */}
  <container>
    <OceanBackground />
    <IslandRenderer />
    <Npc />
  </container>
</viewport>
```

---

## Viewport Configuration

### Basic Configuration

The Viewport requires several key parameters:

```javascript
const viewportConfig = {
  // Screen dimensions (visible area)
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,

  // World dimensions (total pannable area)
  worldWidth: 4000,  // Adjust based on your game world size
  worldHeight: 4000,

  // CRITICAL: Pass the Pixi events system
  events: app.renderer.events,  // Required for interactivity

  // Optional: Disable sorting for performance
  sortableChildren: false
};
```

### Calculating World Size for Isloria

Your world size should encompass all possible island positions. Based on your current setup:

```javascript
// Calculate world bounds from your island data
const calculateWorldBounds = (islandData) => {
  if (!islandData || islandData.length === 0) {
    return { worldWidth: 2000, worldHeight: 2000 };
  }

  const TILE_WIDTH = 64;
  const TILE_HEIGHT = 32;
  const PADDING = 500; // Extra padding for camera movement

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  islandData.forEach(tile => {
    const worldX = ((tile.x - tile.y) * (TILE_WIDTH / 2));
    const worldY = ((tile.x + tile.y) * (TILE_HEIGHT / 2));

    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minY = Math.min(minY, worldY);
    maxY = Math.max(maxY, worldY);
  });

  return {
    worldWidth: (maxX - minX) + PADDING * 2,
    worldHeight: (maxY - minY) + PADDING * 2,
    offsetX: minX - PADDING,
    offsetY: minY - PADDING
  };
};
```

---

## Plugin Setup

### Available Plugins

pixi-viewport provides several plugins for camera control:

1. **drag()** - Click and drag to pan
2. **wheel()** - Mouse wheel to zoom
3. **pinch()** - Two-finger pinch to zoom (mobile)
4. **decelerate()** - Momentum-based panning
5. **clamp()** - Prevent panning outside world bounds
6. **clampZoom()** - Limit min/max zoom levels

### Basic Plugin Configuration

```javascript
// Enable plugins with chaining
viewport
  .drag()
  .wheel()
  .pinch()
  .decelerate();
```

### Advanced Plugin Options

#### drag() Options

```javascript
viewport.drag({
  wheel: true,                    // Use wheel to scroll in direction
  keyToPress: ['ControlLeft'],    // Require key press to drag
  mouseButtons: 'left',           // Which mouse button ('all', 'left', 'middle', 'right')
  ignoreKeyToPressOnTouch: true,  // Ignore keyToPress for touch events
  pressDrag: true,                // Use cursor for press-drag
  factor: 1,                      // Speed factor
  lineHeight: 20                  // Speed for wheel option
});
```

**Recommended for Isloria:**
```javascript
viewport.drag({
  mouseButtons: 'left',  // Standard left-click drag
  wheel: false,          // Keep wheel for zooming only
  pressDrag: true        // Smooth dragging
});
```

#### wheel() Options

```javascript
viewport.wheel({
  percent: 0.1,              // Percent to scroll with each spin (0.1 = 10% zoom per scroll)
  smooth: 3,                 // Smooth the zooming (0 = no smoothing)
  interrupt: true,           // Stop smoothing with any user input
  reverse: false,            // Reverse the direction of the scroll
  center: null,              // Place this point at center during zoom (null = use pointer position)
  lineHeight: 20,            // Speed of zooming using wheel in line mode
  trackpadPinch: true,       // Enable trackpad pinch to zoom
  wheelZoom: true            // Enable wheel to zoom
});
```

**Recommended for Isloria:**
```javascript
viewport.wheel({
  percent: 0.1,          // Smooth zoom increments
  smooth: 5,             // Smoothed zoom animation
  trackpadPinch: true,   // Support trackpad gestures
  center: null           // Zoom toward cursor position
});
```

#### pinch() Options

```javascript
viewport.pinch({
  noDrag: false,    // Disable two-finger dragging
  percent: 1.0,     // Percent to zoom (1.0 = 100%)
  factor: 1,        // Speed factor
  center: null      // Place this point at center during zoom (null = use pointer position)
});
```

**Recommended for Isloria:**
```javascript
viewport.pinch({
  noDrag: false,   // Allow two-finger panning
  percent: 1.0     // Natural pinch zoom speed
});
```

#### decelerate() Options

```javascript
viewport.decelerate({
  friction: 0.95,       // Friction to apply to decelerate (0-1, lower = more friction)
  bounce: 0.8,          // Percent to decelerate when past boundaries (0-1)
  minSpeed: 0.01        // Minimum speed before stopping
});
```

**Recommended for Isloria:**
```javascript
viewport.decelerate({
  friction: 0.9,   // Moderate momentum
  bounce: 0.5,     // Soft bounce at edges
  minSpeed: 0.01
});
```

#### clamp() and clampZoom()

```javascript
// Prevent camera from going outside world bounds
viewport.clamp({
  left: true,
  right: true,
  top: true,
  bottom: true,
  direction: null,     // (all, x, or y)
  underflow: 'center'  // (center, top-left, top-right, bottom-left, bottom-right, center-left, etc.)
});

// Limit zoom levels
viewport.clampZoom({
  minScale: 0.5,   // Maximum zoom out (50%)
  maxScale: 3.0    // Maximum zoom in (300%)
});
```

**Recommended for Isloria:**
```javascript
// Prevent panning outside world
viewport.clamp({
  direction: 'all',
  underflow: 'center'  // Center the world if it's smaller than screen
});

// Limit zoom for usability
viewport.clampZoom({
  minScale: 0.5,   // Can zoom out to see more of the world
  maxScale: 2.0    // Can zoom in to see details
});
```

### Complete Recommended Setup for Isloria

```javascript
viewport
  .drag({
    mouseButtons: 'left',
    wheel: false,
    pressDrag: true
  })
  .wheel({
    percent: 0.1,
    smooth: 5,
    trackpadPinch: true,
    center: null
  })
  .pinch({
    noDrag: false,
    percent: 1.0
  })
  .decelerate({
    friction: 0.9,
    bounce: 0.5,
    minSpeed: 0.01
  })
  .clamp({
    direction: 'all',
    underflow: 'center'
  })
  .clampZoom({
    minScale: 0.5,
    maxScale: 2.0
  });
```

---

## Migration Strategy

### Step 1: Remove Existing Centering Logic

**In [GameCanvas.jsx](../frontend/src/components/GameCanvas.jsx):**

Remove or comment out lines 123-138 (current centering calculation):

```javascript
// OLD CODE - REMOVE THIS
const centerOffsetX = useMemo(() => {
  if (!island) return 0;
  const centerX = (island.minX + island.maxX) / 2;
  const centerY = (island.minY + island.maxY) / 2;
  const worldCenterX = ((centerX - centerY) * (TILE_CONFIG.TILE_WIDTH / 2));
  return window.innerWidth / 2 - worldCenterX;
}, [island]);
```

**In [IslandRenderer.jsx](../frontend/src/components/IslandRenderer.jsx):**

Remove duplicate centering logic at lines 284-289.

### Step 2: Wrap Content in Viewport

Replace the main `<container>` with a `<viewport>` component that handles all camera logic.

### Step 3: Initial Camera Position

After plugins are configured, set the initial camera position to center on the island:

```javascript
// In useEffect after viewport plugins are configured
useEffect(() => {
  if (viewportRef.current && island) {
    const centerX = (island.minX + island.maxX) / 2;
    const centerY = (island.minY + island.maxY) / 2;
    const worldCenterX = ((centerX - centerY) * (TILE_CONFIG.TILE_WIDTH / 2));
    const worldCenterY = ((centerX + centerY) * (TILE_CONFIG.TILE_HEIGHT / 2));

    // Move camera to island center
    viewportRef.current.moveCenter(worldCenterX, worldCenterY);

    // Optional: Set initial zoom
    viewportRef.current.setZoom(1.0, true); // true = animate
  }
}, [island]);
```

### Step 4: Update Viewport Culling

Your existing viewport culling in [IslandRenderer.jsx](../frontend/src/components/IslandRenderer.jsx) needs to use the viewport's camera bounds instead of window dimensions:

```javascript
// OLD: Using window dimensions
const visibleTiles = useMemo(() => {
  const minX = -centerOffsetX - VIEWPORT_PADDING;
  const maxX = window.innerWidth - centerOffsetX + VIEWPORT_PADDING;
  // ...
}, [tiles, centerOffsetX]);

// NEW: Using viewport bounds
const visibleTiles = useMemo(() => {
  if (!viewportRef.current) return tiles;

  const viewport = viewportRef.current;
  const bounds = {
    left: viewport.left - VIEWPORT_PADDING,
    right: viewport.right + VIEWPORT_PADDING,
    top: viewport.top - VIEWPORT_PADDING,
    bottom: viewport.bottom + VIEWPORT_PADDING
  };

  return tiles.filter(tile => {
    const worldX = ((tile.x - tile.y) * (TILE_WIDTH / 2));
    const worldY = ((tile.x + tile.y) * (TILE_HEIGHT / 2));

    return worldX >= bounds.left && worldX <= bounds.right &&
           worldY >= bounds.top && worldY <= bounds.bottom;
  });
}, [tiles, viewportRef.current?.x, viewportRef.current?.y, viewportRef.current?.scale]);
```

---

## Complete Implementation Example

### GameCanvas.jsx (Updated)

```javascript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Container, extend } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import IslandRenderer from './IslandRenderer';
import OceanBackground from './OceanBackground';
import Npc from './Npc';

// Register Viewport as React component
extend({ Viewport });

const GameCanvas = () => {
  const [island, setIsland] = useState(null);
  const viewportRef = useRef(null);
  const appRef = useRef(null);

  // Calculate world bounds based on island data
  const worldBounds = useMemo(() => {
    if (!island) {
      return { worldWidth: 2000, worldHeight: 2000, offsetX: 0, offsetY: 0 };
    }

    const TILE_WIDTH = 64;
    const TILE_HEIGHT = 32;
    const PADDING = 500;

    const centerX = (island.minX + island.maxX) / 2;
    const centerY = (island.minY + island.maxY) / 2;

    const worldCenterX = ((centerX - centerY) * (TILE_WIDTH / 2));
    const worldCenterY = ((centerX + centerY) * (TILE_HEIGHT / 2));

    const width = Math.abs(island.maxX - island.minX) * TILE_WIDTH + PADDING * 2;
    const height = Math.abs(island.maxY - island.minY) * TILE_HEIGHT + PADDING * 2;

    return {
      worldWidth: Math.max(width, 2000),
      worldHeight: Math.max(height, 2000),
      centerX: worldCenterX,
      centerY: worldCenterY
    };
  }, [island]);

  // Initialize viewport plugins
  useEffect(() => {
    if (!viewportRef.current) return;

    const viewport = viewportRef.current;

    // Configure camera controls
    viewport
      .drag({
        mouseButtons: 'left',
        wheel: false,
        pressDrag: true
      })
      .wheel({
        percent: 0.1,
        smooth: 5,
        trackpadPinch: true,
        center: null
      })
      .pinch({
        noDrag: false,
        percent: 1.0
      })
      .decelerate({
        friction: 0.9,
        bounce: 0.5,
        minSpeed: 0.01
      })
      .clamp({
        direction: 'all',
        underflow: 'center'
      })
      .clampZoom({
        minScale: 0.5,
        maxScale: 2.0
      });

    // Center camera on island
    if (island && worldBounds.centerX !== undefined) {
      viewport.moveCenter(worldBounds.centerX, worldBounds.centerY);
      viewport.setZoom(1.0, true);
    }
  }, [island, worldBounds]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        viewportRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      options={{
        backgroundColor: 0x1099bb,
        resizeTo: window
      }}
      ref={appRef}
    >
      <viewport
        ref={viewportRef}
        screenWidth={window.innerWidth}
        screenHeight={window.innerHeight}
        worldWidth={worldBounds.worldWidth}
        worldHeight={worldBounds.worldHeight}
        events={appRef.current?.renderer?.events}
      >
        <Container sortableChildren={true}>
          <OceanBackground />

          {island && (
            <>
              <IslandRenderer
                tiles={island.tiles}
                decorations={island.decorations}
                viewportRef={viewportRef}
              />

              {island.npcs?.map(npc => (
                <Npc
                  key={npc.id}
                  x={npc.x}
                  y={npc.y}
                  direction={npc.direction}
                  spriteSheet={npc.spriteSheet}
                />
              ))}
            </>
          )}
        </Container>
      </viewport>
    </Stage>
  );
};

export default GameCanvas;
```

### IslandRenderer.jsx (Updated for Viewport Culling)

```javascript
import React, { useMemo, useRef } from 'react';
import { Container } from '@pixi/react';
import IsometricTile from './IsometricTile';
import IslandDecoration from './IslandDecoration';
import { TILE_CONFIG } from '../constants';

const IslandRenderer = ({ tiles, decorations, viewportRef }) => {
  const { TILE_WIDTH, TILE_HEIGHT, VIEWPORT_PADDING } = TILE_CONFIG;

  // Viewport-aware culling
  const visibleTiles = useMemo(() => {
    if (!viewportRef?.current || !tiles) return tiles;

    const viewport = viewportRef.current;
    const bounds = {
      left: viewport.left - VIEWPORT_PADDING,
      right: viewport.right + VIEWPORT_PADDING,
      top: viewport.top - VIEWPORT_PADDING,
      bottom: viewport.bottom + VIEWPORT_PADDING
    };

    return tiles.filter(tile => {
      const worldX = ((tile.x - tile.y) * (TILE_WIDTH / 2));
      const worldY = ((tile.x + tile.y) * (TILE_HEIGHT / 2));

      return worldX >= bounds.left && worldX <= bounds.right &&
             worldY >= bounds.top && worldY <= bounds.bottom;
    });
  }, [tiles, viewportRef.current?.x, viewportRef.current?.y, viewportRef.current?.scale?.x]);

  const visibleDecorations = useMemo(() => {
    if (!viewportRef?.current || !decorations) return decorations;

    const viewport = viewportRef.current;
    const bounds = {
      left: viewport.left - VIEWPORT_PADDING,
      right: viewport.right + VIEWPORT_PADDING,
      top: viewport.top - VIEWPORT_PADDING,
      bottom: viewport.bottom + VIEWPORT_PADDING
    };

    return decorations.filter(deco => {
      const worldX = ((deco.x - deco.y) * (TILE_WIDTH / 2));
      const worldY = ((deco.x + deco.y) * (TILE_HEIGHT / 2));

      return worldX >= bounds.left && worldX <= bounds.right &&
             worldY >= bounds.top && worldY <= bounds.bottom;
    });
  }, [decorations, viewportRef.current?.x, viewportRef.current?.y, viewportRef.current?.scale?.x]);

  return (
    <Container sortableChildren={true}>
      {visibleTiles.map(tile => (
        <IsometricTile
          key={`${tile.x}-${tile.y}-${tile.z}`}
          gridX={tile.x}
          gridY={tile.y}
          gridZ={tile.z}
          tileType={tile.type}
          texture={tile.texture}
        />
      ))}

      {visibleDecorations.map(deco => (
        <IslandDecoration
          key={deco.id}
          gridX={deco.x}
          gridY={deco.y}
          type={deco.type}
          texture={deco.texture}
        />
      ))}
    </Container>
  );
};

export default React.memo(IslandRenderer);
```

### Alternative: Using useEffect to Configure Viewport

If you prefer configuring the viewport in a useEffect hook rather than via props:

```javascript
const GameCanvas = () => {
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Wait for next tick to ensure viewport is fully mounted
    setTimeout(() => {
      viewport
        .drag({ mouseButtons: 'left' })
        .wheel({ percent: 0.1, smooth: 5 })
        .pinch()
        .decelerate()
        .clamp({ direction: 'all' })
        .clampZoom({ minScale: 0.5, maxScale: 2.0 });

      // Center on island
      viewport.moveCenter(islandCenterX, islandCenterY);
    }, 0);
  }, [viewportRef.current, island]);

  return (
    <viewport
      ref={viewportRef}
      screenWidth={window.innerWidth}
      screenHeight={window.innerHeight}
      worldWidth={worldBounds.worldWidth}
      worldHeight={worldBounds.worldHeight}
    >
      {/* content */}
    </viewport>
  );
};
```

---

## TypeScript Support

If you're using TypeScript, you need to register the Viewport component in the type system.

### Create or Update `global.d.ts`

```typescript
// frontend/src/global.d.ts
import { type Viewport } from 'pixi-viewport';
import { type PixiReactElementProps } from '@pixi/react';

declare module '@pixi/react' {
  interface PixiElements {
    viewport: PixiReactElementProps<typeof Viewport>;
  }
}
```

This allows TypeScript to recognize `<viewport>` as a valid JSX element with proper type checking for props.

---

## Common Pitfalls & Solutions

### 1. Viewport Not Responding to Input

**Problem**: Viewport doesn't pan or zoom.

**Solution**: Ensure you're passing the `events` prop correctly:

```javascript
// WRONG
<viewport screenWidth={width} screenHeight={height}>

// CORRECT
<viewport
  screenWidth={width}
  screenHeight={height}
  events={appRef.current?.renderer?.events}
>
```

The events system is required for all interactivity. In pixi-viewport v6+, pass `app.renderer.events`.

### 2. Viewport Plugins Not Working

**Problem**: Calling `.drag()`, `.wheel()`, etc. on viewport doesn't enable functionality.

**Solution**: Plugins must be configured after the viewport is mounted. Use `useEffect`:

```javascript
useEffect(() => {
  if (!viewportRef.current) return;

  viewportRef.current
    .drag()
    .wheel()
    .pinch();
}, [viewportRef.current]);
```

Alternatively, configure plugins in a separate initialization function called after mounting.

### 3. World Size Too Small

**Problem**: Viewport doesn't allow panning because world is smaller than screen.

**Solution**: Ensure `worldWidth` and `worldHeight` are larger than `screenWidth` and `screenHeight`. Use the `underflow: 'center'` option in `.clamp()` to handle cases where world is smaller than screen.

```javascript
viewport.clamp({
  direction: 'all',
  underflow: 'center'  // Centers world when smaller than viewport
});
```

### 4. Viewport Culling Not Updating

**Problem**: Tiles don't appear/disappear when panning the viewport.

**Solution**: Your `visibleTiles` calculation must react to viewport position changes. Include viewport position in your dependency array:

```javascript
const visibleTiles = useMemo(() => {
  // culling logic
}, [
  tiles,
  viewportRef.current?.x,        // Viewport X position
  viewportRef.current?.y,        // Viewport Y position
  viewportRef.current?.scale?.x  // Viewport zoom level
]);
```

However, `useMemo` doesn't track nested properties. Better approach:

```javascript
const [viewportBounds, setViewportBounds] = useState(null);

useEffect(() => {
  if (!viewportRef.current) return;

  const viewport = viewportRef.current;

  const updateBounds = () => {
    setViewportBounds({
      left: viewport.left,
      right: viewport.right,
      top: viewport.top,
      bottom: viewport.bottom,
      scale: viewport.scale.x
    });
  };

  // Update on viewport move/zoom
  viewport.on('moved', updateBounds);
  viewport.on('zoomed', updateBounds);

  updateBounds(); // Initial call

  return () => {
    viewport.off('moved', updateBounds);
    viewport.off('zoomed', updateBounds);
  };
}, [viewportRef.current]);

const visibleTiles = useMemo(() => {
  if (!viewportBounds) return tiles;
  // Use viewportBounds for culling
}, [tiles, viewportBounds]);
```

### 5. Animations Breaking After Viewport Added

**Problem**: GSAP animations no longer work or positions are incorrect.

**Solution**: Your animations use sprite refs which are still valid. However, if you're animating world positions, ensure you're not mixing viewport coordinates with world coordinates.

World coordinates (tile positions) remain unchanged. The viewport transforms them to screen space. Your existing GSAP animations should work as-is since they animate sprite scale/alpha, not positions.

### 6. Initial Center Not Working

**Problem**: Viewport doesn't center on island on load.

**Solution**: Ensure plugins are configured before calling `.moveCenter()`:

```javascript
useEffect(() => {
  if (!viewportRef.current || !island) return;

  const viewport = viewportRef.current;

  // Configure plugins FIRST
  viewport.drag().wheel().pinch();

  // THEN set position
  viewport.moveCenter(islandCenterX, islandCenterY);
  viewport.setZoom(1.0);
}, [island]);
```

If using setTimeout, ensure sufficient delay (10-50ms) for viewport to fully mount.

### 7. Performance Issues with Many Tiles

**Problem**: Viewport panning/zooming is laggy with many rendered objects.

**Solution**:
1. Ensure viewport culling is working (check visible tile count)
2. Use `sortableChildren: false` on containers that don't need z-sorting
3. Consider using `viewport.pause('drag')` during zoom animations
4. Reduce `smooth` value in `.wheel()` plugin for less animation overhead

```javascript
viewport.wheel({
  smooth: 0  // Instant zoom (no smoothing) - best performance
});
```

### 8. React Warning: "Cannot update during render"

**Problem**: Console warnings when viewport position updates trigger state changes.

**Solution**: Don't update state directly in `useMemo`. Use viewport events in `useEffect`:

```javascript
// WRONG
const visibleTiles = useMemo(() => {
  setViewportPosition(viewportRef.current.center); // ❌ Don't do this
  return tiles.filter(...);
}, [tiles]);

// CORRECT
useEffect(() => {
  if (!viewportRef.current) return;

  const onViewportMove = () => {
    setViewportPosition(viewportRef.current.center);
  };

  viewportRef.current.on('moved', onViewportMove);
  return () => viewportRef.current?.off('moved', onViewportMove);
}, []);
```

---

## Performance Considerations

### 1. Viewport Culling Integration

Your existing culling system is a major performance win. Ensure it works with the viewport:

```javascript
// Listen to viewport move/zoom events to trigger culling updates
useEffect(() => {
  if (!viewportRef.current) return;

  const viewport = viewportRef.current;
  let rafId;

  const scheduleUpdate = () => {
    if (rafId) return; // Already scheduled
    rafId = requestAnimationFrame(() => {
      rafId = null;
      // Trigger re-render by updating a state value
      setViewportVersion(v => v + 1);
    });
  };

  viewport.on('moved', scheduleUpdate);
  viewport.on('zoomed', scheduleUpdate);

  return () => {
    viewport.off('moved', scheduleUpdate);
    viewport.off('zoomed', scheduleUpdate);
    if (rafId) cancelAnimationFrame(rafId);
  };
}, [viewportRef.current]);
```

This ensures culling updates are batched and don't cause excessive re-renders.

### 2. Smooth Plugin Trade-off

The `smooth` option in `.wheel()` creates a zoom animation. This looks nice but has a performance cost:

- **smooth: 0** - Instant zoom, best performance, can feel jarring
- **smooth: 3-5** - Moderate smoothing, good balance
- **smooth: 10+** - Very smooth, higher CPU usage

Recommended: Start with `smooth: 5` and adjust based on device performance.

### 3. Decelerate Plugin

The `.decelerate()` plugin adds momentum to panning. It runs every frame, so set reasonable friction:

```javascript
viewport.decelerate({
  friction: 0.9,   // Higher = faster stop (better performance)
  minSpeed: 0.01   // Higher = stops sooner (better performance)
});
```

If performance is critical, consider disabling decelerate on low-end devices.

### 4. Viewport Events

Viewport emits events frequently during pan/zoom. Avoid expensive operations in event handlers:

```javascript
// AVOID: Expensive operation on every move
viewport.on('moved', () => {
  const tiles = calculateVisibleTiles(); // Heavy calculation
  setVisibleTiles(tiles);
});

// BETTER: Throttle updates
import throttle from 'lodash/throttle';

const updateVisibleTiles = throttle(() => {
  const tiles = calculateVisibleTiles();
  setVisibleTiles(tiles);
}, 100); // Max 10 updates per second

viewport.on('moved', updateVisibleTiles);
```

### 5. Disable Sorting

If your z-index sorting is handled manually (as it is in your current implementation), disable automatic sorting:

```javascript
<Container sortableChildren={false}>
  {/* Your tiles with manual zIndex */}
</Container>
```

This eliminates sorting overhead on every frame.

### 6. Monitor Rendered Objects

Add debug logging to track how many objects are rendered:

```javascript
console.log(`Rendering ${visibleTiles.length} tiles, ${visibleDecorations.length} decorations`);
```

Aim for:
- **< 500 sprites**: Excellent performance
- **500-1000 sprites**: Good performance
- **1000-2000 sprites**: Acceptable on desktop, may lag on mobile
- **> 2000 sprites**: Needs optimization (increase culling aggressiveness)

### 7. Zoom-Dependent Culling

Consider more aggressive culling when zoomed out:

```javascript
const cullingPadding = useMemo(() => {
  if (!viewportRef.current) return VIEWPORT_PADDING;

  const zoom = viewportRef.current.scale.x;

  // Less padding when zoomed out (more culling)
  if (zoom < 0.7) return 100;
  // Standard padding at normal zoom
  if (zoom < 1.5) return 200;
  // More padding when zoomed in (render more for smoother panning)
  return 300;
}, [viewportRef.current?.scale?.x]);
```

### 8. Batch Viewport Updates

If programmatically moving the viewport, batch updates:

```javascript
// AVOID: Multiple updates
viewport.moveCenter(x, y);
viewport.setZoom(2.0);
viewport.clampZoom({ minScale: 0.5, maxScale: 3.0 });

// BETTER: Single update using animate()
viewport.animate({
  position: { x, y },
  scale: 2.0,
  time: 500,  // 500ms animation
  ease: 'easeInOutSine'
});
```

---

## Next Steps

1. **Install pixi-viewport**: `npm install pixi-viewport`
2. **Update GameCanvas.jsx**: Add viewport with basic plugins
3. **Test pan/zoom**: Verify drag and wheel zoom work
4. **Update IslandRenderer.jsx**: Implement viewport-aware culling
5. **Fine-tune plugins**: Adjust zoom speeds, friction, bounds
6. **Add zoom UI controls**: Optional buttons for zoom in/out/reset
7. **Test on mobile**: Verify touch gestures work smoothly
8. **Optimize performance**: Monitor FPS and adjust culling/smoothing

---

## Additional Resources

- [pixi-viewport GitHub](https://github.com/pixijs-userland/pixi-viewport) - Official repository
- [pixi-viewport API Docs](https://viewport.pixijs.io/jsdoc/) - Complete API reference
- [React PixiJS Docs](https://react.pixijs.io/) - React integration guide
- [PixiJS Docs](https://pixijs.download/dev/docs/index.html) - Core PixiJS documentation

---

## Troubleshooting Checklist

If viewport isn't working as expected, check:

- [ ] `pixi-viewport` is installed (`npm ls pixi-viewport`)
- [ ] `extend({ Viewport })` is called before using `<viewport>`
- [ ] `events` prop is passed to viewport
- [ ] `viewportRef.current` exists before calling plugin methods
- [ ] Plugins are configured in `useEffect` after mount
- [ ] `worldWidth/Height` are larger than `screenWidth/Height`
- [ ] TypeScript types are declared (if using TypeScript)
- [ ] Viewport position/scale changes trigger culling updates
- [ ] Browser console shows no errors

---

**Good luck with your implementation! This viewport system will significantly enhance the user experience of Isloria.**
