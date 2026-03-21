"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ── Keyboard Model (stylized low-poly) ────────────────────────
function KeyboardModel({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.4;
    groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.6) * 0.15;
  });

  const keyPositions = useMemo(() => {
    const keys: [number, number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        keys.push([c * 0.18 - 1.17, 0.08, r * 0.18 - 0.27]);
      }
    }
    return keys;
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {/* Base body */}
      <RoundedBox args={[2.8, 0.12, 1.1]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      {/* Keys */}
      {keyPositions.map((kp, i) => (
        <RoundedBox
          key={i}
          args={[0.14, 0.06, 0.14]}
          radius={0.015}
          smoothness={2}
          position={kp}
        >
          <meshStandardMaterial
            color={i % 7 === 0 ? "#00C4AD" : i % 11 === 0 ? "#F0356A" : "#2a2a3e"}
            metalness={0.4}
            roughness={0.5}
            emissive={i % 7 === 0 ? "#00C4AD" : i % 11 === 0 ? "#F0356A" : "#000"}
            emissiveIntensity={i % 7 === 0 || i % 11 === 0 ? 0.3 : 0}
          />
        </RoundedBox>
      ))}
      {/* RGB underglow */}
      <pointLight position={[0, -0.15, 0]} color="#00C4AD" intensity={2} distance={1.5} />
    </group>
  );
}

// ── Mouse Model ────────────────────────────────────────────────
function MouseModel({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.5;
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.08;
    groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + 1) * 0.12;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.25, 0.55, 8, 16]} />
        <meshStandardMaterial color="#0f0f1a" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Top left button */}
      <mesh position={[-0.1, 0.28, 0.05]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.35]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Top right button */}
      <mesh position={[0.1, 0.28, 0.05]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.35]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* RGB strip */}
      <mesh position={[0, -0.1, -0.24]}>
        <boxGeometry args={[0.48, 0.04, 0.05]} />
        <meshStandardMaterial color="#00C4AD" emissive="#00C4AD" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, -0.1, -0.3]} color="#00C4AD" intensity={1.5} distance={0.8} />
    </group>
  );
}

// ── Headphone Model ────────────────────────────────────────────
function HeadphoneModel({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.35;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.05;
    groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5 + 2) * 0.18;
  });

  return (
    <group ref={groupRef} position={position} scale={0.85}>
      {/* Headband arc */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left ear cup */}
      <group position={[-0.55, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
          <meshStandardMaterial color="#0f0f1a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.22, 0.03, 8, 24]} />
          <meshStandardMaterial color="#F0356A" emissive="#F0356A" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[-0.1, 0, 0]} color="#F0356A" intensity={1} distance={0.5} />
      </group>
      {/* Right ear cup */}
      <group position={[0.55, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
          <meshStandardMaterial color="#0f0f1a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.22, 0.03, 8, 24]} />
          <meshStandardMaterial color="#00C4AD" emissive="#00C4AD" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0.1, 0, 0]} color="#00C4AD" intensity={1} distance={0.5} />
      </group>
    </group>
  );
}

// ── Floating Particles ─────────────────────────────────────────
function FloatingParticles() {
  const groupRef = useRef<THREE.Points>(null);
  const count = 400;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#00C4AD"),
      new THREE.Color("#F0356A"),
      new THREE.Color("#F0A500"),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.03;
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Main Scene Export ──────────────────────────────────────────
export default function FloatingGearScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 55 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        {/* Tăng mạnh ánh sáng để thấy rõ model */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-10, 5, 5]} intensity={1.5} color="#00C4AD" />
        <pointLight position={[0, -5, 5]} intensity={1.5} color="#F0356A" />
        
        <FloatingParticles />
        <KeyboardModel position={[0, 0.3, 0]} />
        <MouseModel position={[1.8, -0.4, 0.5]} />
        <HeadphoneModel position={[-1.8, 0.1, 0]} />
      </Suspense>
    </Canvas>
  );
}
