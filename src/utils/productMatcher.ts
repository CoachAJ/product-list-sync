import Fuse from 'fuse.js';
import { products, loadProducts } from '../data/products';
import type { Product } from '../types';

let fuse = new Fuse(products, {
  keys: ['name'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 3,
});

// Reinitialize Fuse when products are loaded
let initialized = false;
export async function initProductMatcher(): Promise<void> {
  if (initialized) return;
  await loadProducts();
  fuse = new Fuse(products, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 3,
  });
  initialized = true;
  console.log(`Product matcher initialized with ${products.length} products`);
}

// Words to exclude from matching - these cause false positives
const EXCLUDED_WORDS = [
  'oil', 'oils', 'essential oil', 'essential oils',
  'the', 'and', 'for', 'with', 'your', 'this', 'that', 'from',
  'health', 'healthy', 'body', 'support', 'helps', 'help',
  'vitamin', 'vitamins', 'mineral', 'minerals', 'nutrient', 'nutrients',
  'supplement', 'supplements', 'product', 'products',
];

// Products containing these words should be excluded from auto-detection
const EXCLUDED_PRODUCT_PATTERNS = [
  /essential\s*oil/i,
  /fragrance/i,
  /aromatherapy/i,
];

export function findProductsInText(text: string): Product[] {
  const foundProducts: Map<string, Product> = new Map();
  const normalizedText = text.toLowerCase();

  // Filter products - exclude essential oils and aromatherapy products
  const eligibleProducts = products.filter(product => {
    const nameLower = product.name.toLowerCase();
    return !EXCLUDED_PRODUCT_PATTERNS.some(pattern => pattern.test(nameLower));
  });

  // Direct SKU matching (most reliable)
  eligibleProducts.forEach((product) => {
    if (normalizedText.includes(product.sku.toLowerCase())) {
      foundProducts.set(product.sku, product);
    }
  });

  // Exact full product name matching
  eligibleProducts.forEach((product) => {
    const productNameLower = product.name.toLowerCase()
      .replace(/[™®©]/g, '');
    if (normalizedText.includes(productNameLower)) {
      foundProducts.set(product.sku, product);
    }
  });

  // Specific keyword matching - only match known product keywords
  const productKeywords: Record<string, string[]> = {
    // Core products
    'tangy tangerine': ['USYG100076', 'USYG100075', 'USYG100077'],
    'beyond tangy tangerine': ['USYG100076', 'USYG100075', 'USYG100077'],
    'btt 2.0': ['USYG100076'],
    'btt': ['USYG100076'],
    'osteo fx': ['USYG100050', 'USYG100051'],
    'osteo-fx': ['USYG100050', 'USYG100051'],
    'beyond osteo': ['USYG100050', 'USYG100051'],
    'plant derived minerals': ['USYG100040'],
    
    // EFAs
    'efa plus': ['20989'],
    'ultimate efa': ['21832', '20641', '20989'],
    'efas': ['21832', '20641', '20989'],
    'essential fatty acids': ['21832', '20641', '20989'],
    'multi-efa': ['USYG102165'],
    
    // Digestive/Gut Health
    'ultimate enzymes': ['21211'],
    'fucoid': ['3005'],
    'fucoidz': ['3005'],
    'i26': ['USLL005030', 'USLL006014', 'USLL006011'],
    'hyperimmune egg': ['USLL005030', 'USLL006014'],
    'nightly essence': ['65002'],
    'nightly essense': ['65002'],
    
    // Blood Sugar
    'blood sugar pak': ['10254', '10254Q', '10246'],
    'healthy body blood sugar': ['10254', '10254Q', '10246'],
    'sweet eze': ['21014'],
    'sweeteze': ['21014'],
    
    // Bone & Joint
    'bone and joint pak': ['10256', '10256Q', '10247'],
    'healthy body bone and joint': ['10256', '10256Q', '10247'],
    'brain and heart pak': ['10258', '10258Q', '10249'],
    'healthy body brain and heart': ['10258', '10258Q', '10249'],
    'gluco-gel': ['21251', '21252', '13216'],
    'gluco gel': ['21251', '21252', '13216'],
    'glucogel': ['21251', '21252', '13216'],
    'msm': ['USFL000123'],
    'msm ultra': ['USFL000123'],
    
    // Collagen & Connective Tissue
    'collagen peptides': ['USYG300005'],
    'collagen': ['USYG300005'],
    
    // Other supplements
    'projoba omega': ['USPJ'],
    'root beer belly': ['USYG100080'],
    'slender fx': ['USSF'],
    'good herbs': ['USGH'],
    'synaptiv': ['USYG100090'],
    'imortalium': ['USYG100100'],
    'cell shield': ['USYG100110'],
    'healthy body start pak': ['10251', '10252'],
    'healthy start pak': ['10251', '10252'],
    'd-stress': ['USYG'],
    'killer biotic': ['USYG3002'],
    'ultimate selenium': ['USYG100030', '20671'],
    'selenium': ['20671'],
    'ultimate daily': ['USYG'],
    'rebound fx': ['USYG100062', 'USYG100063'],
  };

  for (const [keyword, skuPrefixes] of Object.entries(productKeywords)) {
    if (normalizedText.includes(keyword)) {
      // Find first matching product for each prefix
      for (const prefix of skuPrefixes) {
        const match = eligibleProducts.find(p => p.sku.startsWith(prefix));
        if (match) {
          foundProducts.set(match.sku, match);
          break; // Only add one product per keyword
        }
      }
    }
  }

  // Limited fuzzy search - only on likely product mentions (capitalized phrases)
  // This is much faster than searching all phrases
  const capitalizedPhrases = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}/g) || [];
  
  capitalizedPhrases.forEach((phrase) => {
    if (phrase.length < 8) return;
    if (EXCLUDED_WORDS.some(w => phrase.toLowerCase().includes(w))) return;
    
    const results = fuse.search(phrase, { limit: 1 });
    if (results.length > 0 && results[0].score && results[0].score < 0.25) {
      const product = results[0].item;
      // Double-check it's not an excluded product
      if (!EXCLUDED_PRODUCT_PATTERNS.some(p => p.test(product.name))) {
        foundProducts.set(product.sku, product);
      }
    }
  });

  return Array.from(foundProducts.values());
}

export function searchProducts(query: string): Product[] {
  if (!query || query.length < 2) return [];
  
  const results = fuse.search(query, { limit: 10 });
  return results.map((r) => r.item);
}

export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}
