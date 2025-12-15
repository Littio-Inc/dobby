import { azkabanApi } from '../../../stores/common/api-client';
import { $user } from '../../../stores/auth-store';

const AZKABAN_ENDPOINTS = {
  GET_ACCOUNTS: '/v1/vault/accounts',
  REFRESH_BALANCE: '/v1/vault/accounts',
  GET_BACKOFFICE_TRANSACTIONS: '/v1/backoffice/transactions',
  GET_EXTERNAL_WALLETS: '/v1/vault/external-wallets',
  ESTIMATE_FEE: '/v1/vault/transactions/estimate-fee',
  CREATE_TRANSACTION: '/v1/vault/transactions/create-transaction',
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

export interface BackofficeTransaction {
  id: string;
  transaction_id: string;
  created_at: string;
  type: string;
  provider: string;
  fees: string;
  amount: string;
  currency: string;
  rate: string;
  category: string;
  method?: string;
  st_id: string | null;
  st_hash: string | null;
  user_id: string;
  user_id_to: string | null;
  user_id_from: string | null;
  transfer_id: string | null;
  idempotency_key: string;
  status?: string;
}

export interface BackofficeTransactionsResponse {
  transactions: BackofficeTransaction[];
  count: number;
  total_count: number;
  page: number;
  limit: number;
}

export interface GetBackofficeTransactionsParams {
  provider?: string;
  exclude_provider?: string;
  page?: number;
  limit?: number;
}

export interface CreateBackofficeTransactionParams {
  operationDate: string;
  operationTime?: string;
  movementType: 'transfer_in' | 'transfer_out' | 'payment' | 'withdrawal' | 'transfer';
  provider: string;
  amount: number;
  currency: string;
  externalTransactionId: string;
  destinationAccount: string;
  originAccount: string;
  notes?: string;
  method?: string;
  status?: string;
  originProvider?: string;
}

export interface ExternalWalletAsset {
  id: string;
  status: string;
  address: string;
  tag: string;
}

export interface ExternalWallet {
  id: string;
  name: string;
  assets: ExternalWalletAsset[];
}

export interface ExternalWalletsResponse {
  message: string;
  code: number;
  data: ExternalWallet[];
}

export interface EstimateFeeSource {
  type: 'VAULT_ACCOUNT';
  id: string;
}

export interface EstimateFeeDestination {
  type: 'EXTERNAL_WALLET' | 'VAULT_ACCOUNT';
  id: string;
}

export interface EstimateFeeRequest {
  operation: 'TRANSFER';
  source: EstimateFeeSource;
  destination: EstimateFeeDestination;
  assetId: string;
  amount: string;
}

export interface FeeOption {
  networkFee: string;
  gasPrice: string;
  gasLimit: string;
  baseFee: string;
  priorityFee: string;
  l1Fee: string;
  maxFeePerGasDelta: string;
}

export interface EstimateFeeResponse {
  low: FeeOption;
  medium: FeeOption;
  high: FeeOption;
}

export interface CreateTransactionRequest {
  network: string;
  service: 'BLOCKCHAIN_WITHDRAWAL';
  token: string;
  sourceVaultId: string;
  destinationWalletId?: string;
  destinationVaultId?: string;
  feeLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  amount: string;
}

export interface CreateTransactionResponse {
  id: string;
  status: string;
}

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

      console.log(`[AzkabanService] Total: ${accounts.length} accounts, ${refreshItems.length} assets to refresh`);
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
      console.log(`[AzkabanService] Completed refreshing all balances in ${duration}s (${refreshItems.length} assets)`);
    } catch (error) {
      console.error('[AzkabanService] Error refreshing all balances:', error);
      throw error;
    }
  }

  /**
   * Obtiene el listado de transacciones de backoffice
   * @param params - Parámetros de consulta: provider (requerido), page y limit (opcionales)
   * @returns Respuesta con las transacciones y metadatos de paginación
   */
  static async getBackofficeTransactions(
    params: GetBackofficeTransactionsParams,
  ): Promise<BackofficeTransactionsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.provider) {
        queryParams.append('provider', params.provider);
      }

      if (params.exclude_provider) {
        queryParams.append('exclude_provider', params.exclude_provider);
      }

      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }

      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await azkabanApi.get<BackofficeTransactionsResponse>(
        `${AZKABAN_ENDPOINTS.GET_BACKOFFICE_TRANSACTIONS}?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error fetching backoffice transactions:', error);
      throw error;
    }
  }

  static async createBackofficeTransaction(params: CreateBackofficeTransactionParams): Promise<BackofficeTransaction> {
    try {
      const idempotencyKey = crypto.randomUUID();

      const user = $user.get();
      const userEmail = user?.email || null;

      if (!userEmail) {
        console.warn('[AzkabanService] Could not get authenticated user email');
      }

      const datePart = params.operationDate;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        throw new Error('Invalid date format. Must be YYYY-MM-DD');
      }

      let timePart: string;
      if (params.operationTime) {
        const timeRegex = /^(\d{2}):(\d{2}):(\d{2})(\.\d{3})?$/;
        if (!timeRegex.test(params.operationTime)) {
          throw new Error('Invalid time format. Must be HH:mm:ss.SSS or HH:mm:ss');
        }
        timePart = params.operationTime.includes('.')
          ? params.operationTime.padEnd(12, '0').substring(0, 12)
          : `${params.operationTime}.000`;
      } else {
        timePart = '00:00:00.000';
      }

      const formattedDate = `${datePart} ${timePart}`;

      const type =
        params.movementType === 'transfer_in' || params.movementType === 'transfer_out'
          ? 'transfer'
          : params.movementType;

      const payload: any = {
        created_at: formattedDate,
        type: type,
        provider: params.provider,
        amount: String(params.amount),
        currency: params.currency,
        st_id: params.externalTransactionId,
        user_id: params.provider,
        user_id_to: params.destinationAccount,
        user_id_from: params.originAccount,
        method: params.method || params.movementType,
        reason: params.notes || '',
        occurred_at: formattedDate,
        idempotency_key: idempotencyKey,
        status: params.status || 'COMPLETED',
        ...(userEmail && { actor_id: userEmail }),
        ...(params.originProvider && { origin_provider: params.originProvider }),
      };

      const response = await azkabanApi.post<BackofficeTransaction>(
        AZKABAN_ENDPOINTS.GET_BACKOFFICE_TRANSACTIONS,
        payload,
      );

      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error creating backoffice transaction:', error);
      throw error;
    }
  }

  /**
   * Obtiene el listado de wallets externas
   * @returns Respuesta con las wallets externas (puede ser un array vacío si no hay wallets)
   */
  static async getExternalWallets(): Promise<ExternalWallet[]> {
    try {
      const response = await azkabanApi.get<ExternalWalletsResponse>(AZKABAN_ENDPOINTS.GET_EXTERNAL_WALLETS);

      if (!Array.isArray(response.data.data)) {
        console.warn('[AzkabanService] Unexpected response format for external wallets:', response.data);
        return [];
      }

      return response.data.data;
    } catch (error) {
      console.error('[AzkabanService] Error fetching external wallets:', error);
      throw error;
    }
  }

  /**
   * Estima el fee de una transacción
   * @param params - Parámetros para estimar el fee
   * @returns Respuesta con las opciones de fee (low, medium, high)
   */
  static async estimateFee(params: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    try {
      const response = await azkabanApi.post<EstimateFeeResponse>(AZKABAN_ENDPOINTS.ESTIMATE_FEE, params);
      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error estimating fee:', error);
      throw error;
    }
  }

  /**
   * Crea una transacción de retiro de blockchain
   * @param params - Parámetros para crear la transacción
   * @returns Respuesta con el ID y estado de la transacción
   */
  static async createTransaction(params: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      const response = await azkabanApi.post<CreateTransactionResponse>(AZKABAN_ENDPOINTS.CREATE_TRANSACTION, params);
      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error creating transaction:', error);
      throw error;
    }
  }
}
