import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/TimelineStore';

// Добавляем типы для iOS DeviceMotionEvent
interface DeviceMotionEventiOS extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface DeviceMotionEventiOSConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);
  const fadeInterval = useRef<number | null>(null);
  const accelerometerThreshold = 10;
  
  const { 
    setAudioPlaying, 
    hasInteracted, 
    setHasInteracted,
    setMoveStartTime
  } = useTimelineStore();

  const fadeIn = (audio: HTMLAudioElement, duration: number) => {
    audio.volume = 0;
    const steps = 60;
    const volumeStep = 1 / (steps * duration);
    let currentVolume = 0;

    fadeInterval.current = window.setInterval(() => {
      currentVolume = Math.min(1, currentVolume + volumeStep);
      audio.volume = currentVolume;
      
      if (currentVolume >= 1) {
        if (fadeInterval.current) clearInterval(fadeInterval.current);
      }
    }, 1000 / steps);
  };

  const handleError = (error: Error) => {
    console.error('Ошибка воспроизведения аудио:', error);
    setAudioPlaying(false);
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    if (hasPlayedRef.current) return;

    const acceleration = event.acceleration;
    if (!acceleration) return;

    const totalAcceleration = Math.sqrt(
      Math.pow(acceleration.x || 0, 2) +
      Math.pow(acceleration.y || 0, 2) +
      Math.pow(acceleration.z || 0, 2)
    );

    if (totalAcceleration > accelerometerThreshold) {
      const currentTime = Date.now();
      setMoveStartTime(currentTime);
      playAudio();
    }
  };

  const playAudio = async () => {
    if (!hasPlayedRef.current && audioRef.current) {
      try {
        await audioRef.current.play();
        fadeIn(audioRef.current, 3);
        hasPlayedRef.current = true;
        setAudioPlaying(true);
        setHasInteracted(true);
        
        if (!hasPlayedRef.current) {
          const currentTime = Date.now();
          setMoveStartTime(currentTime);
        }
      } catch (error) {
        const altPath = './audio/telerave-coming-soon.mp3';
        audioRef.current = new Audio(altPath);
        try {
          await audioRef.current.play();
          fadeIn(audioRef.current, 3);
          hasPlayedRef.current = true;
          setAudioPlaying(true);
          setHasInteracted(true);
        } catch (secondError) {
          handleError(secondError as Error);
        }
      }
    }
  };

  useEffect(() => {
    const audioPath = process.env.PUBLIC_URL + '/audio/telerave-coming-soon.mp3';
    audioRef.current = new Audio(audioPath);
    audioRef.current.loop = true;

    // Запрашиваем разрешение на использование акселерометра
    const requestMotionPermission = async () => {
      try {
        // Приводим к нашему типу
        const DeviceMotionEventIOS = DeviceMotionEvent as unknown as DeviceMotionEventiOSConstructor;
        
        if (typeof DeviceMotionEventIOS.requestPermission === 'function') {
          const permissionState = await DeviceMotionEventIOS.requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        } else {
          // Для устройств, где не требуется разрешение
          window.addEventListener('devicemotion', handleMotion);
        }
      } catch (error) {
        console.error('Error requesting motion permission:', error);
        // Для устройств, где не поддерживается запрос разрешения
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestMotionPermission();

    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => window.addEventListener(event, playAudio));

    return () => {
      events.forEach(event => window.removeEventListener(event, playAudio));
      window.removeEventListener('devicemotion', handleMotion);
      if (fadeInterval.current) clearInterval(fadeInterval.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudioPlaying(false);
    };
  }, [setAudioPlaying, setHasInteracted]);

  return null;
};

export default AudioPlayer; 