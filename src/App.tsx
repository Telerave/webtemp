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
import logoBlackElements from './assets/logo-black-elements.png';

// Создаем свою параметрическую геометрию
const createSuperEllipsoidGeometry = (
  widthSegments: number = 128,
  heightSegments: number = 128,
  a: number = 1.0,
  b: number = 1.0,
  c: number = 1.0,
  n1: number = 0.7,
  n2: number = 0.7
) => {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  // Функция для вычисления точки на поверхности
  const calculatePoint = (u: number, v: number) => {
    const phi = v * Math.PI - Math.PI / 2;
    const theta = u * Math.PI * 2;

    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Улучшенная формула для суперэллипсоида
    const x = a * Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), n1) * 
              Math.sign(cosTheta) * Math.pow(Math.abs(cosTheta), n2);
    const y = b * Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), n1) * 
              Math.sign(sinTheta) * Math.pow(Math.abs(sinTheta), n2);
    const z = c * Math.sign(sinPhi) * Math.pow(Math.abs(sinPhi), n1);

    return new THREE.Vector3(x, y, z);
  };

  // Создаем вершины и UV-координаты
  for (let i = 0; i <= heightSegments; i++) {
    const v = i / heightSegments;
    
    for (let j = 0; j <= widthSegments; j++) {
      const u = j / widthSegments;
      
      const point = calculatePoint(u, v);
      vertices.push(point.x, point.y, point.z);

      // Улучшенное UV-маппирование
      uvs.push(u, 1 - v); // Инвертируем V для правильной ориентации текстуры
      
      // Вычисляем нормали аналитически
      const normal = point.normalize();
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  // Создаем индексы для треугольников с улучшенной топологией
  const indices: number[] = [];
  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;

      // Добавляем два треугольника
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Дополнительная оптимизация геометрии
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
};

// Компонент сетки точек
const Grid = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 50;
  const separation = 0.7;

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
        size={0.015}
        color="#4444ff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

// Обновляем компонент Logo
const Logo = () => {
  const meshRef = useRef<THREE.Group>(null);
  const animationStartTimeRef = useRef(0);
  const isInitialAnimationComplete = useRef(false);
  const texture = useTexture(logoBlackElements);
  
  // Настраиваем текстуру
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const geometry = createSuperEllipsoidGeometry(
    128,
    128,
    0.9,
    0.9,
    0.9,
    0.5,
    0.5
  );

  // Основной материал для суперэллипсоида
  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffc600',
    metalness: 0.4,
    roughness: 0.3,
    side: THREE.DoubleSide,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    emissive: '#ffc600',
    emissiveIntensity: 0.1
  });

  // Материал для логотипа
  const logoMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (animationStartTimeRef.current === 0) {
        animationStartTimeRef.current = clock.getElapsedTime();
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.y = 0;
        meshRef.current.rotation.z = 0;
      }

      const timeSinceStart = clock.getElapsedTime() - animationStartTimeRef.current;
      
      if (!isInitialAnimationComplete.current) {
        if (timeSinceStart <= 4) {
          // Основное покачивание головой
          meshRef.current.rotation.z = Math.sin(timeSinceStart * Math.PI) * 0.2;
          meshRef.current.rotation.y = timeSinceStart * 0.1;
          meshRef.current.rotation.x = Math.sin(timeSinceStart * 0.17) * 0.1;
        } else {
          isInitialAnimationComplete.current = true;
          // Сохраняем последние значения вращения для плавного перехода
          meshRef.current.userData.lastY = meshRef.current.rotation.y;
          meshRef.current.userData.lastZ = meshRef.current.rotation.z;
          meshRef.current.userData.lastX = meshRef.current.rotation.x;
          animationStartTimeRef.current = clock.getElapsedTime();
        }
      } else {
        const timeAfterInitial = clock.getElapsedTime() - animationStartTimeRef.current;
        const transitionDuration = 2; // Увеличили длительность перехода
        const transitionProgress = Math.min(timeAfterInitial / transitionDuration, 1);
        const easeProgress = 1 - Math.cos(transitionProgress * Math.PI * 0.5); // Плавная функция перехода
        
        // Целевые значения для конечной анимации
        const targetRotationX = timeAfterInitial * 0.1;
        const targetRotationY = meshRef.current.userData.lastY + timeAfterInitial * 0.15;
        
        // Плавный переход между анимациями
        meshRef.current.rotation.x = meshRef.current.userData.lastX * (1 - easeProgress) + targetRotationX * easeProgress;
        meshRef.current.rotation.y = targetRotationY;
        meshRef.current.rotation.z = meshRef.current.userData.lastZ * (1 - easeProgress);
        
        const scale = 1 + Math.sin(timeAfterInitial) * 0.03;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Основной желтый суперэллипсоид */}
      <mesh geometry={geometry} material={baseMaterial} />
      
      {/* Логотипы только на передней и задней гранях */}
      <group>
        {/* Передняя грань */}
        <mesh position={[0, 0, 0.902]} scale={[1.539, 1.539, 1]}>
          <planeGeometry />
          <primitive object={logoMaterial.clone()} />
        </mesh>

        {/* Задняя грань */}
        <mesh position={[0, 0, -0.902]} rotation={[0, Math.PI, 0]} scale={[1.539, 1.539, 1]}>
          <planeGeometry />
          <primitive object={logoMaterial.clone()} />
        </mesh>
      </group>

      {/* Освещение */}
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0.5, 0, 0]} intensity={0.8} color="#ffc600" />
      <pointLight position={[-0.5, 0, 0]} intensity={0.8} color="#ffc600" />
    </group>
  );
};

const App = () => {
  return (
    <div className="app">
      <Canvas
        camera={{ 
          position: [0, 0, 7],
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