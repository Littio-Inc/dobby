/**
 * Monetization API Client
 * Handles all API calls related to monetization, balances, and payouts
 */

import { azkabanApi } from '../../../stores/common/api-client';
import type {
  BalanceResponse,
  GetBalanceParams,
  PayoutRequest,
  PayoutResponse,
  QuoteRequest,
  QuoteResponse,
  RecipientsResponse,
} from './types';

/**
 * Get balance for a specific account and wallet
 * @param params - Account type and wallet ID
 * @returns Balance response with available balances
 */
export async function getBalance(params: GetBalanceParams): Promise<BalanceResponse> {
  const { account, walletId } = params;
  const response = await azkabanApi.get<BalanceResponse>(`/v1/payouts/account/${account}/wallets/${walletId}/balances`);
  return response.data;
}

/**
 * Get balances for multiple wallets
 * @param params - Array of account and wallet ID pairs
 * @returns Array of balance responses (null for failed requests)
 */
export async function getBalances(params: GetBalanceParams[]): Promise<(BalanceResponse | null)[]> {
  const promises = params.map((param) =>
    getBalance(param).catch(() => {
      return null; // Return null for failed requests
    }),
  );
  return Promise.all(promises);
}

/**
 * Get a quote for a currency exchange
 * @param account - Account type (transfer for Pomelo)
 * @param quoteParams - Quote parameters (amount, base_currency, quote_currency)
 * @returns Quote response with rate and calculated amount
 */
export async function getQuote(account: 'transfer' | 'pay', quoteParams: QuoteRequest): Promise<QuoteResponse> {
  const { amount, base_currency, quote_currency } = quoteParams;
  const response = await azkabanApi.get<QuoteResponse>(
    `/v1/payouts/account/${account}/quote?amount=${amount}&base_currency=${base_currency}&quote_currency=${quote_currency}`,
  );
  return response.data;
}

/**
 * Get recipients for a specific account and user
 * @param account - Account type (transfer for Pomelo, pay for B2B)
 * @param userId - User ID
 * @returns Recipients response with list of recipients
 */
export async function getRecipients(account: 'transfer' | 'pay', userId: string): Promise<RecipientsResponse> {
  const response = await azkabanApi.get<RecipientsResponse>(
    `/v1/payouts/account/${account}/recipient?user_id=${userId}`,
  );
  return response.data;
}

/**
 * Create a payout
 * @param account - Account type (transfer for Pomelo, pay for B2B)
 * @param payoutData - Payout request data
 * @returns Payout response with transaction ID
 */
export async function createPayout(account: 'transfer' | 'pay', payoutData: PayoutRequest): Promise<PayoutResponse> {
  const response = await azkabanApi.post<PayoutResponse>(`/v1/payouts/account/${account}/payout`, payoutData);
  return response.data;
}

/**
 * Wallet IDs from environment variables
 * Must be configured via PUBLIC_WALLET_ID_TRANSFER and PUBLIC_WALLET_ID_PAY
 */
export const WALLET_IDS = {
  TRANSFER: import.meta.env.PUBLIC_WALLET_ID_TRANSFER || '',
  PAY: import.meta.env.PUBLIC_WALLET_ID_PAY || '',
} as const;

/**
 * User IDs from environment variables
 * Must be configured via PUBLIC_USER_ID_TRANSFER and PUBLIC_USER_ID_PAY
 */
export const USER_IDS = {
  TRANSFER: import.meta.env.PUBLIC_USER_ID_TRANSFER || '',
  PAY: import.meta.env.PUBLIC_USER_ID_PAY || '',
} as const;
