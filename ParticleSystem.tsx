import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleShape, ParticleState } from '../types';
import { PARTICLE_COUNT } from '../constants';
import { generateGeometry } from '../utils/geometry';

interface ParticlesProps {
  shape: ParticleShape;
  color: string;
  particleState: ParticleState;
}

const Particles: React.FC<ParticlesProps> = ({ shape, color, particleState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate initial positions
  const positions = useMemo(() => generateGeometry(shape, PARTICLE_COUNT), [shape]);
  
  // Store original positions for morphing reference
  const originalPositions = useMemo(() => positions.slice(), [positions]);
  
  // Animation state
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    
    const { expansion, tension } = particleState;
    const geo = pointsRef.current.geometry;
    const posAttribute = geo.attributes.position;
    
    // Smooth transition target values could be added here, 
    // but we assume the parent component or Gemini gives us updates.
    
    // Dynamics parameters based on gesture
    // Expansion: Multiplies the distance from center
    // Tension: Adds jitter/noise and speed
    
    const expansionFactor = 1 + (expansion * 2.5); // 1x to 3.5x size
    const jitterAmount = tension * 0.2; // Vibration amount
    const rotationSpeed = 0.1 + (tension * 2.0); // Spin faster with tension
    
    // Rotate the whole group
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const ox = originalPositions[idx];
      const oy = originalPositions[idx+1];
      const oz = originalPositions[idx+2];
      
      // Calculate basic expansion
      let tx = ox * expansionFactor;
      let ty = oy * expansionFactor;
      let tz = oz * expansionFactor;

      // Add "breathing" or "alive" motion based on time
      const breathe = Math.sin(timeRef.current * 2 + i * 0.1) * 0.1;
      
      // Add tension jitter
      const jx = (Math.random() - 0.5) * jitterAmount * 5;
      const jy = (Math.random() - 0.5) * jitterAmount * 5;
      const jz = (Math.random() - 0.5) * jitterAmount * 5;

      // Special handling for Fireworks (explode outwards continuously if high tension)
      if (shape === ParticleShape.FIREWORKS) {
         if (tension > 0.5) {
             // Simulate explosion expansion
             const speed = 1 + tension;
             // We'll modify the "original" slightly to drift them out for a loop effect, 
             // but strictly modifying the current pos is easier for React state
             tx += (Math.random()-0.5) * speed;
             ty += (Math.random()-0.5) * speed;
             tz += (Math.random()-0.5) * speed;
         }
      }

      posAttribute.setXYZ(i, tx + jx, ty + jy + breathe, tz + jz);
    }
    
    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.05 + (particleState.tension * 0.05)} // Particles get bigger with tension
        color={color}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const Scene: React.FC<ParticlesProps> = (props) => {
  return (
    <div className="w-full h-full relative z-0">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Particles {...props} />
        <OrbitControls enableDamping autoRotate={false} />
      </Canvas>
    </div>
  );
};

export default Scene;
