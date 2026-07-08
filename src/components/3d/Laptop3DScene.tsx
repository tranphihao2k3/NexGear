"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, PerspectiveCamera, ContactShadows, PresentationControls, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function LaptopModel() {
  const group = useRef<THREE.Group>(null);
  
  // Hiệu ứng xoay nhẹ tự nhiên khi không tương tác
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t / 4) * 0.2;
      group.current.position.y = Math.sin(t / 2) * 0.1;
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Bottom Base */}
      <group position={[0, -0.1, 0]}>
        <RoundedBox args={[4, 0.15, 2.8]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#2a2a35" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        {/* Trackpad */}
        <mesh position={[0, 0.08, 0.8]}>
          <planeGeometry args={[1.2, 0.8]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.8} />
        </mesh>
        {/* Keyboard area placeholder */}
        <mesh position={[0, 0.08, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.5, 1.4]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* RGB Underglow */}
        <pointLight position={[0, -0.2, 0]} color="#00C4AD" intensity={3} distance={5} />
      </group>

      {/* Screen Lid (Opened) */}
      <group position={[0, 0, -1.4]} rotation={[-Math.PI / 2.2, 0, 0]}>
        {/* Lid Back */}
        <RoundedBox args={[4, 2.8, 0.1]} radius={0.05} smoothness={4} position={[0, 1.4, 0]}>
          <meshStandardMaterial color="#2a2a35" metalness={0.9} roughness={0.1} />
        </RoundedBox>
        {/* Screen Content (The "Glow") */}
        <mesh position={[0, 1.4, 0.06]}>
          <planeGeometry args={[3.8, 2.6]} />
          <meshBasicMaterial color="#00C4AD" transparent opacity={0.15} />
        </mesh>
        {/* Store Logo on back */}
        <mesh position={[0, 1.4, -0.06]}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color="#00C4AD" />
        </mesh>
        <rectAreaLight
          width={4}
          height={2.8}
          intensity={10}
          color="#00C4AD"
          position={[0, 1.4, 0.1]}
          rotation={[0, Math.PI, 0]}
        />
      </group>
    </group>
  );
}

export default function Laptop3DScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        {/* Ánh sáng mạnh mẽ hơn */}
        <ambientLight intensity={1.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, 5, 10]} color="#00C4AD" intensity={2} />
        <pointLight position={[10, -5, 10]} color="#F0356A" intensity={1.5} />
        
        <PresentationControls
          global
          rotation={[0.3, 0.5, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <LaptopModel />
          </Float>
        </PresentationControls>

        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2.4} far={4.5} />
      </Suspense>
    </Canvas>
  );
}
