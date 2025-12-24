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
  // NOTE: Order matters - prefer single items over 4-packs, prefer 2.0/2.5/3.0 over Original
  const productKeywords: Record<string, string[]> = {
    // === HEALTHY BODY PAKS (hierarchy: 3.0 > 2.5 > 2.0 > Original) ===
    // Start Pak contains: BTT + Beyond Osteo-FX + Ultimate EFA Plus
    'healthy body start pak': ['10301', '10252Q', '10252', '10245'],
    'healthy start pak': ['10301', '10252Q', '10252', '10245'],
    'start pak': ['10301', '10252Q', '10252', '10245'],
    'start pack': ['10301', '10252Q', '10252', '10245'],
    'mighty 90': ['10301', '10252Q', '10252'],
    '90 essential': ['10301', '10252Q', '10252'],
    
    // Brain & Heart Pak contains: BTT + Beyond Osteo-FX + Ultimate EFA Plus + Ultimate EFA + Ultimate Selenium
    'healthy body brain and heart': ['10258', '10258Q', '10249'],
    'brain and heart pak': ['10258', '10258Q', '10249'],
    'brain and heart pack': ['10258', '10258Q', '10249'],
    
    // Bone & Joint Pak contains: BTT + Beyond Osteo-FX + Ultimate EFA Plus + Ultimate Gluco-Gel 240 + Ultimate CM Cream
    'healthy body bone and joint': ['10256', '10256Q', '10247'],
    'bone and joint pak': ['10256', '10256Q', '10247'],
    'bone and joint pack': ['10256', '10256Q', '10247'],
    'pig pack': ['10256', '10256Q', '10247'],
    
    // Blood Sugar Pak contains: BTT + Beyond Osteo-FX + Ultimate EFA Plus + Sweet Eze
    'healthy body blood sugar': ['10254', '10254Q', '10246'],
    'blood sugar pak': ['10254', '10254Q', '10246'],
    'blood sugar pack': ['10254', '10254Q', '10246'],
    
    // Digestion Pak
    'healthy body digestion': ['10257', '10257Q', '10248'],
    'digestion pak': ['10257', '10257Q', '10248'],
    'digestion pack': ['10257', '10257Q', '10248'],
    
    // Athletic Pak
    'healthy body athletic': ['10259', '10259Q', '10250'],
    'athletic pak': ['10259', '10259Q', '10250'],
    'athletic pack': ['10259', '10259Q', '10250'],
    
    // === CORE PRODUCTS (BTT, Osteo, Minerals) ===
    'beyond tangy tangerine': ['USYG100076', 'USYG100075', 'USYG100077'],
    'tangy tangerine': ['USYG100076', 'USYG100075', 'USYG100077'],
    'btt 2.5': ['USYG100076'],
    'btt 2.0': ['USYG100076'],
    'btt': ['USYG100076'],
    
    'beyond osteo-fx': ['USYG100050', 'USYG100051'],
    'beyond osteo fx': ['USYG100050', 'USYG100051'],
    'osteo-fx': ['USYG100050', 'USYG100051'],
    'osteo fx': ['USYG100050', 'USYG100051'],
    
    'plant derived minerals': ['13203'],
    'plant minerals': ['13203'],
    
    // === EFAs (Essential Fatty Acids) - prefer single over 4-pack ===
    'ultimate efa plus': ['20989'],
    'efa plus': ['20989'],
    'ultimate efa': ['20641', '21832'],  // Single 60ct first, then 180ct
    'ultimate efas': ['20641', '21832'],
    'efas': ['20641', '21832'],
    'essential fatty acids': ['20641', '21832'],
    'omega 3': ['20641', '21832'],
    'multi-efa': ['USYG102165'],
    
    // === DIGESTIVE & GUT HEALTH ===
    'ultimate enzymes': ['21211'],
    'gallbladder in a bottle': ['21211'],
    
    'fucoid z': ['3005'],
    'fucoidz': ['3005'],
    'fucoid': ['3005'],
    'z-radical': ['3235', '3207'],
    'zradical': ['3235', '3207'],
    
    'i26': ['USLL005030', 'USLL006014', 'USLL006011'],
    'i-26': ['USLL005030', 'USLL006014', 'USLL006011'],
    'hyper-immune egg': ['USLL005030', 'USLL006014'],
    'hyperimmune egg': ['USLL005030', 'USLL006014'],
    'immune factor': ['USLL005030', 'USLL006014'],
    
    'nightly essence': ['65002'],
    'nightly essense': ['65002'],
    'bioluminescence': ['65002'],
    
    'ultimate microbiome': ['USYG300004'],
    'microbiome': ['USYG300004'],
    
    'herbal rainforest': ['13205'],
    'rainforest': ['13205'],
    
    'liver cleanse': ['PJ415'],
    
    // === BLOOD SUGAR SUPPORT ===
    'sweet eze': ['21014'],
    'sweeteze': ['21014'],
    'sweet-eze': ['21014'],
    'chromium and vanadium': ['21014'],
    
    // === BONE & JOINT / CONNECTIVE TISSUE ===
    'gluco-gel': ['21252', '21251', '13216'],  // 240ct first, then 120ct
    'gluco gel': ['21252', '21251', '13216'],
    'glucogel': ['21252', '21251', '13216'],
    'glucosamine': ['21252', '21251'],
    
    'msm ultra': ['USFL000123'],
    'msm': ['USFL000123'],
    'ultimate msm': ['USFL000123'],
    
    'collagen peptides': ['USYG300005'],
    'collagen': ['USYG300005'],
    
    // CM Cream (included in Bone & Joint Pak)
    'cm cream': ['150203'],
    'ultimate cm cream': ['150203'],
    
    // Osteo-Mag (Magnesium)
    'osteo-mag': ['21210'],
    'osteomag': ['21210'],
    'magnesium': ['21210'],
    
    // === CARDIOVASCULAR & CIRCULATION ===
    'ultimate daily classic': ['USYG100084'],
    'daily classic': ['USYG100084'],
    
    'ultimate niacin plus': ['USYG102684'],
    'niacin plus': ['USYG102684'],
    'ultimate niacin': ['USYG102684'],
    
    // === BRAIN & NEUROLOGICAL ===
    'synaptiv': ['USYG100083'],
    'synaptive': ['USYG100083'],
    
    'ultimate d-stress': ['82123'],
    'd-stress': ['82123'],
    'dstress': ['82123'],
    
    // === ANTIOXIDANTS & CELLULAR ===
    'cell shield rtq': ['21203'],
    'cell shield': ['21203'],
    'resveratrol': ['21203'],
    
    'ultimate selenium': ['20971', '20671'],  // 90ct single first
    'selenium': ['20971', '20671'],
    
    'imortalium': ['USYG100100'],
    
    // === VITAMINS ===
    'vitamin d3': ['USYG100099', 'USYG100001'],
    'vitamin d': ['USYG100099', 'USYG100001'],
    'd3': ['USYG100099'],
    
    // === TOPICAL / PAIN RELIEF ===
    'trauma oil': ['67043'],
    'trauma': ['67043'],
    
    // === SPECIALTY PRODUCTS ===
    'colloidal silver': ['USYG100401'],
    'silver': ['USYG100401'],
    
    'oceans gold': ['67507'],
    'ocean\'s gold': ['67507'],
    'ultimate ocean': ['67507'],
    
    'ultimate vision fx': ['21202'],
    'vision fx': ['21202'],
    
    'as slim as possible': ['USYG239001'],
    'asap': ['USYG239001'],
    
    'tmr shake': ['USSN100001', 'USSN100000'],
    'total meal replacement': ['USSN100001', 'USSN100000'],
    
    'rebound fx': ['USYG100062', 'USYG100063'],
    'rebound': ['USYG100062'],
    
    'killer biotic': ['USYG3002'],
    
    'root beer belly': ['USYG100080'],
    
    'projoba omega': ['USPJ'],
    
    'good herbs': ['USGH'],
    'slender fx': ['USSF'],
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
