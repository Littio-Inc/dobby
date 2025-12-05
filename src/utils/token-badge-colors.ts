/**
 * Mapeo de colores para badges de tokens criptográficos
 */
export const TOKEN_BADGE_COLORS: Record<string, string> = {
  USDT: 'bg-green-100 text-green-700',
  USDC: 'bg-blue-100 text-blue-700',
  USD: 'bg-yellow-100 text-yellow-700',
  ETH: 'bg-purple-100 text-purple-700',
  DAI: 'bg-orange-100 text-orange-700',
  BTC: 'bg-yellow-100 text-yellow-700',
  POL: 'bg-indigo-100 text-indigo-700',
  MATIC: 'bg-indigo-100 text-indigo-700',
};

export function getTokenBadgeColor(symbol: string): string {
  const normalizedSymbol = symbol.trim().toUpperCase();
  return TOKEN_BADGE_COLORS[normalizedSymbol] || 'bg-neutral-100 text-neutral-700';
}
