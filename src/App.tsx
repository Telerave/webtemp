/**
 * Main application component for Telerave 2.0 landing page
 * Implements 3D effects and device motion interaction
 */
import React, { useRef, Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import AudioPlayer from './components/AudioPlayer';
import ParticleSystem from './components/ParticleSystem';
import { useTimelineStore } from './store/TimelineStore';
import SocialAndText from './components/SocialAndText';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

// Заменяем импорт PNG на SVG
// import logoBlackElements from './assets/logo-black-elements.png';
import logoBlackElements from './assets/logo-black-elements.svg';

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

// В начале файла, после импортов
const cachedGeometry = createSuperEllipsoidGeometry(
    128,
    128,
    0.9,
    0.9,
    0.9,
    0.5,
    0.5
);

// Добавляем типы для iOS DeviceMotionEvent
interface DeviceMotionEventiOS extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface DeviceMotionEventiOSConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

// Добавляем интерфейс для гироскопа
interface GyroscopeData {
  x: number;
  y: number;
  z: number;
}

// Обновляем константы
const LOGO_CONSTANTS = {
  SCALE: 1.0, // Увеличили с 0.85 до 1.0
  VERTICAL_OFFSET: 0.25, // Смещение всего логотипа вверх
} as const;

// Обновляем функцию создания геометрии
const createLogoGeometry = (svgContent: string, glassesDepth: number, mouthDepth: number) => {
  const loader = new SVGLoader();
  const svgData = loader.parse(svgContent);
  const paths = svgData.paths;
  
  // Явно разделяем пути на очки (первые два пути) и рот (последний путь)
  const glassesShapes = paths.slice(0, 2).map(path => path.toShapes(true)).flat();
  const mouthShapes = paths[2].toShapes(true);
  
  // Создаем геометрию для очков с более выраженной огранкой
  const glassesGeometry = new THREE.ExtrudeGeometry(glassesShapes, {
    steps: 3, // Увеличили количество шагов
    depth: glassesDepth,
    bevelEnabled: true,
    bevelThickness: 0.03, // Увеличили толщину фаски
    bevelSize: 0.025,     // Немного увеличили размер фаски
    bevelOffset: 0,
    bevelSegments: 5      // Увеличили количество сегментов для более четкой огранки
  });
  
  // Создаем геометрию для рта с обработанными гранями
  const mouthGeometry = new THREE.ExtrudeGeometry(mouthShapes, {
    steps: 2,
    depth: mouthDepth,
    bevelEnabled: true,
    bevelThickness: 0.01, // Меньше чем у очков
    bevelSize: 0.01,      // Меньше чем у очков
    bevelOffset: 0,
    bevelSegments: 3
  });
  
  // Объединяем геометрии, сохраняя пропорции
  const geometry = mergeBufferGeometries([
    glassesGeometry,
    mouthGeometry
  ]);
  
  // Центрируем и масштабируем, сохраняя пропорции
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox!.getCenter(center);
  
  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);
  
  const scale = 1 / size.y;
  
  // Применяем преобразования с учетом констант
  geometry.translate(
    -center.x, 
    -center.y + size.y * LOGO_CONSTANTS.VERTICAL_OFFSET,
    0
  );
  geometry.scale(scale * LOGO_CONSTANTS.SCALE, -scale * LOGO_CONSTANTS.SCALE, 1);
  
  return geometry;
};

