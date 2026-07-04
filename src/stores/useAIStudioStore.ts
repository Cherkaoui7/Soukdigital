import { create } from 'zustand'

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
  quality: string;
  seed: number | null;
  guidanceScale: number;
  steps: number;
  numImages: number;
}

interface AIStudioState {
  settings: GenerationSettings;
  updateSettings: (newSettings: Partial<GenerationSettings>) => void;
  isGenerating: boolean;
  setIsGenerating: (status: boolean) => void;
  currentTaskId: string | null;
  setCurrentTaskId: (id: string | null) => void;
  resultUrls: string[] | null;
  setResultUrls: (urls: string[] | null) => void;
}

const defaultSettings: GenerationSettings = {
  prompt: '',
  negativePrompt: '',
  style: 'Photorealistic',
  aspectRatio: '1:1',
  quality: 'HD',
  seed: null,
  guidanceScale: 7.5,
  steps: 30,
  numImages: 1,
}

export const useAIStudioStore = create<AIStudioState>((set) => ({
  settings: defaultSettings,
  updateSettings: (newSettings) => 
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  isGenerating: false,
  setIsGenerating: (status) => set({ isGenerating: status }),
  currentTaskId: null,
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  resultUrls: null,
  setResultUrls: (urls) => set({ resultUrls: urls }),
}))
