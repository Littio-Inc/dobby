/**
 * Mapeo de colores para badges de tokens criptográficos
 */
export const TOKEN_BADGE_COLORS: Record<string, string> = {
  USDT: 'bg-green-100 text-green-700',
  USDC: 'bg-blue-100 text-blue-700',
  ETH: 'bg-purple-100 text-purple-700',
  DAI: 'bg-orange-100 text-orange-700',
  BTC: 'bg-yellow-100 text-yellow-700',
  POL: 'bg-indigo-100 text-indigo-700',
  MATIC: 'bg-indigo-100 text-indigo-700',
};

/**
 * Obtiene el color del badge para un símbolo de token dado
 * @param symbol - Símbolo del token (ej: 'USDT', 'ETH')
 * @returns Clases CSS para el badge o un color por defecto
 */
export function getTokenBadgeColor(symbol: string): string {
  return TOKEN_BADGE_COLORS[symbol] || 'bg-neutral-100 text-neutral-700';
}

