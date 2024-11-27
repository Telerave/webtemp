/**
 * Main application component for Telerave 2.0 landing page
 * Implements 3D effects and device motion interaction
 */
import React, { useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import './App.css';

const Logo = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [springs, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const x = event.accelerationIncludingGravity?.x || 0;
      api.start({ scale: [1 + x * 0.01, 1 + x * 0.01, 1] });
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  return (
    <animated.mesh ref={meshRef} scale={springs.scale}>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial 
        map={new THREE.TextureLoader().load('/telerave-logo-mini.png')}
        emissive="#ffffff"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
      />
    </animated.mesh>
  );
};

const Background = () => {
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <mesh ref={gridRef} position={[0, 0, -5]}>
      <cylinderGeometry args={[10, 10, 20, 32]} />
      <meshStandardMaterial 
        color="#2a2a2a"
        wireframe
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      {loading ? (
        <div className="loading">Loading Telerave 2.0...</div>
      ) : (
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Background />
          <Logo />
        </Canvas>
      )}
    </div>
  );
}

export default App;
