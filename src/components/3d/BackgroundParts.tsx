"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Box, Torus } from "@react-three/drei";
import * as THREE from "three";

function Part({ position, color, type }: { position: [number, number, number], color: string, type: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => Math.random() * 0.5 + 0.2, []);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * speed * 0.5;
      ref.current.rotation.y = t * speed;
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={2} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        {type === 0 && <boxGeometry args={[0.2, 0.2, 0.2]} />} {/* Keycap style */}
        {type === 1 && <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />} {/* Capacitor style */}
        {type === 2 && <torusGeometry args={[0.15, 0.05, 8, 16]} />} {/* O-ring style */}
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} transparent opacity={0.4} />
      </mesh>
    </Float>
  );
}

export default function BackgroundParts() {
  const parts = useMemo(() => {
    const temp = [];
    const colors = ["#00C4AD", "#F0356A", "#7B3FF2", "#F0A500"];
    for (let i = 0; i < 40; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 1) * 10
        ] as [number, number, number],
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.floor(Math.random() * 3)
      });
    }
    return temp;
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: -1 }}
      gl={{ alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, 10]} color="#00C4AD" intensity={1} />
        {parts.map((p, i) => (
          <Part key={i} {...p} />
        ))}
      </Suspense>
    </Canvas>
  );
}
