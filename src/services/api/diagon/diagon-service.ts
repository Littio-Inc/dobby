import { diagonApi } from '../../../stores/common/api-client';

// Interfaces para la respuesta real de la API
export interface DiagonAsset {
  id: string;
  total: string;
  balance: string;
  lockedAmount: string;
  available: string;
  pending: string;
  frozen: string;
  staked: string;
  blockHeight: string;
  blockHash?: string;
}

export interface DiagonAccountResponse {
  id: string;
  name: string;
  hiddenOnUI: boolean;
  autoFuel: boolean;
  assets: DiagonAsset[];
}

// Interface para el componente (formato transformado)
export interface DiagonWallet {
  id: string;
  name: string;
  type: 'Vault' | 'OTC' | 'Proveedor' | 'Operativa';
  blockchain: string;
  provider: string | null;
  balanceEth: number;
}

export interface DiagonTokenBalance {
  symbol: string;
  balance: number;
  change: number;
  walletsCount: number;
  badgeColor: string;
}

const parseAssetId = (assetId: string): { token: string; blockchain: string } => {
  const parts = assetId.split('_');
  const assetIdUpper = assetId.toUpperCase();
  
  const knownTokens = ['USDC', 'USDT', 'ETH', 'BTC', 'DAI', 'MATIC', 'POL', 'WBTC', 'WETH'];
  
  const blockchainMap: Record<string, string> = {
    'POLYGON': 'Polygon',
    'AMOY': 'Polygon',
    'BITCOIN': 'Bitcoin',
    'BTC': 'Bitcoin',
  };
  
  let blockchain = 'Unknown';
  for (const [key, value] of Object.entries(blockchainMap)) {
    if (assetIdUpper.includes(key)) {
      blockchain = value;
      break;
    }
  }
  
  // Detectar el token
  let token = parts[0].toUpperCase();
  
  // Si el token es BTC, la blockchain debe ser Bitcoin
  if (token === 'BTC' || assetIdUpper.startsWith('BTC_')) {
    token = 'BTC';
    blockchain = 'Bitcoin';
    return { token, blockchain };
  }
  
  // Si el primer elemento es AMOY o POLYGON, buscar el token real
  if (token === 'AMOY' || token === 'POLYGON') {
    // Buscar si hay un token conocido en el ID
    let foundToken = false;
    for (const knownToken of knownTokens) {
      if (assetIdUpper.includes(`_${knownToken}_`) || assetIdUpper.startsWith(`${knownToken}_`)) {
        token = knownToken;
        foundToken = true;
        break;
      }
    }
    
    // Si no encontramos otro token y es Polygon/AMOY, usar POL
    if (!foundToken && blockchain === 'Polygon') {
      token = 'POL';
    }
  }
  
  // Si el token es MATIC, normalizarlo a POL para consistencia
  if (token === 'MATIC') {
    token = 'POL';
  }
  
  // Si no se detectó blockchain pero el token es conocido, usar Ethereum por defecto (excepto BTC)
  if (blockchain === 'Unknown' && token !== 'BTC') {
    blockchain = 'Ethereum';
  }
  
  return { token, blockchain };
};

const inferWalletType = (name: string): 'Vault' | 'OTC' | 'Proveedor' | 'Operativa' => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('vault') || nameLower.includes('treasury')) return 'Vault';
  if (nameLower.includes('otc') || nameLower.includes('trading')) return 'OTC';
  if (nameLower.includes('supra') || nameLower.includes('cobre') || nameLower.includes('kira') || nameLower.includes('bridge') || nameLower.includes('koywe')) return 'Proveedor';
  return 'Operativa';
};

const extractProvider = (name: string): string | null => {
  const providers = ['Supra', 'Cobre', 'Kira', 'Bridge', 'Koywe'];
  for (const provider of providers) {
    if (name.toLowerCase().includes(provider.toLowerCase())) {
      return provider;
    }
  }
  return null;
};

const getEthBalance = (assets: DiagonAsset[]): number => {
  for (const asset of assets) {
    const { token } = parseAssetId(asset.id);
    if (token.toUpperCase() === 'ETH' || asset.id.includes('ETH')) {
      return parseFloat(asset.balance) || 0;
    }
  }
  return 0;
};

