"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 1500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color("#00C4AD");
    const magenta = new THREE.Color("#F0356A");
    const gold = new THREE.Color("#F0A500");
    const palette = [cyan, magenta, gold];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 1.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.08;
    meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingRing({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = clock.elapsedTime * speed;
    ref.current.rotation.z = clock.elapsedTime * speed * 0.7;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed * 0.5) * 0.3;
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.8, 0.02, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.5} />
      <ParticleField />
      <FloatingRing position={[-1.5, 0.5, -1]} color="#00C4AD" speed={0.3} />
      <FloatingRing position={[1.8, -0.3, -0.5]} color="#F0356A" speed={0.2} />
      <FloatingRing position={[0, 1.2, -1.5]} color="#F0A500" speed={0.25} />
    </Canvas>
  );
}
