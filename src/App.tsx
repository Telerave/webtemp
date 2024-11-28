/**
 * Main application component for Telerave 2.0 landing page
 * Implements 3D effects and device motion interaction
 */
import React, { useRef, Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import AudioPlayer from './components/AudioPlayer';
import ParticleSystem from './components/ParticleSystem';
import { SocialIcons } from './components/SocialIcons';
import { TerminalOutput } from './components/TerminalOutput';

// Импортируем логотип
import logoBlackElements from './assets/logo-black-elements.png';

// В начале файла добавим хук для отслеживания движений
const useMouseRotation = (sensitivity = 0.008) => {
  const rotation = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousPosition = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousPosition.current.x;
    const deltaY = e.clientY - previousPosition.current.y;

    velocity.current = {
      x: deltaX * sensitivity,
      y: deltaY * sensitivity
    };

    targetRotation.current = {
      x: targetRotation.current.x - deltaY * sensitivity,
      y: targetRotation.current.y + deltaX * sensitivity
    };

    previousPosition.current = { x: e.clientX, y: e.clientY };
  }, [sensitivity]);

  // Обновляем обработчик нажатия
  const handlePointerDown = useCallback((e: PointerEvent) => {
    isDragging.current = true;
    previousPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerUp, handlePointerMove]);

  return { 
    current: rotation.current, 
    target: targetRotation.current,
    velocity: velocity.current,
    isDragging: isDragging.current
  };
};

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

// Добавим интерфейс для пропсов Logo
interface LogoProps {
  onFirstMove: (time: number) => void;
}

