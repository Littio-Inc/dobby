import { azkabanApi } from '../../../stores/common/api-client';
import { $user } from '../../../stores/auth-store';

const AZKABAN_ENDPOINTS = {
  GET_ACCOUNTS: '/v1/vault/accounts',
  REFRESH_BALANCE: '/v1/vault/accounts',
  GET_BACKOFFICE_TRANSACTIONS: '/v1/backoffice/transactions',
  GET_EXTERNAL_WALLETS: '/v1/vault/external-wallets',
  ESTIMATE_FEE: '/v1/vault/transactions/estimate-fee',
  CREATE_TRANSACTION: '/v1/vault/transactions/create-transaction',
  GET_OPENTRADE_VAULTS: '/v1/opentrade/vaults',
  GET_OPENTRADE_VAULT_ACCOUNT: '/v1/opentrade/vaultsAccount',
  GET_OPENTRADE_VAULT_OVERVIEW: '/v1/opentrade/vaults',
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
  movement_type?: string;
  page?: number;
  limit?: number;
}

export interface CreateBackofficeTransactionParams {
  operationDate: string;
  operationTime?: string;
  movementType: 'transfer_in' | 'transfer_out' | 'payment' | 'withdrawal' | 'transfer' | 'swap_in' | 'swap_out';
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
  movement_type?: string;
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
  baseFee?: string;
  priorityFee?: string;
  l1Fee?: string;
  maxFeePerGasDelta?: string;
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
  idempotencyKey?: string;
}

export interface CreateTransactionResponse {
  id: string;
  status: string;
}

export interface OpentradeVault {
  display_name: string;
  chain_id: number;
  contract_name: string;
  pool_type: number;
  chain_config_name: string;
  creation_block: number;
  creation_timestamp: number;
  symbol: string;
  name: string;
  liquidity_asset_addr: string;
  liquidity_token_symbol: string;
  currency_label: string;
  pool_addr: string;
}

export interface OpentradeVaultsResponse {
  vault_list: OpentradeVault[];
}

export interface CollateralSetCto {
  exchange_rate_automation: string;
  timestamp: number;
  collateral: any[];
  pool_addr: string;
}

export interface VaultAccountCto {
  yield_type: string;
  rollover_collateral: string;
  automatic_rollover: boolean;
  early_withdrawal_processing_period: number;
  maximum_transfer_amount: number;
  minimum_transfer_amount: number;
  contractual_currency: string;
  liquidity_fee_rate: number;
  platform_fee_rate: number;
  advisory_fee_rate: number;
  transfer_out_days: number;
  transfer_in_days: number;
  benchmark_rate: string;
  collateral: any[];
  collateral_set_cto: CollateralSetCto;
  timestamp_offchain: number;
  pool_addr_offchain: string;
  version: string;
  pool_type: number;
  id: string;
  timestamp: number;
  timestamp_date_string: string;
  timestamp_string: string;
  day_number: number;
  time_of_day: number;
  block_number: number;
  vault_name: string;
  currency_label: string;
  liquidity_token_symbol: string;
  pool_addr: string;
  account_addr: string;
  liquidity_asset_addr: string;
  token_balance: string;
  asset_balance: string;
  principal_earning_interest: string;
  max_withdraw_request: string;
  max_redeem_request: string;
  requested_shares_of: string;
  requested_assets_of: string;
  accepted_shares: string;
  accepted_assets: string;
  assets_deposited: string;
  assets_withdrawn: string;
  current_asset_value: string;
  gain_loss: string;
  gain_loss_in_day: string;
  credits: string;
  credits_in_day: string;
  debits: string;
  debits_in_day: string;
  fees: string;
  fees_in_day: string;
  interest_rate: string;
  exchange_rate: string;
  indicative_interest_rate: string;
  collateral_rate: string;
}

export interface OpentradeVaultAccountResponse {
  vault_account_cto: VaultAccountCto;
  vault_address: string;
  account_address: string;
}

export interface VaultOverviewCto {
  yield_type: string;
  rollover_collateral: string;
  automatic_rollover: boolean;
  early_withdrawal_processing_period: number;
  maximum_transfer_amount: number;
  minimum_transfer_amount: number;
  contractual_currency: string;
  liquidity_fee_rate: number;
  platform_fee_rate: number;
  advisory_fee_rate: number;
  transfer_out_days: number;
  transfer_in_days: number;
  benchmark_rate: string;
  collateral: any[];
  collateral_set_cto: CollateralSetCto;
  timestamp_offchain: number;
  pool_addr_offchain: string;
  version: string;
  pool_type: number;
  pool_addr: string;
  id: string;
  chain_configuration_name: string;
  creation_block: number;
  creation_timestamp: number;
  liquidity_token_symbol: string;
  currency_label: string;
  pool_admin_addr: string;
  pool_controller_addr: string;
  exchange_rate_type: number;
  name: string;
  symbol: string;
  borrower_manager_addr: string;
  borrower_wallet_addr: string;
  close_of_deposit_time: number;
  close_of_withdraw_time: number;
  fee_collector_address: string;
  liquidity_asset_addr: string;
  block_number: number;
  timestamp: number;
  timestamp_date_string: string;
  timestamp_string: string;
  time_of_day: number;
  day_number: number;
  chain_id: number;
  state: number;
  total_assets_deposited: string;
  total_assets_withdrawn: string;
  interest_rate: string;
  exchange_rate: string;
  exchange_rate_at_set_day: string;
  exchange_rate_set_day: number;
  exchange_rate_change_rate: string;
  exchange_rate_compounding_rate: string;
  exchange_rate_at_maturity: string;
  exchange_rate_maturity_day: number;
  indicative_interest_rate: string;
  collateral_rate: string;
  total_interest_accrued: string;
  total_shares: string;
  total_assets: string;
  total_outstanding_loan_principal: string;
}

