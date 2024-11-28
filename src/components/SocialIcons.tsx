import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import youtubeIcon from '../assets/social/yt_icon_rgb.png';
import instagramIcon from '../assets/social/Instagram_Glyph_Gradient.png';

interface SocialIconProps {
  position: [number, number, number];
  link: string;
  icon: string;
  baseScale?: number;
  moveStartTime: number;
}

const SocialIcon: React.FC<SocialIconProps> = ({ position, link, icon, baseScale = 0.15, moveStartTime }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  const glitchTimeRef = useRef(0);
  const isGlitchingRef = useRef(false);
  
  // Загружаем текстуру
  const texture = useTexture(icon);
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Вычисляем пропорции
  const aspectRatio = texture.image.width / texture.image.height;
  const width = baseScale;
  const height = baseScale / aspectRatio;
  
  // Создаем материалы с цветовой коррекцией
  const materials = useMemo(() => {
    const front = new THREE.MeshPhysicalMaterial({
      map: texture,
      transparent: true,
      opacity: 0.45,
      metalness: 0.2,
      roughness: 0.6,
      clearcoat: 0.2,
      clearcoatRoughness: 0.6,
      side: THREE.FrontSide,
    });

    const back = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.03,
      metalness: 0.2,
      roughness: 0.6,
      clearcoat: 0.2,
      clearcoatRoughness: 0.6,
      side: THREE.BackSide,
    });

    const side = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.03,
      metalness: 0.2,
      roughness: 0.6,
      clearcoat: 0.2,
      clearcoatRoughness: 0.6,
    });

    return { front, back, side };
  }, [texture]);

  // Плавная анимация
  useFrame(() => {
    if (groupRef.current) {
      const timeSinceMove = moveStartTime ? (Date.now() - moveStartTime) / 1000 : 0;
      
      // Проверяем время и устанавливаем прозрачность
      if (timeSinceMove < 35) {
        materials.front.opacity = 0;
        materials.back.opacity = 0;
        materials.side.opacity = 0;
      } else {
        // Плавное появление за 1 секунду
        const fadeProgress = Math.min((timeSinceMove - 35), 1);
        materials.front.opacity = 0.45 * fadeProgress;
        materials.back.opacity = 0.03 * fadeProgress;
        materials.side.opacity = 0.03 * fadeProgress;
      }

      // Анимация движения
      const time = Date.now() / 1000;
      const floatY = Math.sin(time * 0.5) * 0.01;
      groupRef.current.position.y = initialY + floatY;
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.01;
      groupRef.current.rotation.y = Math.cos(time * 0.4) * 0.01;
    }
  });

  const handleClick = () => {
    window.open(link, '_blank');
  };

  const handlePointerOver = () => {
    if (groupRef.current && meshRef.current) {
      document.body.style.cursor = 'pointer';
      groupRef.current.scale.set(1.05, 1.05, 1.05);
      materials.front.opacity = 0.6;
    }
  };

  const handlePointerOut = () => {
    if (groupRef.current && meshRef.current) {
      document.body.style.cursor = 'auto';
      groupRef.current.scale.set(1, 1, 1);
      materials.front.opacity = 0.45;
    }
  };

  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh ref={meshRef} position={[0, 0, 0.005]}>
        <planeGeometry args={[width, height]} />
        <primitive object={materials.front} />
      </mesh>

      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[width, height]} />
        <primitive object={materials.back} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.01]} />
        <primitive object={materials.side} />
      </mesh>

      <pointLight
        position={[0, 0, 0.1]}
        intensity={0.05}
        distance={0.3}
        color="#ffffff"
      />
    </group>
  );
};

interface SocialIconsComponentProps {
  moveStartTime: number;
}

export const SocialIcons: React.FC<SocialIconsComponentProps> = ({ moveStartTime }) => {
  return (
    <group position={[0, -1.2, -0.5]}>
      <SocialIcon
        position={[-0.15, 0, 0]}
        link="https://youtube.com/@telerave"
        icon={youtubeIcon}
        baseScale={0.12}
        moveStartTime={moveStartTime}
      />
      <SocialIcon
        position={[0.15, 0, 0]}
        link="https://www.instagram.com/teleraver"
        icon={instagramIcon}
        baseScale={0.09}
        moveStartTime={moveStartTime}
      />
    </group>
  );
}; 