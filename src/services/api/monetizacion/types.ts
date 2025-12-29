/**
 * TypeScript types for Monetization API
 */

export enum Provider {
  KIRA = 'kira',
  COBRE = 'cobre',
  SUPRA = 'supra',
}

export interface Balance {
  token: string;
  amount: string;
  decimals: number;
}

export interface BalanceResponse {
  walletId: string;
  network: string;
  balances: Balance[];
}

export interface GetBalanceParams {
  account: 'transfer' | 'pay';
  walletId: string;
  provider?: Provider;
}

export interface PayoutRequest {
  recipient_id: string; // UUID of the recipient (id from Recipient)
  wallet_id: string;
  reference: string;
  base_currency: string;
  quote_currency: string;
  amount: number;
  quote_id: string;
  quote: QuoteResponse;
  token: string;
  provider: Provider;
  user_id?: string; // Optional, will be set by backend
}

export interface PayoutResponse {
  payout_id: string;
  user_id: string;
  recipient_id: string;
  quote_id: string;
  reference: string;
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  txn_hash: string | null;
  status: string;
  extra_info: {
    idempotencyKey: string;
    payoutType: string;
    walletId: string;
    token: string;
  };
  created_at: string;
  updated_at: string;
  failure_reason: string | null;
}

export interface QuoteRequest {
  amount: number;
  base_currency: string;
  quote_currency: string;
  provider: Provider;
}

export interface QuoteResponse {
  quote_id: string;
  base_currency: string;
  quote_currency: string;
  base_amount: number;
  quote_amount: number;
  rate: number;
  balam_rate: number;
  fixed_fee: number;
  pct_fee: number;
  status: string;
  expiration_ts: string;
  expiration_ts_utc: string;
  network: string | null;
  network_fee: number | null;
  spread?: number | null; // Spread in basis points
}

export interface Recipient {
  id?: string; // UUID primary key (preferred)
  recipient_id?: string; // Legacy field, kept for compatibility (same as id)
  type: string;
  company_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  account_type: string;
  account_details: {
    account_number: string;
    bank_code: string;
    type: string;
    doc_type: string;
    doc_number: string;
    doc_country_code: string;
  };
  created_ts: string;
  updated_ts: string;
}

export interface RecipientsResponse {
  recipients: Recipient[];
  total: number;
}

export interface PayoutHistoryItem {
  id: string;
  created_at: string;
  updated_at: string;
  initial_currency: string;
  final_currency: string;
  initial_amount: string;
  final_amount: string;
  rate: string;
  status: string;
  user_id: string;
  provider: Provider;
  provider_external_id: string | null;
  provider_response: Record<string, unknown> | null;
  provider_webhook: Record<string, unknown> | null;
  additional_data: Record<string, unknown> | null;
}

/**
 * Maps numeric provider IDs from API to Provider enum values.
 * @param providerId - Numeric provider ID from API (1=Kira, 2=Cobre, 3=Supra)
 * @returns Provider enum value
 * @throws Error if providerId is not recognized
 */
export function mapProviderIdToEnum(providerId: number): Provider {
  const providerMap: Record<number, Provider> = {
    1: Provider.KIRA,
    2: Provider.COBRE,
    3: Provider.SUPRA,
  };

  const provider = providerMap[providerId];
  if (!provider) {
    throw new Error(`Unknown provider ID: ${providerId}`);
  }
  return provider;
}

export interface PayoutHistoryResponse {
  status: string;
  message: string;
  data: PayoutHistoryItem[];
}
