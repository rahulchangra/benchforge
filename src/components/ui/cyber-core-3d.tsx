"use client";

import React, { useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

function CoreMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.y += delta * 0.35;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.x += delta * 0.15;
      ringRef1.current.rotation.z += delta * 0.2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y += delta * 0.2;
      ringRef2.current.rotation.z -= delta * 0.15;
    }
  });

  return (
    <group>
      {/* Central Cybernetic Polyhedron */}
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#78350f"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe outer lattice */}
      <mesh scale={1.85}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#fbbf24"
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Primary Orbital Energy Ring */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.6, 0.025, 16, 100]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#c2410c"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Secondary Orbital Ring */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[3.1, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#9a3412"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function FloatingParticles({ count = 120 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = React.useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  });

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#fbbf24"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

export function CyberCore3D({
  className = "h-[420px] w-full",
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={`relative ${className} pointer-events-auto`}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-24 w-24 animate-pulse rounded-full border border-amber-500/20 bg-amber-500/5" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-8, -5, -5]} intensity={1.5} color="#ea580c" />
          <pointLight position={[5, -5, 5]} intensity={1.2} color="#f59e0b" />
          <CoreMesh />
          <FloatingParticles count={140} />
        </Canvas>
      </Suspense>
    </div>
  );
}
