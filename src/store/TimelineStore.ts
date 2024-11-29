import create from 'zustand';
import { SetState } from 'zustand';

interface TimelineState {
  moveStartTime: number;
  isAudioPlaying: boolean;
  hasInteracted: boolean;
  setMoveStartTime: (time: number) => void;
  setAudioPlaying: (playing: boolean) => void;
  setHasInteracted: (interacted: boolean) => void;
  resetTimeline: () => void;
}

export const useTimelineStore = create<TimelineState>((set: SetState<TimelineState>) => ({
  moveStartTime: 0,
  isAudioPlaying: false,
  hasInteracted: false,
  setMoveStartTime: (time: number) => {
    console.log('Setting moveStartTime:', time);
    set({ moveStartTime: time });
  },
  setAudioPlaying: (playing: boolean) => {
    console.log('Setting isAudioPlaying:', playing);
    set({ isAudioPlaying: playing });
  },
  setHasInteracted: (interacted: boolean) => set({ hasInteracted: interacted }),
  resetTimeline: () => set({ moveStartTime: 0, isAudioPlaying: false }),
})); 