"use client";

import React, { useRef, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/* Helper to convert Lat/Long to 3D Cartesian coordinates               */
/* ------------------------------------------------------------------ */
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/* Sample global open-source repository clusters */
const HUBS = [
  { name: "San Francisco", lat: 37.77, lon: -122.41, color: "#10b981", repos: 420 },
  { name: "Seattle", lat: 47.6, lon: -122.33, color: "#34d399", repos: 310 },
  { name: "New York", lat: 40.71, lon: -74.0, color: "#06b6d4", repos: 290 },
  { name: "London", lat: 51.5, lon: -0.12, color: "#38bdf8", repos: 380 },
  { name: "Berlin", lat: 52.52, lon: 13.4, color: "#818cf8", repos: 250 },
  { name: "Zurich", lat: 47.37, lon: 8.54, color: "#a78bfa", repos: 190 },
  { name: "Bengaluru", lat: 12.97, lon: 77.59, color: "#f59e0b", repos: 340 },
  { name: "Tokyo", lat: 35.67, lon: 139.65, color: "#ec4899", repos: 280 },
  { name: "Sydney", lat: -33.86, lon: 151.2, color: "#06b6d4", repos: 160 },
  { name: "Singapore", lat: 1.35, lon: 103.82, color: "#10b981", repos: 210 },
];

const CONNECTIONS = [
  [0, 3], // SF -> London
  [0, 7], // SF -> Tokyo
  [0, 2], // SF -> NY
  [3, 4], // London -> Berlin
  [3, 6], // London -> Bengaluru
  [7, 9], // Tokyo -> Singapore
  [6, 9], // Bengaluru -> Singapore
  [1, 0], // Seattle -> SF
  [2, 3], // NY -> London
  [4, 5], // Berlin -> Zurich
];

/* ------------------------------------------------------------------ */
/* Globe Points Mesh (Fibonacci Sphere with Continent Density)         */
/* ------------------------------------------------------------------ */
function GlobePoints({ radius = 2.4 }: { radius?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 2800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    const emerald = new THREE.Color("#10b981");
    const cyan = new THREE.Color("#06b6d4");
    const dim = new THREE.Color("#1e293b");

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      pos[i * 3] = x * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = z * radius;

      // Color variation: highlight dense bands
      const isClustered = Math.sin(x * 4) * Math.cos(z * 4) + y * 0.5 > 0.1;
      const c = isClustered ? (i % 2 === 0 ? emerald : cyan) : dim;

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [radius]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Global Arcs (Connecting Benchmark Repositories)                     */
/* ------------------------------------------------------------------ */
function GlobeArcs({ radius = 2.4 }: { radius?: number }) {
  const arcCurves = useMemo(() => {
    return CONNECTIONS.map(([srcIdx, dstIdx]) => {
      const src = HUBS[srcIdx];
      const dst = HUBS[dstIdx];
      const v1 = latLongToVector3(src.lat, src.lon, radius);
      const v2 = latLongToVector3(dst.lat, dst.lon, radius);

      // Midpoint elevated above sphere surface
      const distance = v1.distanceTo(v2);
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const elevation = radius + Math.min(distance * 0.35, 0.9);
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      return { curve, color: src.color };
    });
  }, [radius]);

  return (
    <group>
      {arcCurves.map(({ curve, color }, i) => {
        const points = curve.getPoints(40);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: new THREE.Color(color),
              transparent: true,
              opacity: 0.6,
              linewidth: 1,
            })
          )} />
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Glowing Repository Nodes on Globe Surface                           */
/* ------------------------------------------------------------------ */
function HubNodes({ radius = 2.4 }: { radius?: number }) {
  return (
    <group>
      {HUBS.map((hub, i) => {
        const pos = latLongToVector3(hub.lat, hub.lon, radius * 1.01);
        return (
          <group key={i} position={pos}>
            {/* Core Node Dot */}
            <mesh>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshBasicMaterial color={hub.color} />
            </mesh>
            {/* Outer Pulsing Halo */}
            <mesh>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color={hub.color} transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Outer Cybernetic Orbital Rings & Atmosphere                         */
/* ------------------------------------------------------------------ */
function CyberRings({ radius = 2.4 }: { radius?: number }) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.z += delta * 0.08;
    if (ringRef2.current) ringRef2.current.rotation.z -= delta * 0.05;
  });

  return (
    <group>
      {/* Inner Translucent Atmosphere Sphere */}
      <mesh>
        <sphereGeometry args={[radius * 0.99, 32, 32]} />
        <meshBasicMaterial
          color="#064e3b"
          transparent
          opacity={0.12}
          wireframe={false}
        />
      </mesh>

      {/* Primary Equator Ring */}
      <mesh ref={ringRef1} rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[radius * 1.25, radius * 1.258, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Polar Coordinate Ring */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 5, 0]}>
        <ringGeometry args={[radius * 1.38, radius * 1.386, 64]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive Interactive Root (Direct Mouse Tracking with Inertia)   */
/* ------------------------------------------------------------------ */
function InteractiveScene({ radius = 2.4 }: { radius?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotation = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Automatic slow baseline orbit
    autoRotation.current += delta * 0.15;

    // Responsive Cursor Tracking:
    // pointer.x ranges from -1 to 1; pointer.y ranges from -1 to 1
    const targetY = autoRotation.current + state.pointer.x * Math.PI * 0.75;
    const targetX = -state.pointer.y * Math.PI * 0.35;

    // Smooth spherical interpolation (damping inertia)
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetY,
      3.5,
      delta
    );
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetX,
      3.5,
      delta
    );
  });

  return (
    <group ref={groupRef}>
      <GlobePoints radius={radius} />
      <GlobeArcs radius={radius} />
      <HubNodes radius={radius} />
      <CyberRings radius={radius} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Exported Interactive Cyber Globe Component                          */
/* ------------------------------------------------------------------ */
export function InteractiveCyberGlobe({
  className = "w-full h-full",
  radius = 2.3,
}: {
  className?: string;
  radius?: number;
}) {
  const [hoveredHub, setHoveredHub] = useState<string>("San Francisco (420 Repos)");

  return (
    <div className={`relative ${className} select-none`}>
      {/* HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2.5">
        <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
          <span className="text-white font-bold">CYBER MAP</span> // CURSOR TRACKING ACTIVE
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2">
        <span className="text-[10px] font-mono text-neutral-500">ACTIVE CLUSTERS:</span>
        <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          {HUBS.length} GLOBAL NODES
        </span>
      </div>

      {/* 3D WebGL Canvas */}
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-32 w-32 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-10, -5, -5]} intensity={1.5} color="#06b6d4" />
          <pointLight position={[5, -5, 5]} intensity={1.2} color="#10b981" />
          <InteractiveScene radius={radius} />
        </Canvas>
      </Suspense>
    </div>
  );
}
