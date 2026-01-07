<template>
  <div class="space-y-8">
    <!-- Title Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Monetización</h1>
      <p class="text-base text-neutral-60">Gestión de operaciones FX y movimientos de fondos</p>
    </div>

    <!-- Main Tabs: Monetización Apificados / Monetización No Apificados -->
    <MonetizationTabs
      :active-tab="activeMainTab"
      :tabs="mainTabs"
      @update:active-tab="handleMainTabChange"
    />

    <!-- Content based on main tab -->
    <div
      v-if="activeMainTab === 'apificados'"
      class="space-y-6"
    >
      <!-- Sub-tabs for Apificados: Pomelo, B2C, B2B -->
      <MonetizationTabs
        :active-tab="activeSubTab"
        :tabs="apificadosSubTabs"
        @update:active-tab="handleSubTabChange"
      />

      <!-- Sub-tab Content -->
      <PomeloTab
        v-if="activeSubTab === 'pomelo'"
        :quotes="pomeloQuotes"
        :recipients="pomeloRecipients"
        :available-providers="pomeloProviders"
        :usdc-balance="pomeloUSDC"
        :usdt-balance="pomeloUSDT"
        :usd-balance="cobreUSDBalance"
        :supra-usd-balance="supraUSDBalance"
        @monetize="handleMonetize"
        @update:quotes="pomeloQuotes = $event"
      />

      <B2CTab
        v-if="activeSubTab === 'b2c'"
        :quotes="b2cQuotes"
        :available-providers="b2cProviders"
        :usdt-balance="b2cUSDT"
        :usd-balance="cobreUSDBalance"
        @monetize="handleMonetize"
        @update:quotes="b2cQuotes = $event"
      />

      <B2BTab
        v-if="activeSubTab === 'b2b'"
        :quotes="b2bQuotes"
        :recipients="b2bRecipients"
        :available-providers="b2bProviders"
        :usdc-balance="b2bUSDC"
        :usdt-balance="b2bUSDT"
        :usd-balance="cobreUSDBalance"
        :supra-usd-balance="supraB2BUSDBalance"
        @monetize="handleMonetize"
        @update:quotes="b2bQuotes = $event"
      />

      <!-- Historial de Transacciones - Card debajo de monetización -->
      <PayoutHistoryTab
        ref="payoutHistoryTabRef"
        :account="currentAccount"
      />
    </div>

    <!-- Monetización No Apificados Tab -->
    <NonAppliedMonetizationTab v-if="activeMainTab === 'no-apificados'" />

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-carmine-light border border-carmine rounded-lg p-4"
    >
      <p class="text-carmine font-bold">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getBalances, WALLET_IDS, Provider, type BalanceResponse } from '../../services';
import MonetizationTabs from '../molecules/monetization-tabs.vue';
import PomeloTab from './pomelo-tab.vue';
import B2CTab from './b2c-tab.vue';
import B2BTab from './b2b-tab.vue';
import NonAppliedMonetizationTab from './non-applied-monetization-tab.vue';
import PayoutHistoryTab from './payout-history-tab.vue';
import type { PayoutHistoryTabInstance } from '../../types/components';

defineProps<{
  lang: string;
}>();

const activeMainTab = ref<'apificados' | 'no-apificados'>('apificados');

const activeSubTab = ref<'pomelo' | 'b2c' | 'b2b'>('pomelo');

const currentAccount = computed(() => {
  // Determine account type based on sub-tab
  // Pomelo uses 'transfer', B2C and B2B use 'pay'
  return activeSubTab.value === 'pomelo' ? 'transfer' : 'pay';
});

const error = ref('');
const isLoadingBalances = ref(false);

// Balance data
const pomeloBalances = ref<BalanceResponse | null>(null);
const b2cBalances = ref<BalanceResponse | null>(null);
const b2bBalances = ref<BalanceResponse | null>(null);
const cobreBalances = ref<BalanceResponse | null>(null); // Cobre balance for Pomelo (transfer)
const cobreB2CBalances = ref<BalanceResponse | null>(null); // Cobre balance for B2C (pay)
const cobreB2BBalances = ref<BalanceResponse | null>(null); // Cobre balance for B2B (pay)
const supraBalances = ref<BalanceResponse | null>(null); // Supra balance for Pomelo (transfer)
const supraB2BBalances = ref<BalanceResponse | null>(null); // Supra balance for B2B (pay)

