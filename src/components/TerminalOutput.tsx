import React, { useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface TerminalOutputProps {
  moveStartTime: number;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ moveStartTime }) => {
  const text1Ref = useRef<any>();
  const text2Ref = useRef<any>();

  useFrame(() => {
    if (!moveStartTime || moveStartTime === 0) return;

    const timeSinceMove = (Date.now() - moveStartTime) / 1000;

    // Первый текст (2-6 секунда)
    let text1Opacity = 0;
    if (timeSinceMove >= 2 && timeSinceMove < 6) {
      if (timeSinceMove < 3) text1Opacity = timeSinceMove - 2;
      else if (timeSinceMove > 5) text1Opacity = 6 - timeSinceMove;
      else text1Opacity = 1;
    }

    // Второй текст (8-12 секунда)
    let text2Opacity = 0;
    if (timeSinceMove >= 8 && timeSinceMove < 12) {
      if (timeSinceMove < 9) text2Opacity = timeSinceMove - 8;
      else if (timeSinceMove > 11) text2Opacity = 12 - timeSinceMove;
      else text2Opacity = 1;
    }

    text1Opacity = Math.max(0, Math.min(1, text1Opacity));
    text2Opacity = Math.max(0, Math.min(1, text2Opacity));

    if (text1Ref.current) {
      text1Ref.current.material.opacity = text1Opacity;
    }
    if (text2Ref.current) {
      text2Ref.current.material.opacity = text2Opacity;
    }
  });

  return (
    <group position={[0, -1.0, -0.5]}>
      <Text
        ref={text1Ref}
        position={[0, 0, 0]}
        fontSize={0.04}
        color="#ffc600"
        anchorX="center"
        anchorY="middle"
        material-transparent
        material-opacity={0}
      >
        SONUS LIBERTAS VERITAS
      </Text>

      <Text
        ref={text2Ref}
        position={[0, -0.1, 0]}
        fontSize={0.04}
        color="#ffc600"
        anchorX="center"
        anchorY="middle"
        material-transparent
        material-opacity={0}
      >
        SOON
      </Text>
    </group>
  );
}; 