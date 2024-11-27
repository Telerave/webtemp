/**
 * Main application component for Telerave 2.0 landing page
 * Implements 3D effects and device motion interaction
 */
import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Effects, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// Импортируем логотип
import logoUrl from './assets/telerave-logo-mini.png';

// Компонент сетки точек
const Grid = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 50;
  const separation = 0.5;

  const positions = new Float32Array(count * count * 3);
  let i = 0;
  for (let x = 0; x < count; x++) {
    for (let z = 0; z < count; z++) {
      positions[i] = x * separation - (count * separation) / 2;
      positions[i + 1] = 0;
      positions[i + 2] = z * separation - (count * separation) / 2;
      i += 3;
    }
  }

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      let i = 0;
      for (let x = 0; x < count; x++) {
        for (let z = 0; z < count; z++) {
          const y = Math.sin(clock.elapsedTime * 0.5 + x * 0.5 + z * 0.5) * 0.2;
          positions[i + 1] = y;
          i += 3;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#4444ff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

const Logo = () => {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(logoUrl);

  // Настраиваем текстуру для сохранения оригинальных цветов
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
      const scale = 1 + Math.sin(clock.getElapsedTime()) * 0.03;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Обновленный материал, который не перекрывает цвета текстуры
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    emissive: '#000000',        // Убрали цветное свечение
    emissiveIntensity: 0,       
    metalness: 0.4,             // Уменьшили металличность
    roughness: 0.2,             // Настроили шероховатость
    side: THREE.DoubleSide,
    clearcoat: 1.0,             // Максимальный глянец
    clearcoatRoughness: 0.1,    
    color: '#ffffff',           // Нейтральный белый цвет основы
    opacity: 1.0,
    envMapIntensity: 2.0,       // Усилили отражения
    ior: 1.5
  });

  return (
    <group ref={meshRef}>
      {/* Грани куба */}
      <mesh position={[0, 0, 1]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh position={[0, 0, -1]} rotation={[0, Math.PI, 0]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh position={[1, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh position={[-1, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>

      {/* Добавляем разноцветное внутреннее освещение */}
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#ffffff" />
      <pointLight position={[0.5, 0, 0]} intensity={1.0} color="#ffcc00" />
      <pointLight position={[-0.5, 0, 0]} intensity={1.0} color="#ff0000" />
    </group>
  );
};

const App = () => {
  return (
    <div className="app">
      <Canvas
        camera={{ 
          position: [3, 3, 5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,    // Отключили тонмаппинг для сохранения насыщенности
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Настроили освещение для лучшей видимости текстуры */}
        <ambientLight intensity={0.6} />
        
        {/* Направленный свет для подсветки текстуры */}
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={2.0}
          color="#ffffff"
        />
        <directionalLight 
          position={[-5, -5, -5]} 
          intensity={1.5}
          color="#ffffff"
        />
        
        {/* Дополнительные источники света для бликов */}
        <pointLight position={[3, 3, 3]} intensity={1.0} color="#ffffff" />
        <pointLight position={[-3, -3, -3]} intensity={0.8} color="#ffffff" />
        
        <Suspense fallback={null}>
          <Logo />
          <Grid />
        </Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={3 * Math.PI / 4}
        />
      </Canvas>
    </div>
  );
};

export default App;
