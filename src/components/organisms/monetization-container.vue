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
      <!-- Sub-tabs for Apificados: Pomelo, B2B -->
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
        @monetize="handleMonetize"
        @update:quotes="pomeloQuotes = $event"
      />

      <B2BTab
        v-if="activeSubTab === 'b2b'"
        :quotes="b2bQuotes"
        :recipients="b2bRecipients"
        :available-providers="b2bProviders"
        :usdc-balance="b2bUSDC"
        :usdt-balance="b2bUSDT"
        :usd-balance="cobreB2BUSDBalance"
        @monetize="handleMonetize"
        @update:quotes="b2bQuotes = $event"
      />

      <!-- Historial de Transacciones - Card debajo de monetización -->
      <PayoutHistoryTab :account="currentAccount" />
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
import B2BTab from './b2b-tab.vue';
import NonAppliedMonetizationTab from './non-applied-monetization-tab.vue';
import PayoutHistoryTab from './payout-history-tab.vue';

defineProps<{
  lang: string;
}>();

const activeMainTab = ref<'apificados' | 'no-apificados'>('apificados');

const activeSubTab = ref<'pomelo' | 'b2b'>('pomelo');

const currentAccount = computed(() => {
  // Determine account type based on sub-tab
  // Pomelo uses 'transfer', B2B uses 'pay'
  return activeSubTab.value === 'pomelo' ? 'transfer' : 'pay';
});

const error = ref('');
const isLoadingBalances = ref(false);

// Balance data
const pomeloBalances = ref<BalanceResponse | null>(null);
const b2bBalances = ref<BalanceResponse | null>(null);
const cobreBalances = ref<BalanceResponse | null>(null); // Cobre balance for Pomelo (transfer)
const cobreB2BBalances = ref<BalanceResponse | null>(null); // Cobre balance for B2B (pay)

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
const cobreUSDBalance = computed(() => {
  // Use cobreBalances (transfer) or cobreB2BBalances (pay) - both should be the same
  const balanceSource = cobreBalances.value || cobreB2BBalances.value;
  if (!balanceSource || !balanceSource.balances) return 0;
  const usd = balanceSource.balances.find((b) => b.token === 'USD');
  return usd ? parseFloat(usd.amount || '0') : 0;
});

// Cobre USD balance for B2B (pay)
// Note: Cobre uses the same global balance for both account types
const cobreB2BUSDBalance = computed(() => {
  // Use cobreB2BBalances (pay) or cobreBalances (transfer) as fallback - both should be the same
  const balanceSource = cobreB2BBalances.value || cobreBalances.value;
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

// Load balances
const loadBalances = async () => {
  isLoadingBalances.value = true;
  error.value = '';
  try {
    // Cobre uses the same balance for both account types, so we only need one call
    const balances = await getBalances([
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER, provider: Provider.KIRA }, // Pomelo - Kira
      { account: 'pay', walletId: WALLET_IDS.PAY, provider: Provider.KIRA }, // B2B - Kira
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER, provider: Provider.COBRE }, // Cobre USD balance (same for both accounts)
    ]);

    // Handle null values (failed requests)
    pomeloBalances.value = balances[0] || null;
    b2bBalances.value = balances[1] || null;
    // Cobre balance is the same for both Pomelo and B2B (uses global balance)
    const cobreBalance = balances[2] || null;
    cobreBalances.value = cobreBalance; // Cobre balance for Pomelo (transfer)
    cobreB2BBalances.value = cobreBalance; // Cobre balance for B2B (pay) - same as Pomelo
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
    from: 'USDC', // Default to USDC
    to: 'COP',
    calculatedAmount: '-',
    rate: '-',
    spread: '-',
    provider: 'Supra',
    disabled: true,
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

// B2C quotes - reservado para uso futuro
// const b2cQuotes = ref<Quote[]>([
//   {
//     amount: '',
//     from: 'USDT',
//     to: 'MXN',
//     calculatedAmount: '-',
//     rate: '-',
//     spread: '-',
//     provider: 'Cobre',
//   },
// ]);

const b2bQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USDC', // Default to USDC
    to: 'COP',
    calculatedAmount: '-',
    rate: '-', // Will be populated after quote
    spread: '-',
    provider: 'Supra',
    disabled: true,
  },
  {
    amount: '',
    from: 'USD', // Cobre uses USD (same as Pomelo)
    to: 'COP',
    calculatedAmount: '-',
    rate: '-', // Will be populated after quote
    spread: '-',
    provider: 'Cobre',
    disabled: false, // Enable Cobre for B2B
  },
  {
    amount: '',
    from: 'USDC', // Default to USDC - always set
    to: 'COP',
    calculatedAmount: '-',
    rate: '-', // Will be populated after quote
    spread: '-',
    provider: 'Kira',
    disabled: false,
  },
]);

// Recipients data
const pomeloRecipients = ref<any[]>([
  {
    id: 'pomelo-1',
    name: 'Pomelo',
    bank: 'BBVA',
    account_type: 'Ahorros',
    type: 'company',
    account_number: '1234565892',
  },
]);

const b2bRecipients = ref<any[]>([
  {
    id: 'b2b-wagmi',
    name: 'WAGMI SAS',
    bank: 'Coinfx',
    account_type: 'Ahorros',
    type: 'company',
    account_number: '5555127351',
  },
  {
    id: 'b2b-wagmi-co',
    name: 'WAGMI co',
    bank: 'Coinfx',
    account_type: 'Ahorros',
    type: 'company',
    account_number: '5555127351',
  },
  {
    id: 'b2b-tech',
    name: 'Tech Solutions Ltd',
    bank: 'Bancolombia',
    account_type: 'Corriente',
    type: 'company',
    account_number: '9876544289',
  },
]);

// Providers based on account type
const pomeloProviders = computed(() => [
  { value: 'supra', label: 'Supra', disabled: true },
  { value: 'cobre', label: 'Cobre', disabled: false },
  { value: 'kira', label: 'Kira', disabled: false },
]);

// B2C providers (for future use)
// const b2cProviders = computed(() => [
//   { value: 'cobre', label: 'Cobre', disabled: false },
//   { value: 'kira', label: 'Kira', disabled: true },
//   { value: 'supra', label: 'Supra', disabled: true },
// ]);

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
  activeSubTab.value = tab as 'pomelo' | 'b2b';
  // Reset quotes when switching sub-tabs
  const quotes = activeSubTab.value === 'pomelo' ? pomeloQuotes.value : b2bQuotes.value;
  quotes.forEach((q) => {
    q.amount = '';
    q.calculatedAmount = '-';
  });
};

const handleMonetize = async (_payoutInfo: any) => {
  error.value = '';

  // Payout is now handled directly in pomelo-tab and b2b-tab
  // This function just reloads balances after successful payout
  try {
    // Reload balances after successful payout
    await loadBalances();
    error.value = '';
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Error al recargar balances';
  }
};
</script>
