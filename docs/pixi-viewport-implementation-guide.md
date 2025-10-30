# PixiJS Viewport Integration Guide for Isloria (React Pixi v8 Solution)

This guide provides step-by-step instructions for integrating `pixi-viewport` into the Isloria game using the **React Pixi v8 compatible solution** based on [s-r-x/pixi-react-8-viewport-hack](https://github.com/s-r-x/pixi-react-8-viewport-hack).

## Table of Contents
1. [Why This Solution?](#why-this-solution)
2. [Current Implementation Overview](#current-implementation-overview)
3. [Installation & Setup](#installation--setup)
4. [Implementation Steps](#implementation-steps)
5. [Complete Code Examples](#complete-code-examples)
6. [TypeScript Support](#typescript-support)
7. [Configuration Options](#configuration-options)
8. [Troubleshooting](#troubleshooting)
9. [Performance Considerations](#performance-considerations)

---

## Why This Solution?

### The Problem

Using pixi-viewport with @pixi/react v8 is challenging because:

1. **`extend()` API limitations**: The simple `extend({ Viewport })` approach doesn't work because:
   - Viewport requires the `events` system during construction
   - `events` is only available after the Application is mounted
   - When React creates the component, `appRef.current` is null

2. **Timing issues**: The Viewport constructor is called **before** the Application is ready, causing:
   ```
   TypeError: Cannot read properties of undefined (reading 'domElement')
   ```

### The Solution

The [s-r-x/pixi-react-8-viewport-hack](https://github.com/s-r-x/pixi-react-8-viewport-hack) solves this with:

1. **Custom Viewport class** that extends pixi-viewport's Viewport
2. **Global state** to store the Application instance
3. **Conditional rendering** - only render viewport after app is ready
4. **Automatic plugin configuration** in the constructor

---

## Current Implementation Overview

### Your Architecture
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

---

## Installation & Setup

### 1. Dependencies

Your current versions are compatible:

```json
{
  "dependencies": {
    "pixi.js": "^8.14.0",
    "@pixi/react": "^8.0.3",
    "pixi-viewport": "^6.0.3"
  }
}
```

pixi-viewport is already installed! ✅

### 2. Verify Installation

```bash
cd frontend
npm ls pixi-viewport
```

You should see: `pixi-viewport@6.0.3`

---

## Implementation Steps

### Step 1: Create State Management Module

Create a new file to store the Pixi Application globally:

**File**: `frontend/src/helpers/pixiState.js`

```javascript
/**
 * Global state container for the Pixi Application instance.
 * Used by the custom Viewport to access the events system.
 */
export const pixiState = {
  pixiApp: null
};
```

### Step 2: Create Custom Viewport Class

Create a custom Viewport that extends pixi-viewport and automatically configures plugins:

**File**: `frontend/src/helpers/CustomViewport.js`

```javascript
import { Viewport as BaseViewport } from 'pixi-viewport';
import { pixiState } from './pixiState';

/**
 * Custom Viewport class that extends pixi-viewport.
 * Automatically accesses the Application from global state and configures plugins.
 */
export class CustomViewport extends BaseViewport {
  constructor(options) {
    // Ensure the Pixi Application is available
    if (!pixiState.pixiApp) {
      throw new Error('Pixi Application must be initialized before creating Viewport');
    }

    // Merge user options with required events system
    super({
      ...options,
      events: pixiState.pixiApp.renderer.events
    });

    // Configure default plugins for camera controls
    this.drag({
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
  }
}
```

### Step 3: Register Viewport with React

Add TypeScript declarations (optional but recommended):

**File**: `frontend/src/global.d.ts`

```typescript
import { type PixiReactElementProps } from '@pixi/react';
import { type CustomViewport } from './helpers/CustomViewport';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pixiViewport: PixiReactElementProps<typeof CustomViewport>;
    }
  }
}

export {};
```

If you're using JavaScript only, you can skip this file.

### Step 4: Update GameCanvas Component

Now integrate the custom viewport into your GameCanvas:

**File**: [frontend/src/components/GameCanvas.jsx](../frontend/src/components/GameCanvas.jsx)

```javascript
import {
  Application,
  extend
} from '@pixi/react';
import {
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
} from 'pixi.js';
import { Npc } from "./Npc";
import { IslandRenderer } from "./IslandRenderer";
import { OceanBackground } from "./OceanBackground";
import { Roadmap } from "./Roadmap";
import { tileLoader } from '../helpers/TileLoader';
import { CustomViewport } from '../helpers/CustomViewport';
import { pixiState } from '../helpers/pixiState';
import { useEffect, useState, useMemo, useRef } from 'react';

// Register Pixi components for React
extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite,
  Viewport: CustomViewport  // Register our custom viewport
});

export const GameCanvas = ({ frames, gameState, socket }) => {
  // Track tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Track when Pixi Application is ready
  const [isAppReady, setIsAppReady] = useState(false);

  // Viewport ref
  const viewportRef = useRef(null);

  // Price polling state (existing code...)
  const [priceAddress, setPriceAddress] = useState('...pump');
  const [isPolling, setIsPolling] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Load tiles on mount
  useEffect(() => {
    const loadTiles = async () => {
      try {
        await tileLoader.load();
        setTilesLoaded(true);
      } catch (error) {
        console.error('Failed to load tiles:', error);
      }
    };

    loadTiles();
  }, []);

  // Get MC and island data from backend gameState
  const mc = gameState?.mc || 0;
  const islandData = gameState?.island || null;
  const walkableGrid = islandData?.walkableGrid || null;

  // Calculate world bounds based on island data
  const worldBounds = useMemo(() => {
    if (!islandData || !islandData.tiles || islandData.tiles.length === 0) {
      return {
        worldWidth: 2000,
        worldHeight: 2000,
        centerX: 400,
        centerY: 200
      };
    }

    const TILE_WIDTH = 64;
    const TILE_HEIGHT = 32;
    const PADDING = 500;
    const backendOriginX = 400;
    const backendOriginY = 200;

    // Find the center of the island
    const gridSize = islandData.gridSize || 5;
    const centerTile = Math.floor(gridSize / 2);

    const centerX = ((centerTile - centerTile) * (TILE_WIDTH / 2)) + backendOriginX;
    const centerY = ((centerTile + centerTile) * (TILE_HEIGHT / 2)) + backendOriginY;

    // Calculate world dimensions
    const width = gridSize * TILE_WIDTH + PADDING * 2;
    const height = gridSize * TILE_HEIGHT + PADDING * 2;

    return {
      worldWidth: Math.max(width, 2000),
      worldHeight: Math.max(height, 2000),
      centerX,
      centerY
    };
  }, [islandData]);

  // Handle Application initialization
  const handleAppInit = (app) => {
    // Store app in global state
    pixiState.pixiApp = app;

    // Mark app as ready
    setIsAppReady(true);
  };

  // Center viewport on island when ready
  useEffect(() => {
    if (viewportRef.current && worldBounds.centerX !== undefined) {
      viewportRef.current.moveCenter(worldBounds.centerX, worldBounds.centerY);
      viewportRef.current.setZoom(1.0, false);
    }
  }, [isAppReady, worldBounds]);

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

  if (!frames) {
    return <div>Loading frames...</div>;
  }

  // Extract NPCs array from gameState
  const npcs = gameState?.npcs ? Object.entries(gameState.npcs) : [];

  return (
    <>
      {/* Roadmap */}
      <Roadmap />

      {/* MC Control Panel - (existing code) */}
      {/* ... */}

      {/* Game Canvas */}
      <div style={{ width: '100%', height: '100%' }}>
        <Application
          resizeTo={window}
          onInit={handleAppInit}
        >
          {/* Only render viewport after app is ready */}
          {isAppReady && (
            <pixiViewport
              ref={viewportRef}
              screenWidth={window.innerWidth}
              screenHeight={window.innerHeight}
              worldWidth={worldBounds.worldWidth}
              worldHeight={worldBounds.worldHeight}
            >
              <container sortableChildren>
                {/* Render Ocean Background */}
                <OceanBackground />

                {/* Render Island */}
                {tilesLoaded && islandData && (
                  <IslandRenderer
                    islandData={islandData}
                    viewportRef={viewportRef}
                    x={0}
                    y={0}
                  />
                )}

                {/* Render NPCs */}
                {npcs.map(([npcId, npcData]) => (
                  <Npc
                    key={npcId}
                    frames={frames}
                    npcType={npcData.npcType || 'stag'}
                    x={npcData.x}
                    y={npcData.y}
                    state={npcData.state || 'idle'}
                    direction={npcData.direction || 'NE'}
                  />
                ))}
              </container>
            </pixiViewport>
          )}
        </Application>
      </div>
    </>
  );
};
```

### Step 5: Update IslandRenderer for Viewport Culling

Update the IslandRenderer to use viewport-aware culling:

**File**: [frontend/src/components/IslandRenderer.jsx](../frontend/src/components/IslandRenderer.jsx)

Update the `isTileInViewport` function:

```javascript
/**
 * Check if a tile is within the viewport bounds (with padding)
 */
function isTileInViewport(worldX, worldY, viewport) {
    if (!viewport) return true; // Render all if no viewport

    const { VIEWPORT_PADDING } = TILE_CONFIG;
    const bounds = {
        left: viewport.left - VIEWPORT_PADDING,
        right: viewport.right + VIEWPORT_PADDING,
        top: viewport.top - VIEWPORT_PADDING,
        bottom: viewport.bottom + VIEWPORT_PADDING
    };

    return (
        worldX >= bounds.left &&
        worldX <= bounds.right &&
        worldY >= bounds.top &&
        worldY <= bounds.bottom
    );
}
```

Add viewport event listeners in the IslandRenderer component:

```javascript
export function IslandRenderer({ islandData, viewportRef, x = 0, y = 0 }) {
    // ... existing state ...
    const [viewportVersion, setViewportVersion] = useState(0);

    // Listen to viewport move/zoom events to trigger re-culling
    useEffect(() => {
        if (!viewportRef?.current) return;

        const viewport = viewportRef.current;
        let rafId;

        const scheduleUpdate = () => {
            if (rafId) return; // Already scheduled
            rafId = requestAnimationFrame(() => {
                rafId = null;
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
    }, [viewportRef]);

    // Update culling to use viewport
    const tileElements = useMemo(() => {
        const viewport = viewportRef?.current;

        const visibleTiles = currentTiles.filter(tile => {
            const { x: worldX, y: worldY } = gridToWorld(tile.x, tile.y);
            return isTileInViewport(worldX, worldY, viewport);
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
    }, [currentTiles, viewportRef, viewportVersion]);

    // Remove centerOffset calculations from the container position
    return (
        <container
            x={x}
            y={y}
            sortableChildren
            interactiveChildren={false}
        >
            {tileElements}
            {decorationElements}
        </container>
    );
}
```

---

## Complete Code Examples

### Minimal Working Example

```javascript
import { Application, extend } from '@pixi/react';
import { Container } from 'pixi.js';
import { CustomViewport } from './helpers/CustomViewport';
import { pixiState } from './helpers/pixiState';
import { useState } from 'react';

extend({ Container, Viewport: CustomViewport });

export function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleAppInit = (app) => {
    pixiState.pixiApp = app;
    setIsAppReady(true);
  };

  return (
    <Application
      width={800}
      height={600}
      onInit={handleAppInit}
    >
      {isAppReady && (
        <pixiViewport
          screenWidth={800}
          screenHeight={600}
          worldWidth={2000}
          worldHeight={2000}
        >
          <container>
            {/* Your game content here */}
          </container>
        </pixiViewport>
      )}
    </Application>
  );
}
```

---

## TypeScript Support

If using TypeScript, add type declarations:

### global.d.ts

```typescript
import { type PixiReactElementProps } from '@pixi/react';
import { type CustomViewport } from './helpers/CustomViewport';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pixiViewport: PixiReactElementProps<typeof CustomViewport>;
    }
  }
}

export {};
```

### CustomViewport.ts

```typescript
import { Viewport as BaseViewport, IViewportOptions } from 'pixi-viewport';
import { pixiState } from './pixiState';

export class CustomViewport extends BaseViewport {
  constructor(options: IViewportOptions) {
    if (!pixiState.pixiApp) {
      throw new Error('Pixi Application must be initialized before creating Viewport');
    }

    super({
      ...options,
      events: pixiState.pixiApp.renderer.events
    });

    // Configure plugins...
  }
}
```

---

## Configuration Options

### Customizing Viewport Plugins

Edit your `CustomViewport.js` to adjust plugin settings:

```javascript
export class CustomViewport extends BaseViewport {
  constructor(options) {
    // ... constructor code ...

    // Customize these plugin configurations:

    this.drag({
      mouseButtons: 'left',     // 'all', 'left', 'middle', 'right'
      wheel: false,             // Use wheel for panning instead of zoom
      pressDrag: true,          // Use cursor for press-drag
      factor: 1                 // Speed multiplier
    })
    .wheel({
      percent: 0.1,             // Zoom amount per scroll (0.1 = 10%)
      smooth: 5,                // Smoothing frames (0 = instant)
      trackpadPinch: true,      // Enable trackpad pinch gestures
      center: null,             // Center point (null = cursor position)
      reverse: false            // Reverse scroll direction
    })
    .pinch({
      noDrag: false,            // Allow two-finger dragging
      percent: 1.0,             // Pinch speed
      factor: 1                 // Speed multiplier
    })
    .decelerate({
      friction: 0.9,            // 0-1, lower = more friction
      bounce: 0.5,              // Bounce at edges (0-1)
      minSpeed: 0.01            // Stop threshold
    })
    .clamp({
      direction: 'all',         // 'all', 'x', or 'y'
      underflow: 'center'       // What to do when world < screen
    })
    .clampZoom({
      minScale: 0.5,            // Maximum zoom out
      maxScale: 2.0             // Maximum zoom in
    });
  }
}
```

### Disable Specific Plugins

Remove plugin calls you don't need:

```javascript
// Example: No momentum, no clamping
this.drag()
    .wheel()
    .pinch();
```

### Dynamic Plugin Configuration

Pass options to the constructor:

```javascript
export class CustomViewport extends BaseViewport {
  constructor(options) {
    // ... setup code ...

    // Use options passed from JSX
    this.drag(options.dragConfig || {})
        .wheel(options.wheelConfig || {})
        .pinch(options.pinchConfig || {});
  }
}

// Then in JSX:
<pixiViewport
  dragConfig={{ mouseButtons: 'middle' }}
  wheelConfig={{ percent: 0.2 }}
/>
```

---

## Troubleshooting

### Error: "Pixi Application must be initialized before creating Viewport"

**Cause**: Viewport is being rendered before the Application is ready.

**Solution**: Ensure you're using conditional rendering:

```javascript
const [isAppReady, setIsAppReady] = useState(false);

<Application onInit={(app) => {
  pixiState.pixiApp = app;
  setIsAppReady(true);
}}>
  {isAppReady && (
    <pixiViewport>
      {/* content */}
    </pixiViewport>
  )}
</Application>
```

### Error: "Cannot read properties of undefined (reading 'domElement')"

**Cause**: The events system is not being passed correctly.

**Solution**: Verify your CustomViewport constructor passes `events`:

```javascript
super({
  ...options,
  events: pixiState.pixiApp.renderer.events  // ✅ Required
});
```

### Viewport Not Responding to Input

**Cause**: Plugins not configured or events not set up.

**Solution**: Check that your CustomViewport calls `.drag()`, `.wheel()`, etc. in the constructor.

### Viewport Culling Not Working

**Cause**: Viewport reference not passed to IslandRenderer or event listeners not set up.

**Solution**:
1. Pass `viewportRef` prop to IslandRenderer
2. Add viewport event listeners (see Step 5)
3. Update culling logic to use viewport bounds

### Objects Positioned Incorrectly

**Cause**: Mixing viewport coordinates with static offset calculations.

**Solution**: Remove all `centerOffsetX` and `centerOffsetY` additions when using viewport. The viewport handles all positioning.

---

## Performance Considerations

### 1. Viewport Culling

The viewport culling system filters objects based on camera position:

```javascript
const visibleTiles = tiles.filter(tile => {
  const { x, y } = gridToWorld(tile.x, tile.y);
  return isTileInViewport(x, y, viewport);
});
```

**Targets**:
- < 500 sprites: Excellent
- 500-1000: Good
- 1000-2000: Acceptable on desktop
- \> 2000: Needs optimization

### 2. Event Throttling

Viewport events fire frequently. Throttle updates with requestAnimationFrame:

```javascript
const scheduleUpdate = () => {
  if (rafId) return; // Already scheduled
  rafId = requestAnimationFrame(() => {
    rafId = null;
    setViewportVersion(v => v + 1);
  });
};

viewport.on('moved', scheduleUpdate);
viewport.on('zoomed', scheduleUpdate);
```

### 3. Plugin Performance

**Smooth Zooming** (`wheel({ smooth: N })`):
- `smooth: 0` - Instant (best performance)
- `smooth: 3-5` - Balanced
- `smooth: 10+` - Very smooth (higher CPU)

**Decelerate** runs every frame:
```javascript
.decelerate({
  friction: 0.9,   // Higher = stops faster (better perf)
  minSpeed: 0.01   // Higher = stops sooner (better perf)
})
```

### 4. Conditional Plugin Loading

For mobile devices, consider disabling smooth zooming:

```javascript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

this.wheel({
  smooth: isMobile ? 0 : 5  // No smoothing on mobile
});
```

### 5. Disable Sorting

If you're managing z-index manually:

```javascript
<container sortableChildren={false}>
  {/* Your content with manual zIndex */}
</container>
```

---

## Key Differences from Previous Approaches

### ❌ What Doesn't Work

**Simple extend() without custom class**:
```javascript
// ❌ This fails because events aren't available at construction
extend({ Viewport });

<viewport events={app.renderer.events}> // events is undefined
```

**PixiComponent API**:
```javascript
// ❌ PixiComponent doesn't exist in @pixi/react v8
import { PixiComponent } from '@pixi/react'; // Not available
```

**Setting events after mount**:
```javascript
// ❌ Too late - viewport constructor already ran
useEffect(() => {
  viewport.options.events = app.renderer.events;
}, []);
```

### ✅ What Works

**Custom class + global state + conditional rendering**:
```javascript
// ✅ Events available through global state
class CustomViewport extends BaseViewport {
  constructor(options) {
    super({
      ...options,
      events: pixiState.pixiApp.renderer.events  // Available!
    });
  }
}

// ✅ Only render after app is ready
{isAppReady && <pixiViewport />}
```

---

## Next Steps

1. ✅ **Create helper files**: `pixiState.js` and `CustomViewport.js`
2. ✅ **Update GameCanvas**: Add app initialization and conditional rendering
3. ✅ **Test basic pan/zoom**: Verify drag and wheel zoom work
4. ✅ **Update IslandRenderer**: Add viewport-aware culling
5. ✅ **Fine-tune plugins**: Adjust speeds, friction, and zoom limits
6. ✅ **Test on mobile**: Verify touch gestures work
7. ✅ **Optimize performance**: Monitor FPS and adjust culling

---

## Additional Resources

- [s-r-x/pixi-react-8-viewport-hack](https://github.com/s-r-x/pixi-react-8-viewport-hack) - Original solution
- [pixi-viewport GitHub](https://github.com/pixijs-userland/pixi-viewport) - Official repository
- [pixi-viewport API Docs](https://viewport.pixijs.io/jsdoc/) - Complete API reference
- [React PixiJS Docs](https://react.pixijs.io/) - React integration guide
- [PixiJS Docs](https://pixijs.download/dev/docs/index.html) - Core PixiJS documentation

---

**Success!** This solution provides a clean, working implementation of pixi-viewport with React Pixi v8. The key is using a custom Viewport class that accesses the Application through global state, combined with conditional rendering to ensure the app is ready before the viewport is created.
