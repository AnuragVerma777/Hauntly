import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  RotateCcw,
  Plus,
  Minus,
  Globe2,
  Layers,
  Loader2,
} from 'lucide-react';
import type { GroupLocation, FriendPin } from '../../types/globe';
import { useAuth } from '../../hooks/useAuth';
import {
  getInitialMapStyle,
  HAUNTLY_GOTHIC_DARK_GLOBE_STYLE,
  REALISTIC_SATELLITE_STYLE,
  GLOWING_PURPLE_EARTH_STYLE,
  isWebGLSupported,
} from '../../lib/mapConfig';
import { subscribeToLiveFriendPins } from '../../lib/friendLocations';
import { GlobeAuraOverlay } from './GlobeAuraOverlay';
import { GothicCompass } from './GothicCompass';
import { FriendDetailCard } from './FriendDetailCard';

interface HauntlyGlobeProps {
  locations: GroupLocation[];
  selectedLocation: GroupLocation | null;
  onSelectLocation: (loc: GroupLocation) => void;
  onGlobeError?: (error: Error) => void;
  onOpenAddModal?: () => void;
}

export const HauntlyGlobe: React.FC<HauntlyGlobeProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onGlobeError,
  onOpenAddModal: _onOpenAddModal,
}) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const sanctuaryMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const friendMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());

  // Interactive controls state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeStyle, setActiveStyle] = useState<'gothic_dark' | 'purple_hologram' | 'satellite'>('gothic_dark');
  const [bearing, setBearing] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState<FriendPin | null>(null);
  const [liveFriends, setLiveFriends] = useState<FriendPin[]>([]);

  const isUserInteractingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Subscribe to dynamic live friend pins across realm
  useEffect(() => {
    const unsub = subscribeToLiveFriendPins(user?.id, (pins) => {
      setLiveFriends(pins);
    });
    return () => unsub();
  }, [user?.id]);

  // Initialize MapLibre GL JS Globe with Glowing Purple Atmosphere
  useEffect(() => {
    if (!containerRef.current) return;

    if (!isWebGLSupported()) {
      onGlobeError?.(new Error('WebGL is not supported in this browser.'));
      return;
    }

    try {
      const initialStyle = getInitialMapStyle();

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: initialStyle,
        projection: { type: 'vertical-perspective' },
        center: [15, 15],
        zoom: 1.45,
        minZoom: 0.5,
        maxZoom: 16,
        pitch: 0,
        bearing: 0,
        renderWorldCopies: false,
        attributionControl: false,
      } as any);

      map.on('load', () => {
        setMapLoaded(true);
        try {
          if (typeof (map as any).setProjection === 'function') {
            (map as any).setProjection({ type: 'vertical-perspective' });
          }
        } catch {
          // Projection set in options
        }
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre error:', e);
      });

      // Synchronize bearing for the gothic navigation compass
      const updateBearing = () => {
        setBearing(map.getBearing());
      };
      map.on('rotate', updateBearing);
      map.on('move', updateBearing);

      // Pause auto-rotation when user interacts
      const handleUserStart = () => {
        isUserInteractingRef.current = true;
      };
      const handleUserEnd = () => {
        setTimeout(() => {
          isUserInteractingRef.current = false;
        }, 1500);
      };

      map.on('mousedown', handleUserStart);
      map.on('touchstart', handleUserStart);
      map.on('wheel', handleUserStart);
      map.on('mouseup', handleUserEnd);
      map.on('touchend', handleUserEnd);

      mapRef.current = map;

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (err: unknown) {
      console.error('Failed to initialize MapLibre Globe:', err);
      onGlobeError?.(err instanceof Error ? err : new Error('Globe initialization failed.'));
    }
  }, [onGlobeError]);

  // Smooth Auto-Rotation Loop
  useEffect(() => {
    const rotateGlobe = () => {
      if (
        mapRef.current &&
        mapLoaded &&
        autoRotate &&
        !isUserInteractingRef.current &&
        !selectedLocation &&
        !selectedFriend
      ) {
        const center = mapRef.current.getCenter();
        let newLng = center.lng + 0.08;
        if (newLng > 180) newLng -= 360;
        mapRef.current.easeTo({
          center: [newLng, center.lat],
          duration: 100,
          easing: (n) => n,
        });
      }
      animFrameRef.current = requestAnimationFrame(rotateGlobe);
    };

    animFrameRef.current = requestAnimationFrame(rotateGlobe);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [autoRotate, mapLoaded, selectedLocation, selectedFriend]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER 1: GHOST-SHAPED LOCATION PINS FOR ONLINE FRIENDS (LIVE PINPOINTING)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove markers that are no longer in liveFriends
    const currentFriendIds = new Set(liveFriends.map((f) => f.id));
    for (const [id, marker] of friendMarkersRef.current.entries()) {
      if (!currentFriendIds.has(id)) {
        marker.remove();
        friendMarkersRef.current.delete(id);
      }
    }

    liveFriends.forEach((friend) => {
      let existingMarker = friendMarkersRef.current.get(friend.id);

      if (existingMarker) {
        existingMarker.setLngLat([friend.longitude, friend.latitude]);
      } else {
        const el = document.createElement('div');
        el.className = 'ghost-friend-pin-container cursor-pointer select-none';
        el.style.width = '38px';
        el.style.height = '52px';
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'flex-end';

        const isSelf = !!friend.isSelf;
        const flameColor1 = isSelf ? '#a7f3d0' : '#f0abfc';
        const flameColor2 = isSelf ? '#34d399' : '#c084fc';
        const flameColor3 = isSelf ? '#059669' : '#9333ea';
        const flameColor4 = isSelf ? '#064e3b' : '#581c87';
        const rippleColor = isSelf ? 'rgba(52, 211, 153, 0.4)' : 'rgba(168, 85, 247, 0.25)';
        const borderRipple = isSelf ? 'rgba(52, 211, 153, 0.9)' : 'rgba(192, 132, 252, 0.9)';
        const dropShadow = isSelf
          ? 'drop-shadow(0 0 10px #34d399) drop-shadow(0 0 20px rgba(52, 211, 153, 0.75))'
          : 'drop-shadow(0 0 10px #a855f7) drop-shadow(0 0 20px rgba(168, 85, 247, 0.75))';

        el.innerHTML = `
          <!-- Concentric Radar Wave Ground Ripples -->
          <div class="radar-ping" style="
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 26px;
            height: 12px;
            border-radius: 9999px;
            border: 1.5px solid ${borderRipple};
            background: ${rippleColor};
            animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            bottom: 1px;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 7px;
            border-radius: 9999px;
            background: ${isSelf ? 'rgba(52, 211, 153, 0.8)' : 'rgba(232, 121, 249, 0.7)'};
            box-shadow: 0 0 10px ${isSelf ? '#34d399' : '#c084fc'};
          "></div>

          <!-- Teardrop Pin Body with Flame Tip & Ghost Face -->
          <div class="ghost-pin-body" style="
            width: 32px;
            height: 42px;
            position: relative;
            z-index: 10;
            filter: ${dropShadow};
            transition: transform 0.25s ease;
          ">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
              <defs>
                <linearGradient id="friendPinGrad_${friend.id}" x1="16" y1="0" x2="16" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="${flameColor1}" />
                  <stop offset="35%" stop-color="${flameColor2}" />
                  <stop offset="70%" stop-color="${flameColor3}" />
                  <stop offset="100%" stop-color="${flameColor4}" />
                </linearGradient>
              </defs>
              <!-- Flame Teardrop Body -->
              <path d="M16 1.5C16 1.5 17.5 4.5 20 6.5C24 9.8 26.5 14.5 26.5 19.5C26.5 27 16 40.5 16 40.5C16 40.5 5.5 27 5.5 19.5C5.5 14.5 8 9.8 12 6.5C14.5 4.5 16 1.5 16 1.5Z"
                    fill="url(#friendPinGrad_${friend.id})"
                    stroke="#ffffff"
                    stroke-width="1.6" />
              <!-- Skull / Ghost Face Inside -->
              <g transform="translate(16, 18.5)">
                <path d="M -6 -6.5 C -6 -10.5, 6 -10.5, 6 -6.5 C 6 -3.5, 5 -1.2, 4 0.2 L 4 2.8 C 4 3.6, 2.5 4.2, 2 4.2 L -2 4.2 C -2.5 4.2, -4 3.6, -4 2.8 L -4 0.2 C -5 -1.2, -6 -3.5, -6 -6.5 Z" fill="#ffffff" />
                <circle cx="-2.6" cy="-4.8" r="1.4" fill="${isSelf ? '#064e3b' : '#2e1065'}" />
                <circle cx="2.6" cy="-4.8" r="1.4" fill="${isSelf ? '#064e3b' : '#2e1065'}" />
                <ellipse cx="0" cy="-1.8" rx="0.7" ry="1.0" fill="${isSelf ? '#064e3b' : '#2e1065'}" />
                <path d="M -1.8 1.8 L -1.8 3.8 M 0 1.8 L 0 3.8 M 1.8 1.8 L 1.8 3.8" stroke="${isSelf ? '#064e3b' : '#2e1065'}" stroke-width="0.7" />
              </g>
            </svg>
          </div>

          <!-- Tooltip on Hover -->
          <div class="marker-tooltip" style="
            position: absolute;
            bottom: 46px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(14, 5, 30, 0.95);
            border: 1.5px solid ${isSelf ? '#34d399' : '#c084fc'};
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            box-shadow: 0 4px 25px rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 50;
          ">
            <img src="${friend.avatar_url}" style="width: 20px; height: 20px; border-radius: 9999px; object-fit: cover;" onerror="this.src='/chat/avatar_designers_hero.png';" />
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 800; font-size: 11px; color: #ffffff;">${friend.name}</span>
              <span style="font-size: 9px; color: ${isSelf ? '#34d399' : '#c084fc'};">${friend.city} • ${isSelf ? 'Your Location' : 'Online'}</span>
            </div>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          const tooltip = el.querySelector('.marker-tooltip') as HTMLElement;
          const body = el.querySelector('.ghost-pin-body') as HTMLElement;
          if (tooltip) tooltip.style.opacity = '1';
          if (body) body.style.transform = 'scale(1.18) translateY(-4px)';
        });
        el.addEventListener('mouseleave', () => {
          const tooltip = el.querySelector('.marker-tooltip') as HTMLElement;
          const body = el.querySelector('.ghost-pin-body') as HTMLElement;
          if (tooltip) tooltip.style.opacity = '0';
          if (body) body.style.transform = 'scale(1) translateY(0)';
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedFriend(friend);
          onSelectLocation(null as any);
          map.flyTo({
            center: [friend.longitude, friend.latitude],
            zoom: 4.2,
            pitch: 45,
            duration: 2200,
            essential: true,
          });
        });

        const marker = new maplibregl.Marker({
          element: el,
          occludedOpacity: 0.15,
        } as any)
          .setLngLat([friend.longitude, friend.latitude])
          .addTo(map);

        friendMarkersRef.current.set(friend.id, marker);
      }
    });
  }, [liveFriends, mapLoaded, onSelectLocation]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER 2: GHOST-SHAPED COVEN SANCTUARY LOCATION PINS
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clean up markers no longer in list
    const activeIds = new Set(locations.map((l) => l.id));
    for (const [id, marker] of sanctuaryMarkersRef.current.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        sanctuaryMarkersRef.current.delete(id);
      }
    }

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      let existingMarker = sanctuaryMarkersRef.current.get(loc.id);

      if (!existingMarker) {
        const el = document.createElement('div');
        el.className = 'hauntly-sanctuary-pin cursor-pointer select-none';
        el.style.width = '38px';
        el.style.height = '52px';
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'flex-end';

        const isChosen = !!loc.is_selected;
        const isLeading = !isChosen && !!loc.leading_location;
        const flameColor1 = isChosen ? '#6ee7b7' : isLeading ? '#fde047' : '#f0abfc';
        const flameColor2 = isChosen ? '#10b981' : isLeading ? '#f59e0b' : '#c084fc';
        const flameColor3 = isChosen ? '#047857' : isLeading ? '#b45309' : '#9333ea';

        el.innerHTML = `
          <!-- Concentric Radar Wave Ground Ripples -->
          <div style="
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 26px;
            height: 12px;
            border-radius: 9999px;
            border: 1.5px solid ${isChosen ? '#34d399' : isLeading ? '#fbbf24' : 'rgba(192, 132, 252, 0.9)'};
            background: ${isChosen ? 'rgba(52,211,153,0.3)' : isLeading ? 'rgba(245,158,11,0.3)' : 'rgba(168, 85, 247, 0.25)'};
            animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <!-- Teardrop Flame Body -->
          <div class="sanctuary-pin-body" style="
            width: 32px;
            height: 42px;
            position: relative;
            z-index: 10;
            filter: drop-shadow(0 0 12px ${isChosen ? '#34d399' : isLeading ? '#fbbf24' : '#a855f7'});
            transition: transform 0.25s ease;
          ">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
              <defs>
                <linearGradient id="sanctuaryPinGrad_${loc.id}" x1="16" y1="0" x2="16" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="${flameColor1}" />
                  <stop offset="35%" stop-color="${flameColor2}" />
                  <stop offset="70%" stop-color="${flameColor3}" />
                  <stop offset="100%" stop-color="#3b0764" />
                </linearGradient>
              </defs>
              <path d="M16 1.5C16 1.5 17.5 4.5 20 6.5C24 9.8 26.5 14.5 26.5 19.5C26.5 27 16 40.5 16 40.5C16 40.5 5.5 27 5.5 19.5C5.5 14.5 8 9.8 12 6.5C14.5 4.5 16 1.5 16 1.5Z"
                    fill="url(#sanctuaryPinGrad_${loc.id})"
                    stroke="#ffffff"
                    stroke-width="1.6" />
              <!-- Ghost / Skull Icon -->
              <g transform="translate(16, 18.5)">
                <path d="M -6 -6.5 C -6 -10.5, 6 -10.5, 6 -6.5 C 6 -3.5, 5 -1.2, 4 0.2 L 4 2.8 C 4 3.6, 2.5 4.2, 2 4.2 L -2 4.2 C -2.5 4.2, -4 3.6, -4 2.8 L -4 0.2 C -5 -1.2, -6 -3.5, -6 -6.5 Z" fill="#ffffff" />
                <circle cx="-2.6" cy="-4.8" r="1.4" fill="#2e1065" />
                <circle cx="2.6" cy="-4.8" r="1.4" fill="#2e1065" />
                <ellipse cx="0" cy="-1.8" rx="0.7" ry="1.0" fill="#2e1065" />
                <path d="M -1.8 1.8 L -1.8 3.8 M 0 1.8 L 0 3.8 M 1.8 1.8 L 1.8 3.8" stroke="#2e1065" stroke-width="0.7" />
              </g>
            </svg>
          </div>

          <!-- Tooltip on Hover -->
          <div class="marker-tooltip" style="
            position: absolute;
            bottom: 46px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(14, 5, 30, 0.95);
            border: 1.5px solid ${isChosen ? '#34d399' : isLeading ? '#fbbf24' : '#c084fc'};
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            box-shadow: 0 4px 25px rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 50;
          ">
            <span>${loc.name}</span>
            ${isChosen ? '<span style="color: #34d399; font-size: 9px; font-weight: 800;">⭐ CHOSEN</span>' : ''}
            ${isLeading ? '<span style="color: #fbbf24; font-size: 9px; font-weight: 800;">👑 LEADING</span>' : ''}
            ${loc.vote_count ? `<span style="background: rgba(168,85,247,0.3); border: 1px solid rgba(168,85,247,0.5); padding: 1px 5px; border-radius: 6px; font-size: 9px; font-family: monospace;">${loc.vote_count} votes</span>` : ''}
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          const tooltip = el.querySelector('.marker-tooltip') as HTMLElement;
          const body = el.querySelector('.sanctuary-pin-body') as HTMLElement;
          if (tooltip) tooltip.style.opacity = '1';
          if (body) body.style.transform = 'scale(1.18) translateY(-4px)';
        });
        el.addEventListener('mouseleave', () => {
          const tooltip = el.querySelector('.marker-tooltip') as HTMLElement;
          const body = el.querySelector('.sanctuary-pin-body') as HTMLElement;
          if (tooltip) tooltip.style.opacity = '0';
          if (body) body.style.transform = 'scale(1) translateY(0)';
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedFriend(null);
          onSelectLocation(loc);
          map.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: 3.8,
            pitch: 45,
            duration: 2200,
            essential: true,
          });
        });

        const marker = new maplibregl.Marker({
          element: el,
          occludedOpacity: 0.15,
        } as any)
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map);

        sanctuaryMarkersRef.current.set(loc.id, marker);
        existingMarker = marker;
      }

      // Update selected state
      const el = existingMarker.getElement();
      const body = el.querySelector('.sanctuary-pin-body') as HTMLElement;
      if (body) {
        if (isSelected) {
          body.style.transform = 'scale(1.25) translateY(-5px)';
          body.style.filter = 'drop-shadow(0 0 16px #f472b6) drop-shadow(0 0 35px rgba(244,114,182,0.9))';
        } else {
          body.style.transform = 'scale(1) translateY(0)';
          body.style.filter = loc.is_selected
            ? 'drop-shadow(0 0 12px #34d399)'
            : loc.leading_location
            ? 'drop-shadow(0 0 12px #fbbf24)'
            : 'drop-shadow(0 0 10px #a855f7)';
        }
      }
    });
  }, [locations, selectedLocation, mapLoaded, onSelectLocation]);

  // Camera flyTo when selectedLocation changes from outside
  useEffect(() => {
    if (!mapRef.current || !selectedLocation || !mapLoaded) return;
    mapRef.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 3.8,
      pitch: 45,
      duration: 2200,
      essential: true,
    });
  }, [selectedLocation, mapLoaded]);

  // Handlers for HUD Controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 500 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 500 });
  };

  const handleResetNorth = () => {
    mapRef.current?.resetNorthPitch({ duration: 1000 });
  };

  const handleRecenter = () => {
    mapRef.current?.flyTo({
      center: [15, 25],
      zoom: 0.88,
      pitch: 16,
      bearing: 0,
      duration: 2000,
    });
  };

  const handleToggleStyle = () => {
    const map = mapRef.current;
    if (!map) return;
    if (activeStyle === 'gothic_dark') {
      map.setStyle(GLOWING_PURPLE_EARTH_STYLE);
      setActiveStyle('purple_hologram');
    } else if (activeStyle === 'purple_hologram') {
      map.setStyle(REALISTIC_SATELLITE_STYLE);
      setActiveStyle('satellite');
    } else {
      map.setStyle(HAUNTLY_GOTHIC_DARK_GLOBE_STYLE);
      setActiveStyle('gothic_dark');
    }
  };

  const handleFlyToFriend = (friend: FriendPin) => {
    setSelectedFriend(friend);
    onSelectLocation(null as any);
    mapRef.current?.flyTo({
      center: [friend.longitude, friend.latitude],
      zoom: 4.2,
      pitch: 45,
      duration: 2200,
      essential: true,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#05010d]">
      {/* ── 1. Cosmic Atmosphere & Pinpoint Starfield Void ── */}
      <GlobeAuraOverlay />

      {/* ── 4. MapLibre GL 3D Earth Canvas ── */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10" />

      {/* ── 4c. Top-Left Signature Hauntly Gothic Logo ── */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-30 flex items-center gap-2 select-none pointer-events-none">
        <img
          src="/hauntly_logo.png"
          alt="Hauntly"
          className="h-9 sm:h-11 w-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* ── 4d. Top-Right Gothic Celestial Navigation Compass ── */}
      <GothicCompass bearing={bearing} onResetNorth={handleResetNorth} />

      {/* ── 7. Selected Friend Detail Card ── */}
      {selectedFriend && (
        <div className="absolute bottom-20 left-6 sm:bottom-24 sm:left-8 z-40">
          <FriendDetailCard
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
            onFlyTo={handleFlyToFriend}
          />
        </div>
      )}

      {/* ── 8. Loading Overlay ── */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#05010d] text-purple-300">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
          <h4 className="text-sm font-serif font-bold text-white tracking-wide">
            Attuning 3D Planetary Projection...
          </h4>
          <p className="text-xs font-mono text-purple-400/60 mt-1">
            Summoning glowing purple atmosphere and celestial coordinates
          </p>
        </div>
      )}

      {/* ── 9. Floating Secondary Utility Dock (Right Side) ── */}
      <div className="absolute top-24 right-5 sm:right-7 z-20 flex flex-col items-center gap-2">
        {/* Style Switcher */}
        <button
          type="button"
          onClick={handleToggleStyle}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
            activeStyle === 'gothic_dark'
              ? 'bg-purple-700/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'bg-[#120526]/80 border-purple-800/40 text-purple-300 hover:text-white'
          }`}
          title={`Style: ${
            activeStyle === 'gothic_dark'
              ? '🌌 Hauntly Gothic Midnight Globe'
              : activeStyle === 'purple_hologram'
              ? '🔮 Glowing Purple Hologram'
              : '🌍 Realistic Satellite'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
            autoRotate
              ? 'bg-purple-700/80 border-purple-400 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
              : 'bg-[#120526]/80 border-purple-800/40 text-purple-400/70 hover:text-white'
          }`}
          title={autoRotate ? 'Pause Earth Rotation' : 'Start Earth Rotation'}
        >
          <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin [animation-duration:12s]' : ''}`} />
        </button>

        {/* Recenter Globe */}
        <button
          type="button"
          onClick={handleRecenter}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#120526]/80 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Recenter World View"
        >
          <Globe2 className="w-4 h-4" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col rounded-2xl bg-[#120526]/80 border border-purple-800/40 overflow-hidden shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-purple-900/40" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
