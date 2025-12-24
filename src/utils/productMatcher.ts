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

export function findProductsInText(text: string): Product[] {
  const foundProducts: Map<string, Product> = new Map();
  const normalizedText = text.toLowerCase();

  // Direct SKU matching
  products.forEach((product) => {
    if (normalizedText.includes(product.sku.toLowerCase())) {
      foundProducts.set(product.sku, product);
    }
  });

  // Full product name matching
  products.forEach((product) => {
    const productNameLower = product.name.toLowerCase();
    if (normalizedText.includes(productNameLower)) {
      foundProducts.set(product.sku, product);
    }
  });

  // Partial name matching - check for key product name parts
  products.forEach((product) => {
    const nameParts = product.name.toLowerCase()
      .replace(/[™®©]/g, '')
      .split(/[\s\-–—]+/)
      .filter(part => part.length > 3);
    
    // If 2+ significant words from product name appear together in text, it's likely a match
    let matchCount = 0;
    for (const part of nameParts) {
      if (normalizedText.includes(part)) {
        matchCount++;
      }
    }
    // Match if at least 2 parts found, or 1 part for short names
    if ((nameParts.length <= 2 && matchCount >= 1) || matchCount >= 2) {
      // Verify it's not a false positive by checking for common words
      const commonWords = ['the', 'and', 'for', 'with', 'plus', 'pro', 'ultra', 'super', 'mega'];
      const significantParts = nameParts.filter(p => !commonWords.includes(p) && p.length > 4);
      if (significantParts.some(part => normalizedText.includes(part))) {
        foundProducts.set(product.sku, product);
      }
    }
  });

  // Common product keyword matching
  const productKeywords: Record<string, string[]> = {
    'tangy tangerine': ['USYG100075', 'USYG100076', 'USYG100077'],
    'btt': ['USYG100075', 'USYG100076'],
    'beyond tangy': ['USYG100075', 'USYG100076', 'USYG100077'],
    'osteo fx': ['USYG100050', 'USYG100051'],
    'osteo-fx': ['USYG100050', 'USYG100051'],
    'plant derived minerals': ['USYG100040'],
    'selenium': ['USYG100030'],
    'efa plus': ['USYG100020'],
    'essential fatty acids': ['USYG100020'],
    'ultimate enzymes': ['USYG100010'],
    'projoba': ['USPJ'],
    'rebound': ['USYG100062', 'USYG100063'],
    'root beer belly': ['USYG100080'],
    'slender fx': ['USSF'],
    'good herbs': ['USGH'],
    'synaptiv': ['USYG100090'],
    'imortalium': ['USYG100100'],
    'cell shield': ['USYG100110'],
    'gluco gel': ['USYG100120'],
    'sweet eze': ['USYG100130'],
  };

  for (const [keyword, skuPrefixes] of Object.entries(productKeywords)) {
    if (normalizedText.includes(keyword)) {
      // Find products matching these SKU prefixes
      products.forEach((product) => {
        for (const prefix of skuPrefixes) {
          if (product.sku.startsWith(prefix)) {
            foundProducts.set(product.sku, product);
          }
        }
      });
    }
  }

  // Extract potential product mentions using common patterns
  const words = text.split(/\s+/);
  const phrases: string[] = [];
  
  // Build 2-6 word phrases for fuzzy matching
  for (let i = 0; i < words.length; i++) {
    for (let len = 2; len <= 6 && i + len <= words.length; len++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }

  // Fuzzy search each phrase with more lenient threshold
  phrases.forEach((phrase) => {
    if (phrase.length < 5) return;
    const results = fuse.search(phrase);
    results.forEach((result) => {
      if (result.score && result.score < 0.4) {
        foundProducts.set(result.item.sku, result.item);
      }
    });
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
