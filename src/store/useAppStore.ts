import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, CoachSession } from '../types';

const initialSession: CoachSession = {
  coachName: '',
  clientName: '',
  userId: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: initialSession,
      sources: [
        { id: 1, content: '' },
        { id: 2, content: '' },
      ],
      synthesizedArticle: '',
      detectedProducts: [],
      isProcessing: false,
      currentStep: 'input',

      setSession: (sessionUpdate) =>
        set((state) => ({
          session: { ...state.session, ...sessionUpdate },
        })),

      setSource: (id, content) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, content } : s
          ),
        })),

      addSource: () =>
        set((state) => {
          if (state.sources.length >= 3) return state;
          const newId = Math.max(...state.sources.map((s) => s.id)) + 1;
          return {
            sources: [...state.sources, { id: newId, content: '' }],
          };
        }),

      removeSource: (id) =>
        set((state) => {
          if (state.sources.length <= 2) return state;
          return {
            sources: state.sources.filter((s) => s.id !== id),
          };
        }),

      setSynthesizedArticle: (article) => set({ synthesizedArticle: article }),

      setDetectedProducts: (products) =>
        set({
          detectedProducts: products.map((p) => ({
            ...p,
            selected: true,
            quantity: 1,
          })),
        }),

      toggleProductSelection: (sku) =>
        set((state) => ({
          detectedProducts: state.detectedProducts.map((p) =>
            p.sku === sku ? { ...p, selected: !p.selected } : p
          ),
        })),

      setProductQuantity: (sku, quantity) =>
        set((state) => ({
          detectedProducts: state.detectedProducts.map((p) =>
            p.sku === sku ? { ...p, quantity: Math.max(1, quantity) } : p
          ),
        })),

      setIsProcessing: (isProcessing) => set({ isProcessing }),

      setCurrentStep: (currentStep) => set({ currentStep }),

      reset: () =>
        set((state) => ({
          sources: [
            { id: 1, content: '' },
            { id: 2, content: '' },
          ],
          synthesizedArticle: '',
          detectedProducts: [],
          isProcessing: false,
          currentStep: 'input',
          session: {
            ...state.session,
            clientName: '',
          },
        })),

      clearAll: () =>
        set({
          sources: [
            { id: 1, content: '' },
            { id: 2, content: '' },
          ],
          synthesizedArticle: '',
          detectedProducts: [],
          isProcessing: false,
          currentStep: 'input',
          session: initialSession,
        }),
    }),
    {
      name: 'content-synthesizer-storage',
      partialize: (state) => ({
        session: {
          coachName: state.session.coachName,
          userId: state.session.userId,
        },
      }),
    }
  )
);
