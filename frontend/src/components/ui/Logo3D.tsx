'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

function RotatingLogo() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#00E08F"
          distort={0.4}
          speed={2}
          roughness={0}
          emissive={new THREE.Color("#00E08F")}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

export function Logo3D({ className }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RotatingLogo />
      </Canvas>
    </div>
  );
}