const getMainBlockchain = (assets: DiagonAsset[]): string => {
  if (assets.length === 0) return 'Ethereum';
  
  const blockchainCount: Record<string, number> = {};
  for (const asset of assets) {
    const { blockchain } = parseAssetId(asset.id);
    blockchainCount[blockchain] = (blockchainCount[blockchain] || 0) + 1;
  }
  
  return Object.entries(blockchainCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ethereum';
};

export interface DiagonBalancesResponse {
  tokens: DiagonTokenBalance[];
}

export class DiagonService {
  static async getWallets(): Promise<DiagonWallet[]> {
    try {
      const response = await diagonApi.get<DiagonAccountResponse[]>('/vault/accounts');
      
      if (!Array.isArray(response.data)) {
        console.warn('[DiagonService] Unexpected response format:', response.data);
        return [];
      }
      
      return response.data.map((account) => ({
        id: account.id,
        name: account.name,
        type: inferWalletType(account.name),
        blockchain: getMainBlockchain(account.assets),
        provider: extractProvider(account.name),
        balanceEth: getEthBalance(account.assets),
      }));
    } catch (error) {
      console.error('[DiagonService] Error fetching wallets:', error);
      throw error;
    }
  }

  static async getTokenBalances(): Promise<DiagonTokenBalance[]> {
    try {
      const response = await diagonApi.get<DiagonBalancesResponse>('/v1/balances');
      return response.data.tokens;
    } catch (error) {
      console.error('[DiagonService] Error fetching token balances:', error);
      throw error;
    }
  }

  static async getWalletById(walletId: string): Promise<DiagonWallet> {
    try {
      const response = await diagonApi.get<{ wallet: DiagonWallet }>(`/v1/wallets/${walletId}`);
      return response.data.wallet;
    } catch (error) {
      console.error('[DiagonService] Error fetching wallet by ID:', error);
      throw error;
    }
  }

  static async getWalletTokenBalance(walletId: string, tokenSymbol: string): Promise<number> {
    try {
      const response = await diagonApi.get<{ balance: number }>(
        `/v1/wallets/${walletId}/balances/${tokenSymbol}`,
      );
      return response.data.balance;
    } catch (error) {
      console.error('[DiagonService] Error fetching wallet token balance:', error);
      throw error;
    }
  }

  static async getAccountsWithAssets(): Promise<DiagonAccountResponse[]> {
    try {
      const response = await diagonApi.get<DiagonAccountResponse[]>('/vault/accounts');
      
      if (!Array.isArray(response.data)) {
        console.warn('[DiagonService] Unexpected response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('[DiagonService] Error fetching accounts with assets:', error);
      throw error;
    }
  }

  static calculateTokenBalancesFromAccounts(accounts: DiagonAccountResponse[]): DiagonTokenBalance[] {
    const tokenBalances: Record<string, { total: number; wallets: Set<string> }> = {};
    
    // Procesar todos los assets de todas las accounts
    for (const account of accounts) {
      for (const asset of account.assets) {
        const { token } = parseAssetId(asset.id);
        const tokenSymbol = token.toUpperCase();
        const balance = parseFloat(asset.balance) || 0;
        
        if (!tokenBalances[tokenSymbol]) {
          tokenBalances[tokenSymbol] = {
            total: 0,
            wallets: new Set(),
          };
        }
        
        tokenBalances[tokenSymbol].total += balance;
        tokenBalances[tokenSymbol].wallets.add(account.id);
      }
    }
    
    // Mapear a DiagonTokenBalance
    const badgeColors: Record<string, string> = {
      USDT: 'bg-green-100 text-green-700',
      USDC: 'bg-blue-100 text-blue-700',
      ETH: 'bg-purple-100 text-purple-700',
      DAI: 'bg-orange-100 text-orange-700',
      BTC: 'bg-yellow-100 text-yellow-700',
      POL: 'bg-indigo-100 text-indigo-700',
      MATIC: 'bg-indigo-100 text-indigo-700', // Por si acaso
    };
    
    return Object.entries(tokenBalances)
      .map(([symbol, data]) => ({
        symbol,
        balance: data.total,
        change: 0, // TODO: Calcular cambio cuando tengamos datos históricos
        walletsCount: data.wallets.size,
        badgeColor: badgeColors[symbol] || 'bg-neutral-100 text-neutral-700',
      }))
      .filter((token) => token.balance > 0) // Solo mostrar tokens con balance > 0
      .sort((a, b) => b.balance - a.balance); // Ordenar por balance descendente
  }

  static async refreshAllData(): Promise<{
    wallets: DiagonWallet[];
    tokenBalances: DiagonTokenBalance[];
  }> {
    try {
      const accounts = await this.getAccountsWithAssets();
      const wallets = accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: inferWalletType(account.name),
        blockchain: getMainBlockchain(account.assets),
        provider: extractProvider(account.name),
        balanceEth: getEthBalance(account.assets),
      }));
      
      const tokenBalances = this.calculateTokenBalancesFromAccounts(accounts);
      
      return { wallets, tokenBalances };
    } catch (error) {
      console.error('[DiagonService] Error refreshing all data:', error);
      throw error;
    }
  }
}