// Individual Pomelo token balances
const pomeloUSDC = computed(() => {
  if (!pomeloBalances.value || !pomeloBalances.value.balances) return 0;
  const usdc = pomeloBalances.value.balances.find((b) => b.token === 'USDC');
  return usdc ? parseFloat(usdc.amount || '0') : 0;
});

const pomeloUSDT = computed(() => {
  if (!pomeloBalances.value || !pomeloBalances.value.balances) return 0;
  const usdt = pomeloBalances.value.balances.find((b) => b.token === 'USDT');
  return usdt ? parseFloat(usdt.amount || '0') : 0;
});

// Cobre USD balance for Pomelo (transfer)
// Note: Cobre uses the same global balance for both account types
// Cobre USD balance (consolidated for all account types)
// Note: Cobre uses the same global balance for all account types
const cobreUSDBalance = computed(() => {
  // Try all balance sources as fallback - all should be the same
  const balanceSource = cobreB2CBalances.value || cobreB2BBalances.value || cobreBalances.value;
  if (!balanceSource || !balanceSource.balances) return 0;
  const usd = balanceSource.balances.find((b) => b.token === 'USD');
  return usd ? parseFloat(usd.amount || '0') : 0;
});

// Supra USD balance for Pomelo (transfer)
// Note: Supra uses the same global balance for both account types
const supraUSDBalance = computed(() => {
  // Use supraBalances (transfer) or supraB2BBalances (pay) - both should be the same
  const balanceSource = supraBalances.value || supraB2BBalances.value;
  if (!balanceSource || !balanceSource.balances) return 0;
  const usd = balanceSource.balances.find((b) => b.token === 'USD');
  return usd ? parseFloat(usd.amount || '0') : 0;
});

// Supra USD balance for B2B (pay)
// Note: Supra uses the same global balance for both account types
const supraB2BUSDBalance = computed(() => {
  // Use supraB2BBalances (pay) or supraBalances (transfer) as fallback - both should be the same
  const balanceSource = supraB2BBalances.value || supraBalances.value;
  if (!balanceSource || !balanceSource.balances) return 0;
  const usd = balanceSource.balances.find((b) => b.token === 'USD');
  return usd ? parseFloat(usd.amount || '0') : 0;
});

// Individual B2B token balances
const b2bUSDC = computed(() => {
  if (!b2bBalances.value || !b2bBalances.value.balances) return 0;
  const usdc = b2bBalances.value.balances.find((b) => b.token === 'USDC');
  return usdc ? parseFloat(usdc.amount || '0') : 0;
});

const b2bUSDT = computed(() => {
  if (!b2bBalances.value || !b2bBalances.value.balances) return 0;
  const usdt = b2bBalances.value.balances.find((b) => b.token === 'USDT');
  return usdt ? parseFloat(usdt.amount || '0') : 0;
});

// Individual B2C token balances
const b2cUSDT = computed(() => {
  if (!b2cBalances.value || !b2cBalances.value.balances) return 0;
  const usdt = b2cBalances.value.balances.find((b) => b.token === 'USDT');
  return usdt ? parseFloat(usdt.amount || '0') : 0;
});

// Load balances
const loadBalances = async () => {
  isLoadingBalances.value = true;
  error.value = '';
  try {
    // Cobre and Supra use the same balance for both account types, so we only need one call each
    const balances = await getBalances([
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER, provider: Provider.KIRA }, // Pomelo - Kira
      { account: 'pay', walletId: WALLET_IDS.PAY, provider: Provider.KIRA }, // B2C/B2B - Kira (for USDT balance, shared)
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER, provider: Provider.COBRE }, // Cobre USD balance (same for all accounts)
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER, provider: Provider.SUPRA }, // Supra USD balance (same for all accounts)
    ]);

    // Handle null values (failed requests)
    pomeloBalances.value = balances[0] || null;
    const kiraPayBalance = balances[1] || null;
    b2cBalances.value = kiraPayBalance; // B2C - Kira (pay)
    b2bBalances.value = kiraPayBalance; // B2B - Kira (pay) - same as B2C
    // Cobre balance is the same for all account types (uses global balance)
    const cobreBalance = balances[2] || null;
    cobreBalances.value = cobreBalance; // Cobre balance for Pomelo (transfer)
    cobreB2CBalances.value = cobreBalance; // Cobre balance for B2C (pay) - same as Pomelo
    cobreB2BBalances.value = cobreBalance; // Cobre balance for B2B (pay) - same as Pomelo
    // Supra balance is the same for all account types (uses global balance)
    const supraBalance = balances[3] || null;
    supraBalances.value = supraBalance; // Supra balance for Pomelo (transfer)
    supraB2BBalances.value = supraBalance; // Supra balance for B2B (pay) - same as Pomelo
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.error?.message || err.response?.data?.detail || err.message || 'Error al cargar balances';
    error.value = errorMessage;
  } finally {
    isLoadingBalances.value = false;
  }
};

