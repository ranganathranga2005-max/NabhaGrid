import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Cesium from 'cesium';
import { Satellite } from '../../models/satellite';
import { GroundStation } from '../../models/groundStation';
import { CommunicationLink } from '../../models/link';
import { ConstellationRoute } from '../../models/route';
import { RfiState } from '../../models/rfi';
import { generateOrbitPathPoints } from '../../simulation/orbitalSimulator';
import { createSatelliteSvgDataUrl, createGroundStationSvgDataUrl } from './assets';
import { Focus, Globe as GlobeIcon, Eye, Radio, RotateCcw, Layers } from 'lucide-react';

interface CesiumGlobeProps {
  satellites: Satellite[];
  groundStations: GroundStation[];
  links: CommunicationLink[];
  activeRoute: ConstellationRoute | null;
  rfiState: RfiState;
  simulationEpochMs: number;
  referenceEpochMs: number;
  selectedSatelliteId: string | null;
  selectedGroundStationId: string | null;
  onSelectSatellite: (id: string | null) => void;
  onSelectGroundStation: (id: string | null) => void;
  showSatellites?: boolean;
  showOrbits?: boolean;
  showGroundStations?: boolean;
  showLinks?: boolean;
  showRfiRegion?: boolean;
  showLabels?: boolean;
}

// Plane colors: vibrant high-contrast neon lines
const PLANE_COLORS = [
  Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.85), // Cyan
  Cesium.Color.fromCssColorString('#10b981').withAlpha(0.85), // Emerald
  Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.85), // Amber
  Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.85), // Purple
  Cesium.Color.fromCssColorString('#ec4899').withAlpha(0.85), // Magenta
];

// Pre-cached static SVG URLs to eliminate runtime SVG rasterization flickering
const SVG_NOMINAL_SAT = createSatelliteSvgDataUrl('#00e5ff', false);
const SVG_SELECTED_SAT = createSatelliteSvgDataUrl('#fbbf24', false);
const SVG_RFI_SAT = createSatelliteSvgDataUrl('#ef4444', true);

