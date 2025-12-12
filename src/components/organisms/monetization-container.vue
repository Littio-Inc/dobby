<template>
  <div class="space-y-8">
    <!-- Title Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Monetización</h1>
      <p class="text-base text-neutral-60">Gestión de operaciones FX y movimientos de fondos</p>
    </div>

    <!-- Tabs: Pomelo, B2C -->
    <MonetizationTabs
      :active-tab="activeAccountType"
      :tabs="tabs"
      @update:active-tab="handleTabChange"
    />

    <!-- Tab Content -->
    <PomeloTab
      v-if="activeAccountType === 'pomelo'"
      :quotes="pomeloQuotes"
      :recipients="pomeloRecipients"
      :available-providers="pomeloProviders"
      :usdc-balance="pomeloUSDC"
      :usdt-balance="pomeloUSDT"
      @monetize="handleMonetize"
      @update:quotes="pomeloQuotes = $event"
    />

    <B2BTab
      v-if="activeAccountType === 'b2b'"
      :quotes="b2bQuotes"
      :recipients="b2bRecipients"
      :available-providers="b2bProviders"
      :usdc-balance="b2bUSDC"
      :usdt-balance="b2bUSDT"
      @monetize="handleMonetize"
      @update:quotes="b2bQuotes = $event"
    />

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
import { getBalances, WALLET_IDS, type BalanceResponse } from '../../services';
import MonetizationTabs from '../molecules/monetization-tabs.vue';
import PomeloTab from './pomelo-tab.vue';
import B2BTab from './b2b-tab.vue';

defineProps<{
  lang: string;
}>();
const activeAccountType = ref<'pomelo' | 'b2c' | 'b2b'>('pomelo');
const error = ref('');
const isLoadingBalances = ref(false);

// Balance data
const pomeloBalances = ref<BalanceResponse | null>(null);
const b2bBalances = ref<BalanceResponse | null>(null);

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
    const balances = await getBalances([
      { account: 'transfer', walletId: WALLET_IDS.TRANSFER }, // Pomelo
      { account: 'pay', walletId: WALLET_IDS.PAY }, // B2B
    ]);

    // Handle null values (failed requests)
    pomeloBalances.value = balances[0] || null;
    b2bBalances.value = balances[1] || null;
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

const tabs = [
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
    rate: '4.005,00',
    spread: '15bp',
    provider: 'Supra',
    disabled: true,
  },
  {
    amount: '',
    from: 'USDC', // Default to USDC
    to: 'BRL',
    calculatedAmount: '-',
    rate: '5,20',
    spread: '20bp',
    provider: 'Cobre',
    disabled: true,
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

const b2cQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USDT',
    to: 'MXN',
    calculatedAmount: '-',
    rate: '18,50',
    spread: '22bp',
    provider: 'Cobre',
  },
]);

const b2bQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USDC', // Default to USDC
    to: 'COP',
    calculatedAmount: '-',
    rate: '-', // Will be populated after quote
    spread: '17bp',
    provider: 'Supra',
    disabled: true,
  },
  {
    amount: '',
    from: 'USDC', // Default to USDC
    to: 'COP',
    calculatedAmount: '-',
    rate: '-', // Will be populated after quote
    spread: '25bp',
    provider: 'Cobre',
    disabled: true,
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
  { value: 'supra', label: 'Supra', disabled: false },
  { value: 'cobre', label: 'Cobre', disabled: true },
  { value: 'kira', label: 'Kira', disabled: true },
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

const handleTabChange = (tab: string) => {
  activeAccountType.value = tab as 'pomelo' | 'b2c' | 'b2b';
  // Reset quotes when switching tabs
  const quotes =
    activeAccountType.value === 'pomelo'
      ? pomeloQuotes.value
      : activeAccountType.value === 'b2c'
        ? b2cQuotes.value
        : b2bQuotes.value;
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
