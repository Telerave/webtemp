import { useEffect, useRef } from 'react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);
  const fadeInterval = useRef<number | null>(null);

  const fadeIn = (audio: HTMLAudioElement, duration: number) => {
    audio.volume = 0;
    const steps = 60; // 60 шагов в секунду
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

  useEffect(() => {
    const audioPath = process.env.PUBLIC_URL + '/audio/telerave-coming-soon.mp3';
    audioRef.current = new Audio(audioPath);
    audioRef.current.loop = true;

    const playAudio = async () => {
      if (!hasPlayedRef.current && audioRef.current) {
        try {
          await audioRef.current.play();
          fadeIn(audioRef.current, 3); // 3 секунды fade-in
          hasPlayedRef.current = true;
        } catch (error) {
          console.error('Ошибка воспроизведения аудио:', error);
          const altPath = './audio/telerave-coming-soon.mp3';
          audioRef.current = new Audio(altPath);
          try {
            await audioRef.current.play();
            fadeIn(audioRef.current, 3);
            hasPlayedRef.current = true;
          } catch (secondError) {
            console.error('Путь к файлу:', audioPath);
            console.error('Повторная ошибка воспроизведения:', secondError);
          }
        }
      }
    };

    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);
    window.addEventListener('keydown', playAudio);
    window.addEventListener('mousedown', playAudio);

    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
      window.removeEventListener('keydown', playAudio);
      window.removeEventListener('mousedown', playAudio);
      
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
};

export default AudioPlayer; 