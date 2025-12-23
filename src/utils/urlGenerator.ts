import type { Product } from '../types';

export function generateCheckoutUrl(
  sponsorId: string,
  products: Product[]
): string {
  const selectedProducts = products.filter((p) => p.selected);
  
  if (!sponsorId || selectedProducts.length === 0) {
    return '';
  }

  const baseUrl = 'https://ygy1.com/customer-checkout/v1.3/';
  const params = new URLSearchParams();
  
  params.set('sponsorid', sponsorId);
  
  selectedProducts.forEach((product, index) => {
    const quantity = product.quantity || 1;
    params.set(`item-${index + 1}`, `${product.sku}|${quantity}`);
  });
  
  params.set('destroy', '1');
  params.set('ga_id', 'UA-20019232-44');
  params.set('redirect', 'http://dailywithdoc.com/thank-you');

  return `${baseUrl}?${params.toString()}`;
}

export function calculateTotal(products: Product[]): number {
  return products
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
}