export interface OpentradeVaultOverviewResponse {
  vault_overview_cto: VaultOverviewCto;
  vault_address: string;
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

      if (params.movement_type) {
        queryParams.append('movement_type', params.movement_type);
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
          : params.movementType === 'swap_in' || params.movementType === 'swap_out'
            ? params.movementType
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
        ...(params.movement_type && { movement_type: params.movement_type }),
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
      // Generate idempotency key if not provided
      const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

      // Include idempotency key in request body (consistent with createBackofficeTransaction)
      // Note: If backend requires it as HTTP header instead, use:
      // const requestConfig = { headers: { 'Idempotency-Key': idempotencyKey } };
      // and pass requestConfig as third parameter to azkabanApi.post()
      const requestBody = {
        ...params,
        idempotencyKey: idempotencyKey,
      };

      const response = await azkabanApi.post<CreateTransactionResponse>(
        AZKABAN_ENDPOINTS.CREATE_TRANSACTION,
        requestBody,
      );

      return response.data;
    } catch (error: any) {
      console.error('[AzkabanService] Error creating transaction:', error);

      // Handle idempotency-related errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        // 409 Conflict typically indicates duplicate request (idempotency)
        if (status === 409) {
          const errorMessage =
            errorData?.message ||
            errorData?.detail ||
            'Esta transacción ya fue procesada anteriormente. Por favor, verifique si la transacción ya existe.';
          const idempotencyError = new Error(errorMessage);
          (idempotencyError as any).isIdempotencyError = true;
          (idempotencyError as any).statusCode = 409;
          throw idempotencyError;
        }

        // 422 might also indicate duplicate or validation issues related to idempotency
        if (status === 422) {
          const errorMessage = errorData?.message || errorData?.detail || error.message;
          if (
            errorMessage?.toLowerCase().includes('duplicate') ||
            errorMessage?.toLowerCase().includes('idempotency')
          ) {
            const idempotencyError = new Error(errorMessage);
            (idempotencyError as any).isIdempotencyError = true;
            (idempotencyError as any).statusCode = 422;
            throw idempotencyError;
          }
        }
      }

      throw error;
    }
  }

  /**
   * Obtiene el listado de vaults de OpenTrade
   * @returns Respuesta con la lista de vaults disponibles
   */
  static async getOpentradeVaults(): Promise<OpentradeVault[]> {
    try {
      const response = await azkabanApi.get<OpentradeVaultsResponse>(AZKABAN_ENDPOINTS.GET_OPENTRADE_VAULTS);

      if (!Array.isArray(response.data.vault_list)) {
        console.warn('[AzkabanService] Unexpected response format for opentrade vaults:', response.data);
        return [];
      }

      return response.data.vault_list;
    } catch (error) {
      console.error('[AzkabanService] Error fetching opentrade vaults:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información de una cuenta de vault específica de OpenTrade
   * @param poolAddr - Dirección del pool del vault
   * @param accountAddr - Dirección de la cuenta
   * @returns Respuesta con la información de la cuenta del vault
   */
  static async getOpentradeVaultAccount(poolAddr: string, accountAddr: string): Promise<OpentradeVaultAccountResponse> {
    try {
      const response = await azkabanApi.get<OpentradeVaultAccountResponse>(
        `${AZKABAN_ENDPOINTS.GET_OPENTRADE_VAULT_ACCOUNT}/${poolAddr}/${accountAddr}`,
      );

      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error fetching opentrade vault account:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información general (overview) de un vault específico de OpenTrade
   * @param poolAddr - Dirección del pool del vault
   * @returns Respuesta con la información general del vault
   */
  static async getOpentradeVaultOverview(poolAddr: string): Promise<OpentradeVaultOverviewResponse> {
    try {
      const response = await azkabanApi.get<OpentradeVaultOverviewResponse>(
        `${AZKABAN_ENDPOINTS.GET_OPENTRADE_VAULT_OVERVIEW}/${poolAddr}`,
      );

      return response.data;
    } catch (error) {
      console.error('[AzkabanService] Error fetching opentrade vault overview:', error);
      throw error;
    }
  }
}
