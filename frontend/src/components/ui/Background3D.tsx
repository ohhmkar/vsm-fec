'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as random from 'maath/random';
import * as THREE from 'three';

function MarketNetwork(props: any) {
  const ref = useRef<any>(null!);
  const count = 2000;
  
  // Generate points in a sphere shell
  const positions = useMemo(() => {
    return random.inSphere(new Float32Array(count * 3), { radius: 2.8 });
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      // Slow rotation for the network
      ref.current.rotation.x -= delta / 25;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#2E86DE" // Accent Blue
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

function ConnectingLines() {
  // A subtle grid or lines to suggest connectivity - purely decorative
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if(ref.current) {
         // Subtle sway
         ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
     <group ref={ref}>
        {/* Top Grid */}
        <gridHelper 
            args={[30, 30, 0x1E2330, 0x121620]} 
            position={[0, -4, 0]} 
            rotation={[0, 0, 0]} 
        />
     </group>
  )
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10 bg-[var(--bg-base)]">
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
            {/* Ambient light for subtle depth */}
            <ambientLight intensity={0.5} />
            <fog attach="fog" args={['#05050A', 3, 12]} />
            
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <MarketNetwork />
            </Float>
            
            <ConnectingLines />
        </Canvas>
    </div>
  );
}
