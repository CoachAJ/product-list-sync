import { useRef, useState, useEffect } from 'react';
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

  // Redirect to input if required data is missing (e.g., after page refresh)
  useEffect(() => {
    if (!synthesizedArticle || !session.clientName) {
      setCurrentStep('input');
    }
  }, [synthesizedArticle, session.clientName, setCurrentStep]);

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

  const handleDownloadPdf = () => {
    const element = reportRef.current;
    if (!element) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    const clientName = session.clientName || 'Report';
    const coachName = session.coachName || '';
    const date = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Health Report - ${clientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #333;
            line-height: 1.6;
          }
          .header { 
            border-bottom: 3px solid #0068B3; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
          }
          .header h1 { color: #0068B3; font-size: 28px; }
          .header .client { color: #666; font-size: 18px; margin-top: 5px; }
          .header .meta { text-align: right; color: #888; font-size: 14px; }
          .content h1 { color: #0068B3; font-size: 22px; margin: 25px 0 15px; }
          .content h2 { color: #58595B; font-size: 18px; margin: 20px 0 10px; }
          .content h3 { color: #58595B; font-size: 16px; margin: 15px 0 10px; }
          .content p { margin-bottom: 12px; }
          .content li { margin-left: 25px; margin-bottom: 8px; }
          .products { 
            margin-top: 40px; 
            padding-top: 25px; 
            border-top: 3px solid #F58A34; 
          }
          .products h2 { color: #F58A34; margin-bottom: 20px; }
          .product-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; 
            border-bottom: 1px solid #eee; 
          }
          .product-name { font-weight: 600; }
          .product-sku { color: #888; font-size: 12px; }
          .product-price { color: #0068B3; font-weight: 600; }
          .product-qty { color: #888; font-size: 12px; }
          .total { 
            display: flex; 
            justify-content: space-between; 
            padding-top: 15px; 
            font-size: 18px; 
            font-weight: bold; 
          }
          .total span:last-child { color: #0068B3; }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            text-align: center; 
            color: #999; 
            font-size: 12px; 
          }
          @media print {
            body { padding: 20px; }
            @page { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Health Recommendations</h1>
            <div class="client">for ${clientName}</div>
          </div>
          <div class="meta">
            <div>Prepared by ${coachName}</div>
            <div>${date}</div>
          </div>
        </div>
        <div class="content">
          ${synthesizedArticle.split('\n').map(line => {
            if (line.startsWith('# ')) return `<h1>${line.replace('# ', '')}</h1>`;
            if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
            if (line.startsWith('### ')) return `<h3>${line.replace('### ', '')}</h3>`;
            if (line.startsWith('- ')) return `<li>${line.replace('- ', '')}</li>`;
            if (line.trim()) return `<p>${line}</p>`;
            return '';
          }).join('')}
        </div>
        ${selectedProducts.length > 0 ? `
          <div class="products">
            <h2>Recommended Products</h2>
            ${selectedProducts.map(p => `
              <div class="product-item">
                <div>
                  <div class="product-name">${p.name}</div>
                  <div class="product-sku">SKU: ${p.sku}</div>
                </div>
                <div style="text-align: right;">
                  <div class="product-price">$${p.price.toFixed(2)}</div>
                  <div class="product-qty">Qty: ${p.quantity || 1}</div>
                </div>
              </div>
            `).join('')}
            <div class="total">
              <span>Total:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
        ` : ''}
        <div class="footer">
          This report was prepared by ${coachName} using the Daily with Doc & Becca Content Synthesizer
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
              className="px-3 py-1.5 text-sm bg-[#0068B3] text-white rounded-lg font-medium transition flex items-center gap-1 hover:bg-[#005a9e]"
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