// Обновляем компонент Logo
const Logo = () => {
  const meshRef = useRef<THREE.Group>(null);
  const objectPosition = useRef(new THREE.Vector3());
  const animationStartTimeRef = useRef(0);
  const isInitialAnimationComplete = useRef(true);
  const [isMovedBack, setIsMovedBack] = useState(false);
  const moveStartTimeRef = useRef(0);
  const texture = useTexture(logoBlackElements);
  
  const materials = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return {
      base: new THREE.MeshPhysicalMaterial({
        color: '#ffc600',
        metalness: 0.4,
        roughness: 0.3,
        side: THREE.DoubleSide,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        emissive: '#ffc600',
        emissiveIntensity: 0.1
      }),
      logo: new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      })
    };
  }, [texture]);

  const geometry = useMemo(() => cachedGeometry, []);

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

  const LIGHT_START_TIME_2 = 59000;
  const LIGHT_END_TIME_2 = 65000;

  const innerLightRef = useRef<THREE.PointLight>(null);

  const setMoveStartTime = useTimelineStore(state => state.setMoveStartTime);

  // Добавляем ref для данных гироскопа
  const gyroData = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const isGyroAvailable = useRef(false);

  // Добавляем обработчик движения устройства
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!event.rotationRate) return;
      
      const sensitivity = 0.01;
      gyroData.current = {
        x: (event.rotationRate.beta || 0) * sensitivity,
        y: (event.rotationRate.gamma || 0) * sensitivity,
        z: (event.rotationRate.alpha || 0) * sensitivity
      };
      
      isGyroAvailable.current = true;
    };

    // Запрашиваем разрешение на использование гироскопа (для iOS)
    const requestGyroPermission = async () => {
      try {
        // Приводим к нашему типу
        const DeviceMotionEventIOS = DeviceMotionEvent as unknown as DeviceMotionEventiOSConstructor;
        
        if (typeof DeviceMotionEventIOS.requestPermission === 'function') {
          const permission = await DeviceMotionEventIOS.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        } else {
          // Для устройств, где не требуется разрешение
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      } catch (error) {
        console.error('Gyroscope not available:', error);
        // Для устройств, где не поддерживается запрос разрешения
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    };

    requestGyroPermission();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

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

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    
    lastInteractionTime.current = Date.now();
    isReturningToFront.current = false;
    
    const timeSinceStart = Date.now() - touchStartTimeRef.current;
    const accelerationDuration = 100;
    const accelerationProgress = Math.min(timeSinceStart / accelerationDuration, 1);
    const easeInFactor = Math.pow(accelerationProgress, 2);
    
    // Увеличенная чувствительность для тачскрина
    const sensitivity = e.pointerType === 'touch' ? 0.012 : 0.004;
    
    // Для тачскрина используем clientX/Y вместо deltaX/Y
    let movementX, movementY;
    
    if (e.pointerType === 'touch') {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      if (typeof touchStartTimeRef.current.lastX === 'number') {
        movementX = currentX - touchStartTimeRef.current.lastX;
        movementY = currentY - touchStartTimeRef.current.lastY;
      } else {
        movementX = 0;
        movementY = 0;
      }
      
      // Сохраняем текущие координаты для следующего кадра
      touchStartTimeRef.current.lastX = currentX;
      touchStartTimeRef.current.lastY = currentY;
    } else {
      movementX = e.movementX || 0;
      movementY = e.movementY || 0;
    }
    
    const finalMovementX = movementX * sensitivity * easeInFactor;
    const finalMovementY = movementY * sensitivity * easeInFactor;
    
    accelerationRef.current = {
      x: finalMovementX,
      y: finalMovementY
    };
    
    const maxRotation = 0.2;
    targetRotation.current.x += Math.max(Math.min(finalMovementY, maxRotation), -maxRotation);
    targetRotation.current.y += Math.max(Math.min(finalMovementX, maxRotation), -maxRotation);
  }, []);

  // Обновляем handlePointerDown для сохранения начальных координат касания
  const handlers = useMemo(() => ({
    handlePointerDown: (e: any) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'grabbing';
      isDragging.current = true;
      
      // Сохраняем начальные координаты касания
      touchStartTimeRef.current = {
        time: Date.now(),
        lastX: e.clientX,
        lastY: e.clientY
      };
      
      lastInteractionTime.current = Date.now();
      isReturningToFront.current = false;
      accelerationRef.current = { x: 0, y: 0 };

      if (!isMovedBack) {
        const currentTime = Date.now();
        moveStartTimeRef.current = currentTime;
        setMoveStartTime(currentTime);
        setIsMovedBack(true);
      }
    },
    handlePointerUp: (e: any) => {
      e.stopPropagation();
      document.body.style.cursor = 'grab';
      isDragging.current = false;
      // Очищаем сохраненные координаты
      if (touchStartTimeRef.current) {
        delete touchStartTimeRef.current.lastX;
        delete touchStartTimeRef.current.lastY;
      }
    },
    handlePointerMove
  }), [isMovedBack, setIsMovedBack, handlePointerMove, setMoveStartTime]);

  // Обновим useFrame
  useFrame(({ clock }) => {
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
        
        // Более павная левитация
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
        
        // Плавно вращение после отлёта
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

      // Обновляем позицию объекта дя системы частиц
      objectPosition.current.set(
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z
      );

      // Управляем интенсивностью внутреннего света
      if ((timeSinceMove >= LIGHT_START_TIME && timeSinceMove <= LIGHT_END_TIME) ||
          (timeSinceMove >= LIGHT_START_TIME_2 && timeSinceMove <= LIGHT_END_TIME_2)) {
        
        const lightProgress = timeSinceMove >= LIGHT_START_TIME_2
            ? (timeSinceMove - LIGHT_START_TIME_2) / (LIGHT_END_TIME_2 - LIGHT_START_TIME_2)
            : (timeSinceMove - LIGHT_START_TIME) / (LIGHT_END_TIME - LIGHT_START_TIME);
        
        const intensity = Math.pow(Math.sin(lightProgress * Math.PI), 4);
        if (innerLightRef.current) {
            innerLightRef.current.intensity = MAX_LIGHT_INTENSITY * intensity;
        }
        materials.base.emissiveIntensity = 0.1 + intensity * 0.5;
      } else {
        if (innerLightRef.current) {
          innerLightRef.current.intensity = 0;
        }
        materials.base.emissiveIntensity = 0.1;
      }

      // Добавляем влияние гироскопа на вращение
      if (isGyroAvailable.current && !isDragging.current) {
        if (!isMovedBack) {
          // Когда фигура на месте
          meshRef.current.rotation.x += gyroData.current.x;
          meshRef.current.rotation.y += gyroData.current.y;
          meshRef.current.rotation.z += gyroData.current.z * 0.5;
          
          // Добавляем небольшое смещение позиции
          meshRef.current.position.x += gyroData.current.y * 0.1;
          meshRef.current.position.y -= gyroData.current.x * 0.1;
        } else {
          // Когда фигура отлетела
          meshRef.current.rotation.x += gyroData.current.x * 0.5;
          meshRef.current.rotation.y += gyroData.current.y * 0.5;
          meshRef.current.rotation.z += gyroData.current.z * 0.3;
          
          // Меньшее влияние на позицию после отлета
          meshRef.current.position.x += gyroData.current.y * 0.05;
          meshRef.current.position.y -= gyroData.current.x * 0.05;
        }
      }
    }
  });

  // В начале файла, после импортов
  const svgContent = `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
   "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
   width="3189.000000pt" height="3189.000000pt" viewBox="0 0 3189.000000 3189.000000"
   preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0.000000,3189.000000) scale(0.100000,-0.100000)"
  fill="#000000" stroke="none">
  <path d="M3560 15940 l0 -2660 5315 0 5315 0 0 2660 0 2660 -5315 0 -5315 0 0
  -2660z"/>
  <path d="M17690 15940 l0 -2660 5315 0 5315 0 0 2660 0 2660 -5315 0 -5315 0
  0 -2660z"/>
  <path d="M20150 9684 c-130 -12 -346 -48 -463 -78 -932 -239 -1674 -981 -1913
  -1912 -60 -237 -78 -386 -78 -664 0 -278 18 -427 78 -664 188 -732 692 -1361
  1368 -1705 1028 -524 2272 -327 3088 489 404 405 662 917 751 1491 33 207 33
  571 0 778 -44 287 -120 529 -247 786 -383 781 -1128 1325 -1990 1455 -134 20
  -480 34 -594 24z"/>
  </g>
  </svg>`;

  const svgGeometry = useMemo(() => createLogoGeometry(
    svgContent,
    0.054, // толщина очков
    0.0054  // толщина рта
  ), []);

  const blackMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#000000',
      metalness: 0.95,         // Увеличили металличность
      roughness: 0.1,          // Уменьшили шероховатость
      transmission: 0.15,      // Немного уменьшили прозрачность
      thickness: 0.5,
      envMapIntensity: 2.0,    // Увеличили интенсивность отражений
      clearcoat: 1.0,
      clearcoatRoughness: 0.05, // Уменьшили шероховатость покрытия
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95            // Немного увеличили непрозрачность
    });
  }, []);

  return (
    <>
      <group 
        ref={meshRef}
        onPointerOver={() => { document.body.style.cursor = 'grab'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        onPointerDown={handlers.handlePointerDown}
        onPointerUp={handlers.handlePointerUp}
        onPointerMove={handlers.handlePointerMove}
      >
        {/* Основной желтый суперэллипсоид */}
        <mesh geometry={geometry} material={materials.base} />
        
        {/* Добавляем внутренний свет */}
        <pointLight
          ref={innerLightRef}
          position={[0, 0, 0]}
          intensity={0}
          distance={2}
          color="#ffc600"
          decay={2}
        />
        
        {/* Объемные черные элементы логотипа */}
        <group>
          {/* Передняя сторона */}
          <mesh 
            position={[0, 0, 0.91]}
            scale={[0.7, 0.7, 1]} // Уменьшаем с 0.8 до 0.7
            geometry={svgGeometry}
            material={blackMaterial}
          />
          
          {/* Задняя сторона */}
          <mesh 
            position={[0, 0, -0.91]}
            rotation={[0, Math.PI, 0]}
            scale={[0.7, 0.7, 1]} // Уменьшаем с 0.8 до 0.7
            geometry={svgGeometry}
            material={blackMaterial}
          />
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

const App = () => {
  return (
    <div className="app">
      <AudioPlayer />
      <SocialAndText />
      <Canvas
        camera={{ 
          position: [0, 0, 2.8],
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
        
        <ambientLight intensity={0.6} />
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
        <pointLight position={[3, 3, 3]} intensity={1.0} color="#ffffff" />
        <pointLight position={[-3, -3, -3]} intensity={0.8} color="#ffffff" />
        
        <Suspense fallback={null}>
          <Logo />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;