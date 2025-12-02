import { diagonApi } from '../../../stores/common/api-client';
import { getTokenBadgeColor } from '../../../utils/token-badge-colors';

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
    POLYGON: 'Polygon',
    AMOY: 'Polygon',
    BITCOIN: 'Bitcoin',
    BTC: 'Bitcoin',
  };

  let blockchain = 'Unknown';
  for (const [key, value] of Object.entries(blockchainMap)) {
    if (assetIdUpper.includes(key)) {
      blockchain = value;
      break;
    }
  }

  let token = parts[0].toUpperCase();

  if (token === 'BTC' || assetIdUpper.startsWith('BTC_')) {
    token = 'BTC';
    blockchain = 'Bitcoin';
    return { token, blockchain };
  }

  if (token === 'AMOY' || token === 'POLYGON') {
    let foundToken = false;
    for (const knownToken of knownTokens) {
      if (assetIdUpper.includes(`_${knownToken}_`) || assetIdUpper.startsWith(`${knownToken}_`)) {
        token = knownToken;
        foundToken = true;
        break;
      }
    }

    if (!foundToken && blockchain === 'Polygon') {
      token = 'POL';
    }
  }

  if (token === 'MATIC') {
    token = 'POL';
  }

  if (blockchain === 'Unknown' && token !== 'BTC') {
    blockchain = 'Ethereum';
  }

  return { token, blockchain };
};

const inferWalletType = (name: string): 'Vault' | 'OTC' | 'Proveedor' | 'Operativa' => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('vault') || nameLower.includes('treasury')) return 'Vault';
  if (nameLower.includes('otc') || nameLower.includes('trading')) return 'OTC';
  if (
    nameLower.includes('supra') ||
    nameLower.includes('cobre') ||
    nameLower.includes('kira') ||
    nameLower.includes('bridge') ||
    nameLower.includes('koywe')
  )
    return 'Proveedor';
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
      const response = await diagonApi.get<{ balance: number }>(`/v1/wallets/${walletId}/balances/${tokenSymbol}`);
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

    return Object.entries(tokenBalances)
      .map(([symbol, data]) => ({
        symbol,
        balance: data.total,
        change: 0,
        walletsCount: data.wallets.size,
        badgeColor: getTokenBadgeColor(symbol),
      }))
      .filter((token) => token.balance > 0)
      .sort((a, b) => b.balance - a.balance);
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

  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (error.response?.status === 429 && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.warn(
            `[DiagonService] Rate limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  static async refreshAccountBalance(accountId: string, asset: string): Promise<void> {
    return this.retryWithBackoff(async () => {
      await diagonApi.post(`/vault/accounts/${accountId}/${asset}/balance`);
    });
  }

  private static async processBatch<T>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<void>,
    delayBetweenBatches: number = 500,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map((item) =>
          processor(item).catch((error) => {
            console.warn(`[DiagonService] Error processing item:`, error);
          }),
        ),
      );

      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }
  }

  static async refreshAllBalances(): Promise<void> {
    try {
      const accounts = await this.getAccountsWithAssets();
      const refreshItems: Array<{ accountId: string; accountName: string; asset: string; assetId: string }> = [];
      const processedCombinations = new Set<string>();

      for (const account of accounts) {
        for (const asset of account.assets) {
          const { token } = parseAssetId(asset.id);
          const tokenSymbol = token.toUpperCase();

          const combinationKey = `${account.id}:${tokenSymbol}`;

          if (!processedCombinations.has(combinationKey)) {
            processedCombinations.add(combinationKey);
            refreshItems.push({
              accountId: account.id,
              accountName: account.name,
              asset: tokenSymbol,
              assetId: asset.id,
            });
          }
        }
      }

      console.log(
        `[DiagonService] Total: ${accounts.length} accounts, ${refreshItems.length} unique account/asset combinations to refresh`,
      );
      console.log(`[DiagonService] Processing in batches of 5 with 500ms delay between batches`);

      await this.processBatch(
        refreshItems,
        5,
        async (item) => {
          console.log(
            `[DiagonService] Refreshing balance for account ${item.accountId} (${item.accountName}), asset ${item.asset}`,
          );
          await this.refreshAccountBalance(item.accountId, item.asset);
        },
        500,
      );

      console.log(`[DiagonService] Completed refreshing all balances`);
    } catch (error) {
      console.error('[DiagonService] Error refreshing all balances:', error);
      throw error;
    }
  }
}