// Pre-cached static polyline materials to avoid shader reallocation flickering
const MAT_ISL = new Cesium.PolylineDashMaterialProperty({
  color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
  dashLength: 12.0,
});
const MAT_SGL = new Cesium.PolylineDashMaterialProperty({
  color: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.75),
  dashLength: 12.0,
});
const MAT_RFI_DEGRADED = new Cesium.PolylineDashMaterialProperty({
  color: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.9),
  dashLength: 12.0,
});
const MAT_ROUTE_GLOW = new Cesium.PolylineGlowMaterialProperty({
  glowPower: 0.35,
  color: Cesium.Color.fromCssColorString('#a855f7'),
});
const MAT_RFI_BEAM = new Cesium.PolylineDashMaterialProperty({
  color: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.85),
  dashLength: 10.0,
});

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  satellites,
  groundStations,
  links,
  activeRoute,
  rfiState,
  simulationEpochMs,
  referenceEpochMs,
  selectedSatelliteId,
  selectedGroundStationId,
  onSelectSatellite,
  onSelectGroundStation,
  showSatellites = true,
  showOrbits = true,
  showGroundStations = true,
  showLinks = true,
  showRfiRegion = true,
  showLabels = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [imageryMode, setImageryMode] = useState<'NATURAL_EARTH' | 'SATELLITE'>('NATURAL_EARTH');
  const [cameraMode, setCameraMode] = useState<'GLOBAL' | 'POLAR' | 'EQUATORIAL'>('GLOBAL');

  // Track state keys to avoid destroying and recreating entities 5x per second
  const lastRouteKeyRef = useRef<string>('');
  const lastRfiKeyRef = useRef<string>('');
  const groundStationSvgsRef = useRef<Map<string, string>>(new Map());

  const entitiesRef = useRef<{
    satellites: Map<string, Cesium.Entity>;
    orbits: Map<string, Cesium.Entity>;
    groundStations: Map<string, Cesium.Entity>;
    links: Map<string, Cesium.Entity>;
    routeEntities: Cesium.Entity[];
    rfiEntities: Cesium.Entity[];
  }>({
    satellites: new Map(),
    orbits: new Map(),
    groundStations: new Map(),
    links: new Map(),
    routeEntities: [],
    rfiEntities: [],
  });

  // Initialize Cesium Viewer with SINGLE stable base layer (no Z-fighting)
  useEffect(() => {
    if (!containerRef.current) return;

    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken;
    }

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: false, // Critical: stops Cesium from creating a conflicting default Bing/Ion layer
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: true,
      shouldAnimate: false,
      requestRenderMode: false,
    });

    const scene = viewer.scene;
    const globe = scene.globe;

    // Rock-solid lighting: constant ambient daylight prevents dark-side flickering
    globe.enableLighting = false;
    globe.showGroundAtmosphere = true;
    globe.atmosphereLightIntensity = 1.6;
    globe.baseColor = Cesium.Color.fromCssColorString('#0b2447');
    globe.depthTestAgainstTerrain = false;
    globe.maximumScreenSpaceError = 2; // Smooth tile transitions without flickering

    if (scene.postProcessStages?.bloom) {
      scene.postProcessStages.bloom.enabled = false;
    }

    // Set stable local Natural Earth II imagery
    async function loadBaseImagery() {
      scene.imageryLayers.removeAll();
      try {
        const localProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
          Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        );
        scene.imageryLayers.addImageryProvider(localProvider);
      } catch (err) {
        console.warn('Local Natural Earth II base loaded:', err);
      }
    }
    loadBaseImagery();

    // Initial camera position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(25.0, 15.0, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
    });

    // Screen click handler
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const pickedObject = scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        const satId = entity.properties?.satId?.getValue();
        const gsId = entity.properties?.gsId?.getValue();

        if (satId) {
          onSelectSatellite(satId);
        } else if (gsId) {
          onSelectGroundStation(gsId);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [onSelectSatellite, onSelectGroundStation]);

  // Switch imagery layer cleanly on demand without stacking/z-fighting
  const handleToggleImagery = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const scene = viewer.scene;

    if (imageryMode === 'NATURAL_EARTH') {
      try {
        const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
          { enablePickFeatures: false }
        );
        scene.imageryLayers.removeAll();
        scene.imageryLayers.addImageryProvider(esriProvider);
        setImageryMode('SATELLITE');
      } catch (e) {
        console.warn('ArcGIS satellite imagery offline, staying on Natural Earth', e);
      }
    } else {
      try {
        const localProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
          Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        );
        scene.imageryLayers.removeAll();
        scene.imageryLayers.addImageryProvider(localProvider);
        setImageryMode('NATURAL_EARTH');
      } catch (e) {
        console.warn('Natural Earth imagery switch error', e);
      }
    }
  }, [imageryMode]);

  // 1. Update Orbit Trajectories (only recomputed when satellite count or orbit planes change)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { orbits } = entitiesRef.current;
    orbits.forEach((entity) => viewer.entities.remove(entity));
    orbits.clear();

    if (!showOrbits || satellites.length === 0) return;

    const planeSats = new Map<number, Satellite>();
    satellites.forEach((sat) => {
      if (!planeSats.has(sat.planeId)) {
        planeSats.set(sat.planeId, sat);
      }
    });

    planeSats.forEach((sat, planeId) => {
      const points = generateOrbitPathPoints(sat.keplerian, simulationEpochMs, referenceEpochMs, 90);
      const positions = points.map((p) =>
        Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude)
      );

      const color = PLANE_COLORS[(planeId - 1) % PLANE_COLORS.length];

      const orbitEntity = viewer.entities.add({
        id: `orbit-plane-${planeId}`,
        name: `Orbital Plane ${planeId}`,
        polyline: {
          positions,
          width: 1.8,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.12,
            color,
          }),
        },
      });

      orbits.set(`plane-${planeId}`, orbitEntity);
    });
  }, [satellites.length, showOrbits, referenceEpochMs]);

  // 2. Update Ground Stations
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { groundStations: gsMap } = entitiesRef.current;

    if (!showGroundStations) {
      gsMap.forEach((e) => viewer.entities.remove(e));
      gsMap.clear();
      return;
    }

    groundStations.forEach((gs) => {
      let entity = gsMap.get(gs.id);
      const isSelected = selectedGroundStationId === gs.id;

      if (!entity) {
        let dishSvg = groundStationSvgsRef.current.get(gs.name);
        if (!dishSvg) {
          dishSvg = createGroundStationSvgDataUrl(gs.name);
          groundStationSvgsRef.current.set(gs.name, dishSvg);
        }

        entity = viewer.entities.add({
          id: `gs-${gs.id}`,
          name: gs.name,
          properties: new Cesium.PropertyBag({ gsId: gs.id }),
          position: Cesium.Cartesian3.fromDegrees(
            gs.longitude,
            gs.latitude,
            gs.elevationMeters + 2000
          ),
          billboard: {
            image: dishSvg,
            width: isSelected ? 44 : 36,
            height: isSelected ? 44 : 36,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            eyeOffset: new Cesium.Cartesian3(0, 0, -100),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: showLabels ? {
            text: `${gs.id} (${gs.name.split(' ')[0]})`,
            font: '10px JetBrains Mono, monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 4),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          } : undefined,
        });
        gsMap.set(gs.id, entity);
      } else {
        if (entity.billboard) {
          entity.billboard.width = new Cesium.ConstantProperty(isSelected ? 44 : 36);
          entity.billboard.height = new Cesium.ConstantProperty(isSelected ? 44 : 36);
        }
        if (entity.label) {
          entity.label.show = new Cesium.ConstantProperty(showLabels);
        }
      }
    });
  }, [groundStations, selectedGroundStationId, showGroundStations, showLabels]);

  // 3. Update Satellites without SVG re-rasterization (smooth 60 FPS motion)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { satellites: satMap } = entitiesRef.current;
    const currentSatIds = new Set(satellites.map((s) => s.id));

    if (!showSatellites) {
      satMap.forEach((e) => viewer.entities.remove(e));
      satMap.clear();
      return;
    }

    satMap.forEach((entity, id) => {
      if (!currentSatIds.has(id)) {
        viewer.entities.remove(entity);
        satMap.delete(id);
      }
    });

    satellites.forEach((sat) => {
      const isSelected = selectedSatelliteId === sat.id;
      const isRfi = sat.status === 'RFI_DETECTED';
      const position = Cesium.Cartesian3.fromDegrees(
        sat.longitude,
        sat.latitude,
        sat.altitudeKm * 1000
      );

      const targetSvg = isRfi ? SVG_RFI_SAT : isSelected ? SVG_SELECTED_SAT : SVG_NOMINAL_SAT;
      const visualState = `${isSelected ? '1' : '0'}-${isRfi ? '1' : '0'}`;

      let entity = satMap.get(sat.id);

      if (!entity) {
        entity = viewer.entities.add({
          id: `sat-${sat.id}`,
          name: sat.name,
          properties: new Cesium.PropertyBag({ satId: sat.id, visualState }),
          position,
          billboard: {
            image: targetSvg,
            width: isSelected ? 46 : 34,
            height: isSelected ? 46 : 34,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -200),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: showLabels ? {
            text: sat.id,
            font: '10px JetBrains Mono, monospace',
            fillColor: isSelected ? Cesium.Color.YELLOW : isRfi ? Cesium.Color.RED : Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          } : undefined,
        });
        satMap.set(sat.id, entity);
      } else {
        // Fast in-place position update (no flickering)
        entity.position = new Cesium.ConstantPositionProperty(position);

        // ONLY update texture image if satellite status/selection actually changed!
        const prevVisualState = entity.properties?.visualState?.getValue();
        if (prevVisualState !== visualState) {
          entity.properties?.addProperty('visualState', visualState);
          if (entity.billboard) {
            entity.billboard.image = new Cesium.ConstantProperty(targetSvg);
            entity.billboard.width = new Cesium.ConstantProperty(isSelected ? 46 : 34);
            entity.billboard.height = new Cesium.ConstantProperty(isSelected ? 46 : 34);
          }
          if (entity.label) {
            entity.label.fillColor = new Cesium.ConstantProperty(
              isSelected ? Cesium.Color.YELLOW : isRfi ? Cesium.Color.RED : Cesium.Color.WHITE
            );
          }
        }

        if (entity.label && entity.label.show?.getValue() !== showLabels) {
          entity.label.show = new Cesium.ConstantProperty(showLabels);
        }
      }
    });
  }, [satellites, selectedSatelliteId, showSatellites, showLabels]);

  // 4. Update Feasible Links without material re-allocation
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { links: linkMap } = entitiesRef.current;
    const currentLinkIds = new Set(links.map((l) => l.id));

    linkMap.forEach((entity, id) => {
      if (!currentLinkIds.has(id) || !showLinks) {
        viewer.entities.remove(entity);
        linkMap.delete(id);
      }
    });

    if (!showLinks) return;

    const nodeCoords = new Map<string, Cesium.Cartesian3>();
    satellites.forEach((s) => {
      nodeCoords.set(s.id, Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitudeKm * 1000));
    });
    groundStations.forEach((gs) => {
      nodeCoords.set(gs.id, Cesium.Cartesian3.fromDegrees(gs.longitude, gs.latitude, gs.elevationMeters));
    });

    links.forEach((link) => {
      const p1 = nodeCoords.get(link.sourceId);
      const p2 = nodeCoords.get(link.targetId);
      if (!p1 || !p2) return;

      const isDegraded = link.status === 'RFI_DEGRADED';
      const targetMaterial = isDegraded ? MAT_RFI_DEGRADED : link.linkType === 'ISL' ? MAT_ISL : MAT_SGL;

      let entity = linkMap.get(link.id);
      if (!entity) {
        entity = viewer.entities.add({
          id: `link-${link.id}`,
          properties: new Cesium.PropertyBag({ status: link.status }),
          polyline: {
            positions: [p1, p2],
            width: link.linkType === 'ISL' ? 1.5 : 2.0,
            arcType: Cesium.ArcType.NONE, // Straight space line, stops curvature flickering
            material: targetMaterial,
          },
        });
        linkMap.set(link.id, entity);
      } else {
        // Fast in-place position update
        if (entity.polyline) {
          entity.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          const prevStatus = entity.properties?.status?.getValue();
          if (prevStatus !== link.status) {
            entity.properties?.addProperty('status', link.status);
            entity.polyline.material = targetMaterial;
          }
        }
      }
    });
  }, [links, satellites, groundStations, showLinks]);

  // 5. Update Route Overlay (only rebuilt when the route node sequence changes)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const routeKey = activeRoute && activeRoute.nodeSequence.length >= 2
      ? activeRoute.nodeSequence.join('->')
      : '';

    const { routeEntities } = entitiesRef.current;

    const nodeCoords = new Map<string, Cesium.Cartesian3>();
    satellites.forEach((s) => {
      nodeCoords.set(s.id, Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitudeKm * 1000));
    });
    groundStations.forEach((gs) => {
      nodeCoords.set(gs.id, Cesium.Cartesian3.fromDegrees(gs.longitude, gs.latitude, gs.elevationMeters));
    });

    if (routeKey !== lastRouteKeyRef.current) {
      // Rebuild route segments only on actual topology change
      routeEntities.forEach((e) => viewer.entities.remove(e));
      routeEntities.length = 0;
      lastRouteKeyRef.current = routeKey;

      if (!activeRoute || activeRoute.nodeSequence.length < 2) return;

      for (let i = 0; i < activeRoute.nodeSequence.length - 1; i++) {
        const n1 = activeRoute.nodeSequence[i];
        const n2 = activeRoute.nodeSequence[i + 1];
        const p1 = nodeCoords.get(n1);
        const p2 = nodeCoords.get(n2);

        if (p1 && p2) {
          const routeSegment = viewer.entities.add({
            polyline: {
              positions: [p1, p2],
              width: 3.5,
              arcType: Cesium.ArcType.NONE,
              material: MAT_ROUTE_GLOW,
            },
          });
          routeEntities.push(routeSegment);
        }
      }
    } else if (activeRoute && routeEntities.length > 0) {
      // Smooth position update of existing route polylines
      for (let i = 0; i < activeRoute.nodeSequence.length - 1 && i < routeEntities.length; i++) {
        const p1 = nodeCoords.get(activeRoute.nodeSequence[i]);
        const p2 = nodeCoords.get(activeRoute.nodeSequence[i + 1]);
        const poly = routeEntities[i]?.polyline;
        if (p1 && p2 && poly) {
          poly.positions = new Cesium.ConstantProperty([p1, p2]);
        }
      }
    }
  }, [activeRoute, satellites, groundStations]);

  // 6. Update RFI Region (only rebuilt when demo scenario status or affected sats change)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const rfiKey = showRfiRegion && rfiState.isDemoScenario && rfiState.emitterCoordinates
      ? `active-${rfiState.emitterCoordinates.latitude}-${rfiState.emitterCoordinates.longitude}-${rfiState.affectedSatelliteIds.join(',')}`
      : 'inactive';

    const { rfiEntities } = entitiesRef.current;

    if (rfiKey === lastRfiKeyRef.current) {
      return; // Do not touch entities when unchanged
    }

    lastRfiKeyRef.current = rfiKey;
    rfiEntities.forEach((e) => viewer.entities.remove(e));
    rfiEntities.length = 0;

    if (showRfiRegion && rfiState.isDemoScenario && rfiState.emitterCoordinates) {
      const emitter = rfiState.emitterCoordinates;
      const emitterPos = Cesium.Cartesian3.fromDegrees(
        emitter.longitude,
        emitter.latitude,
        emitter.altitudeMeters
      );

      const marker = viewer.entities.add({
        position: emitterPos,
        point: {
          pixelSize: 13,
          color: Cesium.Color.fromCssColorString('#ef4444'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: 'RFI SOURCE (DEMO)',
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#ef4444'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      rfiEntities.push(marker);

      const uncertaintyRadius = (rfiState.uncertaintyRadiusKm || 65) * 1000;
      const ellipse = viewer.entities.add({
        position: emitterPos,
        ellipse: {
          semiMinorAxis: uncertaintyRadius * 0.75,
          semiMajorAxis: uncertaintyRadius,
          material: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.25),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#ef4444'),
          outlineWidth: 2,
        },
      });
      rfiEntities.push(ellipse);

      satellites
        .filter((s) => rfiState.affectedSatelliteIds.includes(s.id))
        .forEach((s) => {
          const satPos = Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitudeKm * 1000);
          const rfiBeam = viewer.entities.add({
            polyline: {
              positions: [emitterPos, satPos],
              width: 2.0,
              arcType: Cesium.ArcType.NONE,
              material: MAT_RFI_BEAM,
            },
          });
          rfiEntities.push(rfiBeam);
        });
    }
  }, [rfiState, satellites, showRfiRegion]);

  // Camera presets
  const handleSetView = useCallback((mode: 'GLOBAL' | 'POLAR' | 'EQUATORIAL') => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setCameraMode(mode);

    if (mode === 'GLOBAL') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(25.0, 15.0, 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-88),
          roll: 0,
        },
        duration: 1.2,
      });
    } else if (mode === 'POLAR') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 89.0, 18000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-89),
          roll: 0,
        },
        duration: 1.2,
      });
    } else if (mode === 'EQUATORIAL') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(75.0, 0.0, 15000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-88),
          roll: 0,
        },
        duration: 1.2,
      });
    }
  }, []);

  const handleFocusSelected = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (selectedSatelliteId) {
      const sat = satellites.find((s) => s.id === selectedSatelliteId);
      if (sat) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, (sat.altitudeKm + 2200) * 1000),
          duration: 1.2,
        });
      }
    } else if (selectedGroundStationId) {
      const gs = groundStations.find((g) => g.id === selectedGroundStationId);
      if (gs) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(gs.longitude, gs.latitude, 2200000),
          duration: 1.2,
        });
      }
    } else if (satellites.length > 0) {
      const sat = satellites[0];
      onSelectSatellite(sat.id);
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, (sat.altitudeKm + 2200) * 1000),
        duration: 1.2,
      });
    }
  }, [selectedSatelliteId, selectedGroundStationId, satellites, groundStations, onSelectSatellite]);

  const handleResetView = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setCameraMode('GLOBAL');
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(25.0, 15.0, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
      duration: 1.0,
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Camera & Basemap Presets Bar */}
      <div className="mc-camera-presets">
        <button
          onClick={() => handleSetView('GLOBAL')}
          className={`mc-btn ${cameraMode === 'GLOBAL' ? 'mc-btn-primary' : ''}`}
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
        >
          <GlobeIcon size={12} />
          <span>Global</span>
        </button>
        <button
          onClick={() => handleSetView('POLAR')}
          className={`mc-btn ${cameraMode === 'POLAR' ? 'mc-btn-primary' : ''}`}
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
        >
          <Eye size={12} />
          <span>Polar</span>
        </button>
        <button
          onClick={() => handleSetView('EQUATORIAL')}
          className={`mc-btn ${cameraMode === 'EQUATORIAL' ? 'mc-btn-primary' : ''}`}
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
        >
          <Radio size={12} />
          <span>Equatorial</span>
        </button>
        <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(0, 229, 255, 0.25)', margin: '0 4px' }} />
        <button
          onClick={handleFocusSelected}
          className="mc-btn"
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
          title="Track Selected Satellite or Ground Station"
        >
          <Focus size={12} />
          <span>Track Node</span>
        </button>
        <button
          onClick={handleResetView}
          className="mc-btn"
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
          title="Reset Camera to Global View"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
        <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(0, 229, 255, 0.25)', margin: '0 4px' }} />
        <button
          onClick={handleToggleImagery}
          className={`mc-btn ${imageryMode === 'SATELLITE' ? 'mc-btn-primary' : ''}`}
          style={{ padding: '4px 9px', fontSize: '10.5px' }}
          title="Toggle High-Res Satellite vs Natural Earth Imagery"
        >
          <Layers size={11} />
          <span>{imageryMode === 'SATELLITE' ? 'Satellite HD' : 'Natural Earth'}</span>
        </button>
      </div>
    </div>
  );
};
