import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTimelineStore } from '../store/TimelineStore';

interface StyledProps {
  $show: boolean;
}

const Container = styled.div<StyledProps>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10px;
  z-index: 1000;
  opacity: ${(props: StyledProps) => (props.$show ? 1 : 0)};
  visibility: ${(props: StyledProps) => (props.$show ? 'visible' : 'hidden')};
  transition: opacity 6s cubic-bezier(0.4, 0.0, 0.2, 1), visibility 6s cubic-bezier(0.4, 0.0, 0.2, 1);
  will-change: opacity, visibility;
  pointer-events: none;
`;

const SocialIcons = styled.div<StyledProps>`
  position: relative;
  margin-top: auto;
  margin-bottom: 25px;
  display: flex;
  gap: 15px;
  opacity: ${(props: StyledProps) => (props.$show ? 1 : 0)};
  visibility: ${(props: StyledProps) => (props.$show ? 'visible' : 'hidden')};
  transition: opacity 6s cubic-bezier(0.4, 0.0, 0.2, 1), visibility 6s cubic-bezier(0.4, 0.0, 0.2, 1);
  will-change: opacity, visibility;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
`;

const glitchFlicker = keyframes`
  0% {
    opacity: 1;
    filter: brightness(1);
  }
  1% {
    opacity: 0.8;
    filter: brightness(0.8);
  }
  2% {
    opacity: 1;
    filter: brightness(1);
  }
  7% {
    opacity: 1;
    filter: brightness(1);
  }
  8% {
    opacity: 0.6;
    filter: brightness(0.6);
  }
  9% {
    opacity: 1;
    filter: brightness(1);
  }
  30% {
    opacity: 1;
    filter: brightness(1);
  }
  31% {
    opacity: 0.7;
    filter: brightness(0.7);
  }
  32% {
    opacity: 1;
    filter: brightness(1);
  }
  77% {
    opacity: 1;
    filter: brightness(1);
  }
  78% {
    opacity: 0.9;
    filter: brightness(0.9);
  }
  79% {
    opacity: 1;
    filter: brightness(1);
  }
  90% {
    opacity: 1;
    filter: brightness(1);
  }
  91% {
    opacity: 0.7;
    filter: brightness(0.7);
  }
  92% {
    opacity: 1;
    filter: brightness(1);
  }
`;

const rainbowFlicker = keyframes`
  0% {
    color: #ff0000;
    filter: brightness(1);
  }
  15% {
    color: #ff8800;
    filter: brightness(0.9);
  }
  30% {
    color: #ffff00;
    filter: brightness(1);
  }
  45% {
    color: #00ff00;
    filter: brightness(0.9);
  }
  60% {
    color: #00ffff;
    filter: brightness(1);
  }
  75% {
    color: #0000ff;
    filter: brightness(0.9);
  }
  90% {
    color: #ff00ff;
    filter: brightness(1);
  }
  100% {
    color: #ff0000;
    filter: brightness(0.9);
  }
`;

const glitchEffect = keyframes`
  0% {
    transform: translate(0);
    filter: brightness(1);
  }
  1% {
    transform: translate(-2px, 2px);
    filter: brightness(1.2);
  }
  2% {
    transform: translate(2px, -2px);
    filter: brightness(0.8);
  }
  3% {
    transform: translate(0);
    filter: brightness(1);
  }
  10% {
    transform: translate(0);
    filter: brightness(1);
  }
  12% {
    transform: translate(1px, -1px);
    filter: brightness(1.1);
  }
  13% {
    transform: translate(0);
    filter: brightness(1);
  }
  20% {
    transform: translate(0);
    filter: brightness(1);
  }
  21% {
    transform: translate(-1px, 1px);
    filter: brightness(0.9);
  }
  22% {
    transform: translate(0);
    filter: brightness(1);
  }
  30% {
    transform: translate(0);
    filter: brightness(1);
  }
  31% {
    transform: translate(2px);
    filter: brightness(1.2);
  }
  32% {
    transform: translate(0);
    filter: brightness(1);
  }
