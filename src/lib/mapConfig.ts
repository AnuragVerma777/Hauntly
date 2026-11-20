import type { StyleSpecification } from 'maplibre-gl';

/**
 * Environment configuration for MapLibre styles and API tokens
 */
const env = (
  typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env
    ? (import.meta as any).env
    : {}
) as Record<string, string | undefined>;

export const MAP_STYLE_URL_ENV = env.VITE_MAP_STYLE_URL;
export const MAPTILER_KEY_ENV = env.VITE_MAPTILER_KEY;
export const MAPBOX_TOKEN_ENV = env.VITE_MAPBOX_TOKEN || env.VITE_MAPBOX_ACCESS_TOKEN;

/**
 * 🦇 SIGNATURE HAUNTLY GOTHIC DARK GLOBE STYLE (Default)
 * Matches the reference dark obsidian earth aesthetic:
 * - Deep dark obsidian oceans
 * - Dark slate/graphite continents
 * - Crisp, elegant national borders and typography labels (North Atlantic Ocean, Africa, Europe, etc.)
 * - Free, high-speed, 100% watermark-free, zero API key required
 */
export const HAUNTLY_GOTHIC_DARK_GLOBE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Hauntly Gothic Midnight Globe',
  sky: {
    'sky-color': '#05010d',
    'atmosphere-blend': 0.95,
  },
  projection: {
    type: 'vertical-perspective',
  },
  sources: {
    'dark-earth-base': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Esri, HERE, Garmin, OpenStreetMap',
    },
    'dark-earth-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Esri, HERE',
    },
  },
  layers: [
    {
      id: 'space-void',
      type: 'background',
      paint: {
        'background-color': '#05010d',
      },
    },
    {
      id: 'gothic-earth-surface',
      type: 'raster',
      source: 'dark-earth-base',
      paint: {
        'raster-opacity': 1.0,
        'raster-contrast': 0.32,
        'raster-brightness-max': 0.88,
        'raster-brightness-min': 0.04,
      },
    },
    {
      id: 'gothic-earth-labels',
      type: 'raster',
      source: 'dark-earth-labels',
      paint: {
        'raster-opacity': 0.88,
      },
    },
  ],
};

/**
 * Realistic Earth Satellite Style Specification
 */
export const REALISTIC_SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Hauntly Realistic Satellite Earth',
  sky: {
    'sky-color': '#05010d',
    'atmosphere-blend': 0.7,
  },
  projection: {
    type: 'vertical-perspective',
  },
  sources: {
    'satellite-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'space-void',
      type: 'background',
      paint: {
        'background-color': '#05010d',
      },
    },
    {
      id: 'earth-surface',
      type: 'raster',
      source: 'satellite-imagery',
      paint: {
        'raster-opacity': 0.95,
        'raster-contrast': 0.12,
        'raster-saturation': 0.05,
      },
    },
  ],
};

/**
 * Signature Glowing Purple Hologram Earth Style Specification
 */
export const GLOWING_PURPLE_EARTH_STYLE: StyleSpecification = {
  version: 8,
  name: 'Hauntly Glowing Purple Earth',
  sky: {
    'sky-color': '#060112',
    'atmosphere-blend': 0.92,
  },
  projection: {
    type: 'vertical-perspective',
  },
  sources: {
    'earth-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri, Maxar',
    },
  },
  layers: [
    {
      id: 'space-void',
      type: 'background',
      paint: {
        'background-color': '#05010d',
      },
    },
    {
      id: 'earth-surface',
      type: 'raster',
      source: 'earth-imagery',
      paint: {
        'raster-opacity': 0.95,
        'raster-saturation': -0.92,
        'raster-contrast': 0.35,
        'raster-brightness-max': 0.9,
        'raster-hue-rotate': 260,
      },
    },
  ],
};

/**
 * Get active default map style based on environment variables or gothic midnight dark globe
 */
export function getInitialMapStyle(): string | StyleSpecification {
  if (MAP_STYLE_URL_ENV) {
    return MAP_STYLE_URL_ENV;
  }
  if (MAPTILER_KEY_ENV) {
    return `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY_ENV}`;
  }
  return HAUNTLY_GOTHIC_DARK_GLOBE_STYLE;
}

/**
 * Check if WebGL is supported by the user's browser
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
