export interface Product {
  name: string;
  sku: string;
  price: number;
  selected?: boolean;
  quantity?: number;
}

export interface CoachSession {
  coachName: string;
  clientName: string;
  userId: string;
}

export interface ResearchSource {
  id: number;
  content: string;
}

export interface SynthesisResult {
  article: string;
  detectedProducts: Product[];
}

export interface AppState {
  session: CoachSession;
  sources: ResearchSource[];
  synthesizedArticle: string;
  detectedProducts: Product[];
  isProcessing: boolean;
  currentStep: 'input' | 'review' | 'output';
  
  setSession: (session: Partial<CoachSession>) => void;
  setSource: (id: number, content: string) => void;
  addSource: () => void;
  removeSource: (id: number) => void;
  setSynthesizedArticle: (article: string) => void;
  setDetectedProducts: (products: Product[]) => void;
  toggleProductSelection: (sku: string) => void;
  setProductQuantity: (sku: string, quantity: number) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setCurrentStep: (step: 'input' | 'review' | 'output') => void;
  reset: () => void;
  clearAll: () => void;
}
