import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateCheckoutUrl, calculateTotal } from '../utils/urlGenerator';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Download,
  Link,
  FileText,
  Package,
  RefreshCw,
} from 'lucide-react';

export function OutputPhase() {
  const {
    session,
    synthesizedArticle,
    detectedProducts,
    setCurrentStep,
    reset,
  } = useAppStore();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const checkoutUrl = generateCheckoutUrl(session.userId, detectedProducts);
  const selectedProducts = detectedProducts.filter((p) => p.selected);
  const total = calculateTotal(detectedProducts);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyArticle = async () => {
    await navigator.clipboard.writeText(synthesizedArticle);
    setCopiedArticle(true);
    setTimeout(() => setCopiedArticle(false), 2000);
  };

  const handleDownloadPdf = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: `Health-Report-${session.clientName.replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleNewReport = () => {
    reset();
    setCurrentStep('input');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setCurrentStep('review')}
        className="flex items-center gap-2 text-[#58595B] hover:text-[#0068B3] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Review
      </button>

      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Report Generated Successfully!</h2>
            <p className="text-green-100">
              Your personalized health report for {session.clientName} is ready.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout URL */}
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#F58A34]">
        <h3 className="text-lg font-bold text-[#F58A34] flex items-center gap-2 mb-4">
          <Link className="w-5 h-5" />
          Affiliate Checkout Link
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkoutUrl}
            readOnly
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
          />
          <button
            onClick={handleCopyUrl}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              copiedUrl
                ? 'bg-green-500 text-white'
                : 'bg-[#F58A34] text-white hover:bg-[#e07a2a]'
            }`}
          >
            {copiedUrl ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <p>
            <strong>Products:</strong> {selectedProducts.length} items •{' '}
            <strong>Total:</strong> ${total.toFixed(2)} •{' '}
            <strong>Sponsor ID:</strong> {session.userId}
          </p>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#0068B3]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0068B3] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Preview
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopyArticle}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition flex items-center gap-1 ${
                copiedArticle
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {copiedArticle ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Text
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-sm bg-[#0068B3] text-white rounded-lg font-medium hover:bg-[#005a9e] transition flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          ref={reportRef}
          className="bg-white p-8 border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto"
        >
          <div className="border-b-2 border-[#0068B3] pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-[#0068B3]">
                  Health Recommendations
                </h1>
                <p className="text-lg text-gray-600">for {session.clientName}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Prepared by {session.coachName}</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            {synthesizedArticle.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={i} className="text-xl font-bold text-[#0068B3] mt-6 mb-3">
                    {paragraph.replace('# ', '')}
                  </h1>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-lg font-bold text-[#58595B] mt-5 mb-2">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-base font-semibold text-[#58595B] mt-4 mb-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <li key={i} className="ml-4 text-gray-700">
                    {paragraph.replace('- ', '')}
                  </li>
                );
              }
              if (paragraph.trim()) {
                return (
                  <p key={i} className="text-gray-700 mb-3">
                    {paragraph}
                  </p>
                );
              }
              return null;
            })}
          </div>

          {/* Product Recommendations */}
          {selectedProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-[#F58A34]">
              <h2 className="text-lg font-bold text-[#F58A34] flex items-center gap-2 mb-4">
                <Package className="w-5 h-5" />
                Recommended Products
              </h2>
              <div className="grid gap-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.sku}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0068B3]">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {product.quantity || 1}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-[#0068B3]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>
              This report was prepared by {session.coachName} using the Daily with
              Doc & Becca Content Synthesizer
            </p>
          </div>
        </div>
      </div>

      {/* New Report Button */}
      <div className="flex justify-center">
        <button
          onClick={handleNewReport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0068B3] to-[#3CAADF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Create New Report
        </button>
      </div>
    </div>
  );
}
