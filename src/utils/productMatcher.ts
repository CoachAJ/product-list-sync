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

  // Fuzzy name matching - search for each product name in the text
  products.forEach((product) => {
    const productNameLower = product.name.toLowerCase();
    // Check if product name or significant part appears in text
    if (normalizedText.includes(productNameLower)) {
      foundProducts.set(product.sku, product);
    }
  });

  // Extract potential product mentions using common patterns
  const words = text.split(/\s+/);
  const phrases: string[] = [];
  
  // Build 2-5 word phrases for fuzzy matching
  for (let i = 0; i < words.length; i++) {
    for (let len = 2; len <= 5 && i + len <= words.length; len++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }

  // Fuzzy search each phrase
  phrases.forEach((phrase) => {
    if (phrase.length < 5) return;
    const results = fuse.search(phrase);
    results.forEach((result) => {
      if (result.score && result.score < 0.3) {
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