const Logo: React.FC<LogoProps> = ({ onFirstMove }) => {
  const meshRef = useRef<THREE.Group>(null);
  const objectPosition = useRef(new THREE.Vector3());
  const animationStartTimeRef = useRef(0);
  const isInitialAnimationComplete = useRef(true);
  const [isMovedBack, setIsMovedBack] = useState(false);
  const moveStartTimeRef = useRef(0);
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

  const mouseRotation = useMouseRotation(0.008);
  const autoRotationRef = useRef({ x: 0, y: 0 });
  const lastRotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  
  // Добавим ref для хранения инерции
  const inertia = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  
  const touchStartTimeRef = useRef(0);
  const accelerationRef = useRef({ x: 0, y: 0 });
  
  const lastInteractionTime = useRef(Date.now());
  const isReturningToFront = useRef(false);
  const RETURN_DELAY = 3000; // 3 секунды без взаимодействия
  
  // Добавим новые константы после существующих
  const INERTIA_FACTOR = 0.015;
  const DAMPING_FACTOR = 0.992;
  const RETURN_SPEED = 0.98;
  const AUTO_ROTATION_SPEED = 0.00003;
  const BREATHING_SPEED = 0.2;

  // Добавим новые константы для живой анимации
  const LOOK_AROUND_STATES = {
    IDLE: 'idle',
    LOOKING: 'looking',
    PAUSED: 'paused'
  } as const;

  // Добавим новые refs в понент Logo
  const lookAroundState = useRef<typeof LOOK_AROUND_STATES[keyof typeof LOOK_AROUND_STATES]>(LOOK_AROUND_STATES.IDLE);
  const lookTarget = useRef({ x: 0, y: 0 });
  const nextLookTime = useRef(0);
  const lookDuration = useRef(0);
  const pauseDuration = useRef(0);

  // Добавим новый ref для отслеживания времени возврата
  const returnCompleteTime = useRef(0);
  const DELAY_BEFORE_LOOKING = 500; // 500мс = пол секунды

  const SHAKE_START_TIME = 26000; // 26 секунд
  const SHAKE_END_TIME = 33000; // 33 секунды
  const MAX_SHAKE_AMPLITUDE = 0.01;

  const LIGHT_START_TIME = 26000;
  const LIGHT_END_TIME = 33000;
  const MAX_LIGHT_INTENSITY = 4;

  const innerLightRef = useRef<THREE.PointLight>(null);

  // Добавим функцию генерации следующего случайного движения
  const generateNextLook = () => {
    // Случайные значения для поворота
    const maxRotation = 0.3;
    const minRotation = 0.05;
    
    // Генерируем случайные целевые углы
    const targetX = (Math.random() * 3 - 1) * maxRotation * 
                   (Math.random() > 0.7 ? 1 : 0.3); // Иногда делаем кивок
    const targetY = (Math.random() * 3 - 1) * maxRotation;
    
    // Случайная длительность движения (1-3 секунды)
    const duration = 1000 + Math.random() * 2000;
    
    // Случайная пауза после движения (0.5-2 секунды)
    const pause = 500 + Math.random() * 1500;
    
    return {
      target: { x: targetX, y: targetY },
      duration,
      pause
    };
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'grabbing';
    isDragging.current = true;
    touchStartTimeRef.current = Date.now();
    lastInteractionTime.current = Date.now(); // Обновляем время последнего взаимодействия
    isReturningToFront.current = false; // Прерываем возвращение при взаимодействии
    accelerationRef.current = { x: 0, y: 0 };

    if (!isMovedBack) {
      moveStartTimeRef.current = Date.now();
      setIsMovedBack(true);
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'grab';
    isDragging.current = false;
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    
    lastInteractionTime.current = Date.now(); // Обновляем время последнего взаимодействия
    isReturningToFront.current = false; // Прерываем возвращение при взаимодействии
    
    const timeSinceStart = Date.now() - touchStartTimeRef.current;
    
    // Еще быстрее разгон
    const accelerationDuration = 100; // уменьшили со 150 до 100мс
    const accelerationProgress = Math.min(timeSinceStart / accelerationDuration, 1);
    
    // Более резкий старт
    const easeInFactor = Math.pow(accelerationProgress, 2);
    
    // Значительно увеличили чувствительность
    const sensitivity = 0.004; // увеличили с 0.0025 до 0.004
    
    const movementX = (e.movementX || e.deltaX || 0) * sensitivity * easeInFactor;
    const movementY = (e.movementY || e.deltaY || 0) * sensitivity * easeInFactor;
    
    accelerationRef.current = {
      x: movementX,
      y: movementY
    };
    
    // Увеличили максимальную скорость вращения
    const maxRotation = 0.2; // увеличили с 0.15 до 0.2
    targetRotation.current.x += Math.max(Math.min(movementY, maxRotation), -maxRotation);
    targetRotation.current.y += Math.max(Math.min(movementX, maxRotation), -maxRotation);
  };

  // Обновим useFrame
  const clockRef = useRef<{ elapsedTime: number }>({ elapsedTime: 0 });

  useFrame(({ clock }) => {
    // Сохраняем текущее время в ref
    clockRef.current = clock;
    
    if (meshRef.current && innerLightRef.current) {
      const time = clock.getElapsedTime();
      const currentTime = Date.now();
      const timeSinceMove = currentTime - moveStartTimeRef.current;
      
      // Проверяем, нужно ли начать возвращение
      const timeSinceLastInteraction = currentTime - lastInteractionTime.current;
      if (timeSinceLastInteraction > RETURN_DELAY && !isReturningToFront.current) {
        isReturningToFront.current = true;
        lookAroundState.current = LOOK_AROUND_STATES.IDLE;
        returnCompleteTime.current = currentTime + DELAY_BEFORE_LOOKING;
        targetRotation.current = {
          x: inertia.current.x,
          y: inertia.current.y
        };
      }

      // Обновленная логика автовращения
      autoRotationRef.current.y += AUTO_ROTATION_SPEED;
      autoRotationRef.current.x = Math.sin(time * 0.3) * 0.003;

      // Логика живой анимации - теперь проверяем только время
      if (isReturningToFront.current && currentTime > returnCompleteTime.current) {
        if (lookAroundState.current === LOOK_AROUND_STATES.IDLE) {
          // Начинаем новое движение
          const nextLook = generateNextLook();
          lookTarget.current = nextLook.target;
          lookDuration.current = nextLook.duration;
          pauseDuration.current = nextLook.pause;
          nextLookTime.current = currentTime + lookDuration.current;
          lookAroundState.current = LOOK_AROUND_STATES.LOOKING;
        }
        
        else if (lookAroundState.current === LOOK_AROUND_STATES.LOOKING) {
          if (currentTime < nextLookTime.current) {
            // Плавное движение к цели
            const progress = 1 - ((nextLookTime.current - currentTime) / lookDuration.current);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            targetRotation.current = {
              x: lookTarget.current.x * easeProgress,
              y: lookTarget.current.y * easeProgress
            };
          } else {
            lookAroundState.current = LOOK_AROUND_STATES.PAUSED;
            nextLookTime.current = currentTime + pauseDuration.current;
          }
        }
        
        else if (lookAroundState.current === LOOK_AROUND_STATES.PAUSED) {
          if (currentTime > nextLookTime.current) {
            lookAroundState.current = LOOK_AROUND_STATES.IDLE;
            targetRotation.current = { x: 0, y: 0 };
          }
        }
      }
      // Если идет возвращение и время для осматривания еще не пришло
      else if (isReturningToFront.current) {
        targetRotation.current.x *= RETURN_SPEED;
        targetRotation.current.y *= RETURN_SPEED;
      }

      // Единая обработка инерции
      const smoothFactor = lookAroundState.current === LOOK_AROUND_STATES.LOOKING ? 0.03 : INERTIA_FACTOR;
      inertia.current.x += (targetRotation.current.x - inertia.current.x) * smoothFactor;
      inertia.current.y += (targetRotation.current.y - inertia.current.y) * smoothFactor;
      inertia.current.x *= DAMPING_FACTOR;
      inertia.current.y *= DAMPING_FACTOR;

      // Добавляем эффект дрожания
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      let shakeOffsetZ = 0;

      if (isMovedBack && timeSinceMove >= SHAKE_START_TIME && timeSinceMove <= SHAKE_END_TIME) {
        const shakeProgress = (timeSinceMove - SHAKE_START_TIME) / (SHAKE_END_TIME - SHAKE_START_TIME);
        const intensity = Math.pow(Math.sin(shakeProgress * Math.PI), 4);
        
        const shakeAmount = MAX_SHAKE_AMPLITUDE * intensity;
        const shakeSpeed = 120;
        shakeOffsetX = Math.sin(time * shakeSpeed) * shakeAmount;
        shakeOffsetY = Math.cos(time * shakeSpeed * 1.2) * shakeAmount;
        shakeOffsetZ = Math.sin(time * shakeSpeed * 0.8) * shakeAmount;

        // Применяем дрожание к позиции
        meshRef.current.position.x += shakeOffsetX;
        meshRef.current.position.y += shakeOffsetY;
        meshRef.current.position.z += shakeOffsetZ;

        // Уменьшили влияние на вращение еще больше
        meshRef.current.rotation.x += shakeOffsetX * 0.1; // Уменьшили с 0.2 до 0.1
        meshRef.current.rotation.y += shakeOffsetY * 0.1;
        meshRef.current.rotation.z += shakeOffsetZ * 0.1;
      }

      if (!isMovedBack) {
        // Базовое положение
        const baseRotationX = 0.2 + autoRotationRef.current.x;
        const baseRotationY = -0.3 + autoRotationRef.current.y;
        
        meshRef.current.rotation.x = baseRotationX + inertia.current.x + shakeOffsetX;
        meshRef.current.rotation.y = baseRotationY + inertia.current.y + shakeOffsetY;
        
        // Более плавная левитация
        const baseY = Math.sin(time * BREATHING_SPEED) * 0.08;
        const breathingY = Math.sin(time * (BREATHING_SPEED * 1.5)) * 0.02;
        meshRef.current.position.y = baseY + breathingY + shakeOffsetY;
        meshRef.current.position.x = shakeOffsetX;
        meshRef.current.position.z = shakeOffsetZ;
        
        // Плавное вращение по Z
        meshRef.current.rotation.z = Math.sin(time * BREATHING_SPEED) * 0.015;
      } else {
        const moveElapsedTime = (Date.now() - moveStartTimeRef.current) / 1000;
        const moveDuration = 4.5;
        const moveProgress = Math.min(moveElapsedTime / moveDuration, 1);
        
        // Более плавная функция easing
        const easeOutProgress = 1 - Math.pow(1 - moveProgress, 4);
        const targetZ = -3.5;
        
        // Уменьшенная и более плавная амплитуда отскока
        const bounce = Math.sin(moveProgress * Math.PI) * 0.03 * 
                      Math.pow(1 - moveProgress, 2.5);
        meshRef.current.position.z = targetZ * easeOutProgress + bounce + shakeOffsetZ;
        
        // Плавное вращение после отлёта
        meshRef.current.rotation.x = 0.2 + autoRotationRef.current.x + inertia.current.x + shakeOffsetX;
        meshRef.current.rotation.y = -0.3 + autoRotationRef.current.y + inertia.current.y + shakeOffsetY;
        
        // Более плавная левитация после отлёта
        const baseY = Math.sin(time * (BREATHING_SPEED * 0.5)) * 0.12;
        const breathingY = Math.sin(time * (BREATHING_SPEED * 0.75)) * 0.04;
        meshRef.current.position.y = baseY + breathingY + shakeOffsetY;
        
        // Плавное вращение по Z
        meshRef.current.rotation.z = Math.sin(time * (BREATHING_SPEED * 0.5)) * 0.025;
      }
      
      // Более плавная пульсация
      const basePulse = Math.sin(time * BREATHING_SPEED) * 0.01;
      const breathingPulse = Math.sin(time * (BREATHING_SPEED * 1.5)) * 0.005;
      const scale = 1 + basePulse + breathingPulse;
      meshRef.current.scale.setScalar(scale);

      // Обновляем позицию объекта для системы частиц
      objectPosition.current.set(
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z
      );

      // Управляем интенсивностью внутреннего света
      if (isMovedBack && timeSinceMove >= LIGHT_START_TIME && timeSinceMove <= LIGHT_END_TIME) {
        const lightProgress = (timeSinceMove - LIGHT_START_TIME) / (LIGHT_END_TIME - LIGHT_START_TIME);
        const intensity = Math.pow(Math.sin(lightProgress * Math.PI), 4);
        if (innerLightRef.current) {
          innerLightRef.current.intensity = MAX_LIGHT_INTENSITY * intensity;
        }
        
        // Уменьшили максимальную интенсивность вечения материала
        baseMaterial.emissiveIntensity = 0.1 + intensity * 0.5; // Уменьшили с 0.9 до 0.5
      } else {
        if (innerLightRef.current) {
          innerLightRef.current.intensity = 0;
        }
        baseMaterial.emissiveIntensity = 0.1;
      }
    }
  });

  useEffect(() => {
    if (isMovedBack && !moveStartTimeRef.current) {
      const currentTime = Date.now();
      moveStartTimeRef.current = currentTime;
      onFirstMove(currentTime);
    }
  }, [isMovedBack, onFirstMove]);

  return (
    <>
      <group 
        ref={meshRef}
        onPointerOver={() => { document.body.style.cursor = 'grab'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {/* Основной желтый суперэллипсоид */}
        <mesh geometry={geometry} material={baseMaterial} />
        
        {/* Добавляем внутренний вет */}
        <pointLight
          ref={innerLightRef}
          position={[0, 0, 0]}
          intensity={0}
          distance={2}
          color="#ffc600"
          decay={2}
        />
        
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
      <ParticleSystem 
        active={isMovedBack} 
        objectPosition={objectPosition.current}
        moveStartTime={moveStartTimeRef.current}
      />
    </>
  );
};

// Добавим интерфейсы для SocialIcons и TerminalOutput
interface SocialIconsProps {
  moveStartTime: number;
}

interface TerminalOutputProps {
  moveStartTime: number;
}

// Обновим компонент App с правильной типизацией
const App = () => {
  const [moveStartTime, setMoveStartTime] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  const handleFirstMove = (time: number) => {
    if (startTimeRef.current === 0) {
      // Используем Date.now() как в ParticleSystem
      const currentTime = Date.now();
      startTimeRef.current = currentTime;
      setMoveStartTime(currentTime);
      console.log('App: Initial moveStartTime set to', currentTime);
    }
  };

  return (
    <div className="app">
      <AudioPlayer />
      <Canvas
        camera={{ 
          position: [0, 0, 2],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <Logo onFirstMove={handleFirstMove} />
          <SocialIcons moveStartTime={startTimeRef.current} />
          <TerminalOutput moveStartTime={startTimeRef.current} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;