`;

const YouTubeLogo = () => (
  <svg width="27.72" height="19.06" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg width="16.5" height="16.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const SocialLink = styled.a`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "San Francisco", "Helvetica Neue", sans-serif;
  cursor: pointer;
  user-select: none;
  animation: ${rainbowFlicker} 8s infinite, ${glitchEffect} 4s infinite;
  will-change: transform, filter, color;
  transition: transform 0.2s ease-out;
  text-decoration: none;
  text-shadow: 0 0 5px currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 1001;

  svg {
    display: block;
    filter: drop-shadow(0 0 2px currentColor);
  }

  &:hover {
    transform: scale(1.15);
    animation-play-state: paused;
  }

  &:visited, &:link {
    color: inherit;
  }

  &:nth-child(3) {
    animation-delay: 2s, 1s;
  }
`;

const Separator = styled.span`
  color: #ffc600;
  opacity: 0.5;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "San Francisco", "Helvetica Neue", sans-serif;
  font-size: 16px;
  margin: 0 2.5px;
  text-transform: uppercase;
`;

const TextContainer = styled.div<StyledProps>`
  position: absolute;
  bottom: 110px;
  left: 0;
  right: 0;
  opacity: ${(props: StyledProps) => (props.$show ? 1 : 0)};
  visibility: ${(props: StyledProps) => (props.$show ? 'visible' : 'hidden')};
  transition: opacity 6s cubic-bezier(0.4, 0.0, 0.2, 1), visibility 6s cubic-bezier(0.4, 0.0, 0.2, 1);
  text-align: center;
  will-change: opacity, visibility;
`;

const Text = styled.h2`
  color: #ffc600;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "San Francisco", "Helvetica Neue", sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
  line-height: 1.2;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-transform: uppercase;
  opacity: 0.9;
  will-change: opacity;
`;

const SocialAndText: React.FC = () => {
  const [showSocial, setShowSocial] = useState<boolean | null>(null);
  const [showMainText, setShowMainText] = useState<boolean | null>(null);
  const [showSoonText, setShowSoonText] = useState<boolean | null>(null);

  const { moveStartTime, isAudioPlaying } = useTimelineStore();

  useEffect(() => {
    if (!moveStartTime || !isAudioPlaying) {
      setShowSocial(false);
      setShowMainText(false);
      setShowSoonText(false);
      return;
    }

    const timers = [
      { action: () => setShowSocial(true), delay: 35000 },
      { action: () => setShowMainText(true), delay: 15000 },
      { action: () => setShowMainText(false), delay: 21000 },
      { action: () => setShowSoonText(true), delay: 25000 },
      { action: () => setShowSoonText(false), delay: 30000 }
    ];

    const timeouts = timers.map(({ action, delay }) => {
      const timeSinceStart = Date.now() - moveStartTime;
      const adjustedDelay = Math.max(0, delay - timeSinceStart);
      return setTimeout(action, adjustedDelay);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [moveStartTime, isAudioPlaying]);

  if (showSocial === null || showMainText === null || showSoonText === null) {
    return null;
  }

  return (
    <Container $show={true}>
      <TextContainer $show={showMainText === true}>
        <Text>SONUS LIBERTAS</Text>
      </TextContainer>
      
      <TextContainer $show={showSoonText === true}>
        <Text>TEMPUS...</Text>
      </TextContainer>

      <SocialIcons $show={showSocial === true}>
        <SocialLink 
          href="https://www.youtube.com/@telerave"
          target="_blank"
          rel="noopener noreferrer"
        >
          <YouTubeLogo />
        </SocialLink>
        <Separator>|</Separator>
        <SocialLink 
          href="https://instagram.com/teleraver"
          target="_blank"
          rel="noopener noreferrer"
        >
          <InstagramLogo />
        </SocialLink>
      </SocialIcons>
    </Container>
  );
};

export default SocialAndText; 