import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/three';
import './App.css';

// Logo component with glow and motion effects
const Logo = () => {
  const meshRef = useRef(null);
  const [springs, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  useEffect(() => {
    // Device motion handler for interactive effects
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
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
      />
    </animated.mesh>
  );
};

// Background grid imitating professional audio equipment
const Background = () => {
  const gridRef = useRef(null);

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

// Main App component
function App() {
  return (
    <div className="app">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Background />
        <Logo />
      </Canvas>
    </div>
  );
}

export default App;
