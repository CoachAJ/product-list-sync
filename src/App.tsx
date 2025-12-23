import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { InputPhase } from './components/InputPhase';
import { ReviewPhase } from './components/ReviewPhase';
import { OutputPhase } from './components/OutputPhase';
import { initProductMatcher } from './utils/productMatcher';

function App() {
  const currentStep = useAppStore((state) => state.currentStep);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    initProductMatcher().then(() => setProductsLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-12">
        {currentStep === 'input' && <InputPhase />}
        {currentStep === 'review' && <ReviewPhase />}
        {currentStep === 'output' && <OutputPhase />}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Daily with Doc & Becca</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentStep === 'input'
                    ? 'bg-[#0068B3]'
                    : 'bg-gray-300'
                }`}
              />
              Input
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentStep === 'review'
                    ? 'bg-[#F58A34]'
                    : 'bg-gray-300'
                }`}
              />
              Review
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentStep === 'output'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
              Output
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
