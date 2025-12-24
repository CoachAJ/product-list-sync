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
    'tangy tangerine': ['USYG100075', 'USYG100076', 'USYG100077'],
    'beyond tangy tangerine': ['USYG100075', 'USYG100076', 'USYG100077'],
    'btt 2.0': ['USYG100076'],
    'osteo fx': ['USYG100050', 'USYG100051'],
    'osteo-fx': ['USYG100050', 'USYG100051'],
    'beyond osteo': ['USYG100050', 'USYG100051'],
    'plant derived minerals': ['USYG100040'],
    'efa plus': ['USYG100020'],
    'ultimate efa': ['USYG100020'],
    'ultimate enzymes': ['USYG100010'],
    'projoba omega': ['USPJ'],
    'root beer belly': ['USYG100080'],
    'slender fx': ['USSF'],
    'good herbs': ['USGH'],
    'synaptiv': ['USYG100090'],
    'imortalium': ['USYG100100'],
    'cell shield': ['USYG100110'],
    'gluco gel': ['USYG100120'],
    'sweet eze': ['USYG100130'],
    'healthy body start pak': ['USYG'],
    'healthy start pak': ['USYG'],
    'd-stress': ['USYG'],
    'killer biotic': ['USYG'],
    'ultimate selenium': ['USYG100030'],
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