onMounted(() => {
  loadBalances();
});

// Main tabs configuration
const mainTabs = [
  { value: 'apificados', label: 'Monetización Apificados' },
  { value: 'no-apificados', label: 'Monetización No Apificados' },
];

// Sub-tabs for Apificados
const apificadosSubTabs = [
  { value: 'pomelo', label: 'Pomelo' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' },
];

// Quotes data
interface Quote {
  amount: string;
  from: string;
  to: string;
  calculatedAmount: string;
  rate: string;
  spread: string;
  provider: string;
  disabled?: boolean;
}

const pomeloQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USD', // Supra uses USD (same as Cobre)
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Supra',
    disabled: false,
  },
  {
    amount: '',
    from: 'USD', // Cobre uses USD
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Cobre',
    disabled: false,
  },
  {
    amount: '',
    from: 'USDC', // Default to USDC - always set
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Kira',
    disabled: false,
  },
]);

// B2C quotes - solo Cobre, USD -> COP
const b2cQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USD',
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Cobre',
    disabled: false,
  },
]);

const b2bQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USD', // Supra uses USD (same as Cobre)
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Supra',
    disabled: false,
  },
  {
    amount: '',
    from: 'USD', // Cobre uses USD
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Cobre',
    disabled: false,
  },
  {
    amount: '',
    from: 'USDC', // Default to USDC - always set
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Kira',
    disabled: false,
  },
]);

// Recipients data
const pomeloRecipients = ref<any[]>([]);

const b2bRecipients = ref<any[]>([]);

// Providers based on account type
const pomeloProviders = computed(() => [
  { value: 'supra', label: 'Supra', disabled: false },
  { value: 'cobre', label: 'Cobre', disabled: false },
  { value: 'kira', label: 'Kira', disabled: false },
]);

// B2C providers - solo Cobre
const b2cProviders = computed(() => [{ value: 'cobre', label: 'Cobre', disabled: false }]);

const b2bProviders = computed(() => [
  { value: 'supra', label: 'Supra', disabled: false },
  { value: 'cobre', label: 'Cobre', disabled: false },
  { value: 'kira', label: 'Kira', disabled: false },
]);

const handleMainTabChange = (tab: string) => {
  activeMainTab.value = tab as 'apificados' | 'no-apificados';
  // Reset sub-tab when switching main tabs
  if (activeMainTab.value === 'apificados') {
    activeSubTab.value = 'pomelo';
  }
};

const handleSubTabChange = (tab: string) => {
  activeSubTab.value = tab as 'pomelo' | 'b2c' | 'b2b';
  // Reset quotes when switching sub-tabs
  const quotes =
    activeSubTab.value === 'pomelo'
      ? pomeloQuotes.value
      : activeSubTab.value === 'b2c'
        ? b2cQuotes.value
        : b2bQuotes.value;
  quotes.forEach((q) => {
    q.amount = '';
    q.calculatedAmount = '-';
  });
};

// Reference to PayoutHistoryTab component
const payoutHistoryTabRef = ref<PayoutHistoryTabInstance | null>(null);

const handleMonetize = async (_payoutInfo: any) => {
  error.value = '';

  // Payout is now handled directly in pomelo-tab and b2b-tab
  // This function just reloads balances after successful payout
  try {
    // Reload balances after successful payout
    await loadBalances();

    // Update payout history to show the new transaction
    if (payoutHistoryTabRef.value && typeof payoutHistoryTabRef.value.loadPayoutHistory === 'function') {
      await payoutHistoryTabRef.value.loadPayoutHistory();
    }

    error.value = '';
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Error al recargar balances';
  }
};
</script>
