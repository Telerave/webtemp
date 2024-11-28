import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParticleSystemProps {
  count?: number;
  active: boolean;
  objectPosition: THREE.Vector3;
  moveStartTime: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  count = 3000,
  active, 
  objectPosition,
  moveStartTime 
}) => {
  const particles = useRef<THREE.Points>(null);
  const positionsArray = useRef<Float32Array>();
  const velocitiesArray = useRef<Float32Array>();
  const colorsArray = useRef<Float32Array>();
  const startTime = useRef<number>(0);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const INITIAL_RESTRICTION_PERIOD = 10000;
  const FADE_IN_DURATION = 3000; // 3 секунды для появления
  const SHAKE_START_TIME = 26000; // 26 секунд от начала движения
  const SHAKE_END_TIME = 33000; // 33 секунд от начала движения
  const MAX_PARTICLE_OPACITY = 2.5; // Увеличили максимальную яркость
  const NORMAL_PARTICLE_OPACITY = 0.9; // Обычная яркость

  // Создаем частицы при первом рендере
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    positionsArray.current = new Float32Array(count * 3);
    velocitiesArray.current = new Float32Array(count * 3);
    colorsArray.current = new Float32Array(count * 3);
    startTime.current = Date.now();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positionsArray.current[i3] = (Math.random() - 0.5) * 12;
      positionsArray.current[i3 + 1] = (Math.random() - 0.5) * 12;
      positionsArray.current[i3 + 2] = -3.5 - Math.random() * 8;

      velocitiesArray.current[i3] = (Math.random() - 0.5) * 0.005;
      velocitiesArray.current[i3 + 1] = (Math.random() - 0.5) * 0.005;
      velocitiesArray.current[i3 + 2] = (Math.random() - 0.5) * 0.005;

      const brightness = 0.3 + Math.random() * 0.7;
      if (Math.random() > 0.3) {
        const color = new THREE.Color().setHSL(0, 0, brightness);
        colorsArray.current[i3] = color.r;
        colorsArray.current[i3 + 1] = color.g;
        colorsArray.current[i3 + 2] = color.b;
      } else {
        const hue = Math.random();
        const saturation = 0.3 + Math.random() * 0.7;
        const color = new THREE.Color().setHSL(hue, saturation, brightness);
        colorsArray.current[i3] = color.r;
        colorsArray.current[i3 + 1] = color.g;
        colorsArray.current[i3 + 2] = color.b;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positionsArray.current, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorsArray.current, 3));
    return geo;
  }, [count]);

  useFrame((state, delta) => {
    if (!particles.current || !positionsArray.current || !materialRef.current) return;

    const currentTime = Date.now();
    const timeSinceMove = currentTime - moveStartTime;
    const timeSinceStart = currentTime - startTime.current;

    // Управление яркостью частиц во время эффекта
    if (active) {
      let targetOpacity = NORMAL_PARTICLE_OPACITY;

      if (timeSinceMove >= SHAKE_START_TIME && timeSinceMove <= SHAKE_END_TIME) {
        const shakeProgress = (timeSinceMove - SHAKE_START_TIME) / (SHAKE_END_TIME - SHAKE_START_TIME);
        const intensityMultiplier = Math.pow(Math.sin(shakeProgress * Math.PI), 4); // Более плавное изменение
        targetOpacity = NORMAL_PARTICLE_OPACITY + (MAX_PARTICLE_OPACITY - NORMAL_PARTICLE_OPACITY) * intensityMultiplier;
        
        materialRef.current.size = 0.015 + 0.01 * intensityMultiplier;
      } else {
        materialRef.current.size = 0.015;
      }

      if (timeSinceStart < FADE_IN_DURATION) {
        const fadeProgress = timeSinceStart / FADE_IN_DURATION;
        materialRef.current.opacity = fadeProgress * NORMAL_PARTICLE_OPACITY;
      } else {
        materialRef.current.opacity += (targetOpacity - materialRef.current.opacity) * 0.1;
      }
    } else {
      materialRef.current.opacity = 0;
      return;
    }

    const positions = particles.current.geometry.attributes.position.array as Float32Array;
    const isInitialPeriod = timeSinceStart < INITIAL_RESTRICTION_PERIOD;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] += velocitiesArray.current![i3];
      positions[i3 + 1] += velocitiesArray.current![i3 + 1];
      positions[i3 + 2] += velocitiesArray.current![i3 + 2];

      if (positions[i3] < -6) positions[i3] = 6;
      if (positions[i3] > 6) positions[i3] = -6;
      if (positions[i3 + 1] < -6) positions[i3 + 1] = 6;
      if (positions[i3 + 1] > 6) positions[i3 + 1] = -6;
      if (positions[i3 + 2] < -11.5) positions[i3 + 2] = -3.5;
      if (positions[i3 + 2] > -2) positions[i3 + 2] = -11.5;

      const particlePos = new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      );

      const distanceToObject = particlePos.distanceTo(objectPosition);
      if (distanceToObject < 1.5) {
        const normal = particlePos.sub(objectPosition).normalize();
        const reflection = new THREE.Vector3(
          velocitiesArray.current![i3],
          velocitiesArray.current![i3 + 1],
          velocitiesArray.current![i3 + 2]
        ).reflect(normal);

        const zMultiplier = isInitialPeriod ? 2.0 : 1.2;
        velocitiesArray.current![i3] = reflection.x * 0.8;
        velocitiesArray.current![i3 + 1] = reflection.y * 0.8;
        velocitiesArray.current![i3 + 2] = reflection.z * zMultiplier;
      }
    }

    particles.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particles} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.015}
        vertexColors
        transparent
        opacity={0} // Начальная прозрачность
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

export default ParticleSystem; 