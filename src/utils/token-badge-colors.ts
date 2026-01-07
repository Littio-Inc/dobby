/**
 * Mapeo de colores para badges de tokens criptográficos
 */
export const TOKEN_BADGE_COLORS: Record<string, string> = {
  USDT: 'bg-green-100 text-green-800',
  USDC: 'bg-blue-100 text-blue-800',
  USD: 'bg-yellow-100 text-yellow-800',
  ETH: 'bg-purple-100 text-purple-800',
  'ETH-AETH': 'bg-purple-100 text-purple-800',
  DAI: 'bg-orange-100 text-orange-800',
  BTC: 'bg-yellow-100 text-yellow-800',
  POL: 'bg-indigo-100 text-indigo-800',
  MATIC: 'bg-indigo-100 text-indigo-800',
  COP: 'bg-emerald-100 text-emerald-800',
  COPM: 'bg-slate-200 text-slate-900',
  XDFIS: 'bg-cyan-100 text-cyan-900',
  EUROC: 'bg-blue-200 text-blue-900',
  XEVT: 'bg-violet-100 text-violet-900',
  EURC: 'bg-blue-200 text-blue-900',
  MXNT: 'bg-rose-100 text-rose-900',
  SOL: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  MONAD: 'bg-teal-100 text-teal-900',
  AVAX: 'bg-red-100 text-red-900',
  TUSD: 'bg-emerald-200 text-emerald-900',
  BASECHAIN: 'bg-sky-100 text-sky-900',
  WETH: 'bg-purple-200 text-purple-900',
  WMATIC: 'bg-indigo-200 text-indigo-900',
};

export function getTokenBadgeColor(symbol: string): string {
  const normalizedSymbol = symbol.trim().toUpperCase();
  // Color por defecto con mejor contraste
  return TOKEN_BADGE_COLORS[normalizedSymbol] || 'bg-neutral-200 text-neutral-900';
}
