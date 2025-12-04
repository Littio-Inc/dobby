import { azkabanApi } from '../../../stores/common/api-client';

// Endpoints de Azkaban (migrados desde Diagon)
const AZKABAN_ENDPOINTS = {
  GET_ACCOUNTS: '/v1/vault/accounts',
  REFRESH_BALANCE: '/v1/vault/accounts', // Base path para /v1/vault/accounts/{accountId}/{asset}/balance
} as const;

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

/**
 * Servicio para consultar saldos de cuentas Fireblocks
 * Migrado de Diagon a Azkaban. Ahora usa azkabanApi.
 * Las interfaces y respuestas se mantienen iguales para no romper el código existente.
 */
export class AzkabanService {
  static async getAccountsWithAssets(): Promise<DiagonAccountResponse[]> {
    try {
      const response = await azkabanApi.get<DiagonAccountResponse[]>(AZKABAN_ENDPOINTS.GET_ACCOUNTS);

      if (!Array.isArray(response.data)) {
        console.warn('[AzkabanService] Unexpected response format:', response.data);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error fetching accounts with assets:', error);
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
            `[AzkabanService] Rate limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`,
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
      await azkabanApi.post(`${AZKABAN_ENDPOINTS.REFRESH_BALANCE}/${accountId}/${asset}/balance`);
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
            console.warn(`[AzkabanService] Error processing item:`, error);
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
      console.log('[AzkabanService] Starting refreshAllBalances...');
      const startTime = Date.now();
      const accounts = await this.getAccountsWithAssets();
      const refreshItems: Array<{ accountId: string; accountName: string; assetId: string }> = [];

      for (const account of accounts) {
        for (const asset of account.assets) {
          refreshItems.push({
            accountId: account.id,
            accountName: account.name,
            assetId: asset.id,
          });
        }
      }

      console.log(
        `[AzkabanService] Total: ${accounts.length} accounts, ${refreshItems.length} assets to refresh`,
      );
      console.log(`[AzkabanService] Processing in batches of 5 with 500ms delay between batches`);

      await this.processBatch(
        refreshItems,
        5,
        async (item) => {
          console.log(
            `[AzkabanService] Refreshing balance for account ${item.accountId} (${item.accountName}), assetId ${item.assetId}`,
          );
          await this.refreshAccountBalance(item.accountId, item.assetId);
        },
        500,
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `[AzkabanService] Completed refreshing all balances in ${duration}s (${refreshItems.length} assets)`,
      );
    } catch (error) {
      console.error('[AzkabanService] Error refreshing all balances:', error);
      throw error;
    }
  }
}

