/**
 * TypeScript types for Monetization API
 */

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
}

export interface PayoutRequest {
  recipient_id: string;
  wallet_id: string;
  reference: string;
  base_currency: string;
  quote_currency: string;
  amount: number;
  quote_id: string;
  quote: QuoteResponse;
  token: string;
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
}

export interface Recipient {
  recipient_id: string;
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
