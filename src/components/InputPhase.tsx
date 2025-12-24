import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { synthesizeContent, generateFallbackArticle, LLM_PROVIDERS } from '../services/aiService';
import { findProductsInText } from '../utils/productMatcher';
import { User, Users, Hash, FileText, Plus, Trash2, Loader2, Key, Cpu } from 'lucide-react';

export function InputPhase() {
  const {
    session,
    sources,
    setSession,
    setSource,
    addSource,
    removeSource,
    setSynthesizedArticle,
    setDetectedProducts,
    setIsProcessing,
    setCurrentStep,
    isProcessing,
  } = useAppStore();

  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('ai_api_key') || ''
  );
  const [selectedProvider, setSelectedProvider] = useState(() =>
    localStorage.getItem('selected_provider') || 'google'
  );
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem('selected_model') || 'gemini-2.0-flash-exp'
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProvider = LLM_PROVIDERS.find(p => p.id === selectedProvider) || LLM_PROVIDERS[0];
  const hasEnvKey = selectedProvider === 'google' 
    ? !!import.meta.env.VITE_GOOGLE_API_KEY 
    : !!import.meta.env.VITE_OPENROUTER_API_KEY;

  const canProcess =
    session.coachName.trim() &&
    session.clientName.trim() &&
    session.userId.trim() &&
    sources.some((s) => s.content.trim().length > 50) &&
    (apiKey.trim() || hasEnvKey);

  const handleProcess = async () => {
    if (!canProcess) return;

    setIsProcessing(true);
    setError(null);

    const sourceTexts = sources
      .map((s) => s.content.trim())
      .filter((s) => s.length > 0);

    let article: string;

    if (apiKey.trim()) {
      localStorage.setItem('ai_api_key', apiKey.trim());
    }
    localStorage.setItem('selected_provider', selectedProvider);
    localStorage.setItem('selected_model', selectedModel);

    const result = await synthesizeContent(
      {
        sources: sourceTexts,
        coachName: session.coachName,
        clientName: session.clientName,
      },
      apiKey.trim(),
      selectedModel,
      selectedProvider
    );

    if (result.error) {
      console.warn('AI synthesis failed:', result.error);
      setError(result.error);
      article = generateFallbackArticle(
        sourceTexts,
        session.coachName,
        session.clientName
      );
    } else {
      article = result.article;
    }

    // Find products mentioned in sources and synthesized article
    const allText = [...sourceTexts, article].join(' ');
    const detectedProducts = findProductsInText(allText);

    setSynthesizedArticle(article);
    setDetectedProducts(detectedProducts);
    setIsProcessing(false);
    setCurrentStep('review');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Session Info Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#0068B3]">
        <h2 className="text-xl font-bold text-[#0068B3] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Session Information
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Coach Name
            </label>
            <input
              type="text"
              value={session.coachName}
              onChange={(e) => setSession({ coachName: e.target.value })}
              placeholder="e.g., Coach AJ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Client Name
            </label>
            <input
              type="text"
              value={session.clientName}
              onChange={(e) => setSession({ clientName: e.target.value })}
              placeholder="e.g., Jane Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-1" />
              Distributor ID
            </label>
            <input
              type="text"
              value={session.userId}
              onChange={(e) => setSession({ userId: e.target.value })}
              placeholder="e.g., 101848575"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* AI Settings */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <details className="group" open={!hasEnvKey}>
            <summary className="cursor-pointer text-sm font-medium text-[#58595B] hover:text-[#0068B3] transition">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              {' '}AI Settings {hasEnvKey && <span className="text-green-600 text-xs">(API Key Configured ✓)</span>}
            </summary>
            <div className="mt-3 space-y-4">
              {/* Provider Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Cpu className="w-4 h-4 inline mr-1" />
                    AI Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      const newProvider = LLM_PROVIDERS.find(p => p.id === e.target.value);
                      if (newProvider) {
                        setSelectedModel(newProvider.models[0].id);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition text-sm"
                  >
                    {LLM_PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition text-sm"
                  >
                    {currentProvider.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {selectedProvider === 'google' 
                  ? 'Google AI offers free Gemini models. Get a key at aistudio.google.com'
                  : 'OpenRouter provides access to multiple AI providers. Free models available!'}
              </p>

              {/* API Key */}
              {!hasEnvKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Key className="w-4 h-4 inline mr-1" />
                    {selectedProvider === 'google' ? 'Google AI' : 'OpenRouter'} API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={selectedProvider === 'google' ? 'AIza...' : 'sk-or-...'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3CAADF] focus:border-transparent transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedProvider === 'google' ? (
                      <>
                        Get a free API key at{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3CAADF] hover:underline"
                        >
                          aistudio.google.com
                        </a>
                      </>
                    ) : (
                      <>
                        Get an API key at{' '}
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3CAADF] hover:underline"
                        >
                          openrouter.ai/keys
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Research Sources */}
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#F58A34]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F58A34] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Research Sources
          </h2>
          {sources.length < 3 && (
            <button
              onClick={addSource}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#F58A34] text-white rounded-lg hover:bg-[#e07a2a] transition"
            >
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          )}
        </div>

        <div className="space-y-4">
          {sources.map((source, index) => (
            <div key={source.id} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Source {index + 1}
                </label>
                {sources.length > 2 && (
                  <button
                    onClick={() => removeSource(source.id)}
                    className="text-red-500 hover:text-red-700 p-1 transition"
                    title="Remove source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <textarea
                value={source.content}
                onChange={(e) => setSource(source.id, e.target.value)}
                placeholder="Paste research article, transcript, or health content here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F58A34] focus:border-transparent transition resize-y"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {source.content.length} characters
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={handleProcess}
          disabled={!canProcess || isProcessing}
          className={`
            flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all
            ${
              canProcess && !isProcessing
                ? 'bg-gradient-to-r from-[#0068B3] to-[#3CAADF] text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Synthesize Content
            </>
          )}
        </button>
      </div>

      {!canProcess && (
        <p className="text-center text-sm text-gray-500">
          {!(apiKey.trim() || hasEnvKey) 
            ? 'Please enter an OpenRouter API key to continue'
            : 'Please fill in all session fields and add at least one research source (min 50 characters)'}
        </p>
      )}
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
