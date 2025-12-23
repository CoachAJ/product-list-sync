import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateCheckoutUrl, calculateTotal } from '../utils/urlGenerator';
import { searchProducts } from '../utils/productMatcher';
import type { Product } from '../types';
import {
  FileText,
  Package,
  Check,
  Minus,
  Plus,
  Search,
  ArrowLeft,
  Link,
  Copy,
  CheckCircle,
} from 'lucide-react';

export function ReviewPhase() {
  const {
    session,
    synthesizedArticle,
    detectedProducts,
    setSynthesizedArticle,
    toggleProductSelection,
    setProductQuantity,
    setDetectedProducts,
    setCurrentStep,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [copied, setCopied] = useState<'article' | 'url' | null>(null);
  const [, setGeneratedUrl] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(searchProducts(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (!detectedProducts.find((p) => p.sku === product.sku)) {
      setDetectedProducts([
        ...detectedProducts,
        { ...product, selected: true, quantity: 1 },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleGenerateUrl = () => {
    const url = generateCheckoutUrl(session.userId, detectedProducts);
    setGeneratedUrl(url);
    setCurrentStep('output');
  };

  const handleCopyArticle = async () => {
    await navigator.clipboard.writeText(synthesizedArticle);
    setCopied('article');
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedCount = detectedProducts.filter((p) => p.selected).length;
  const total = calculateTotal(detectedProducts);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setCurrentStep('input')}
        className="flex items-center gap-2 text-[#58595B] hover:text-[#0068B3] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Input
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Synthesized Article */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#0068B3]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0068B3] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Synthesized Article
            </h2>
            <button
              onClick={handleCopyArticle}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {copied === 'article' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <textarea
            value={synthesizedArticle}
            onChange={(e) => setSynthesizedArticle(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0068B3] focus:border-transparent transition resize-y font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-2">
            You can edit the article above before generating the final output.
          </p>
        </div>

        {/* Detected Products */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#F58A34]">
          <h2 className="text-xl font-bold text-[#F58A34] flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" />
            Detected Products ({selectedCount} selected)
          </h2>

          {/* Product Search */}
          <div className="relative mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search to add more products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F58A34] focus:border-transparent transition"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.sku}
                    onClick={() => handleAddProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
                  >
                    <span className="text-sm">{product.name}</span>
                    <span className="text-xs text-gray-500">
                      ${product.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {detectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No products detected. Use the search above to add products.
              </p>
            ) : (
              detectedProducts.map((product) => (
                <div
                  key={product.sku}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                    product.selected
                      ? 'border-[#F58A34] bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleProductSelection(product.sku)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition ${
                      product.selected
                        ? 'bg-[#F58A34] text-white'
                        : 'bg-white border-2 border-gray-300'
                    }`}
                  >
                    {product.selected && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      SKU: {product.sku} • ${product.price.toFixed(2)}
                    </p>
                  </div>
                  {product.selected && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setProductQuantity(
                            product.sku,
                            (product.quantity || 1) - 1
                          )
                        }
                        className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {product.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          setProductQuantity(
                            product.sku,
                            (product.quantity || 1) + 1
                          )
                        }
                        className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {selectedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Estimated Total:</span>
                <span className="text-[#0068B3]">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleGenerateUrl}
          disabled={selectedCount === 0}
          className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all ${
            selectedCount > 0
              ? 'bg-gradient-to-r from-[#F58A34] to-[#FFB81C] text-white hover:shadow-xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Link className="w-5 h-5" />
          Generate Checkout Link
        </button>
      </div>
    </div>
  );
}
