<template>
  <div class="space-y-8">
    <!-- Title Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">
        Monetización
      </h1>
      <p class="text-base text-neutral-60">
        Gestión de operaciones FX y movimientos de fondos
      </p>
    </div>

    <!-- Tabs: Pomelo, B2C, B2B -->
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
      @monetize="handleMonetize"
    />

    <B2CTab
      v-if="activeAccountType === 'b2c'"
      :quotes="b2cQuotes"
      :recipients="b2cRecipients"
      :available-providers="b2cProviders"
      @monetize="handleMonetize"
    />

    <B2BTab
      v-if="activeAccountType === 'b2b'"
      :quotes="b2bQuotes"
      :recipients="b2bRecipients"
      :available-providers="b2bProviders"
      @monetize="handleMonetize"
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
import { ref, computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { $user } from '../../stores/auth-store';
import { cassandraApi } from '../../stores/common/api-client';
import MonetizationTabs from '../molecules/monetization-tabs.vue';
import PomeloTab from './pomelo-tab.vue';
import B2CTab from './b2c-tab.vue';
import B2BTab from './b2b-tab.vue';

defineProps<{
  lang: string;
}>();

const user = useStore($user);
const activeAccountType = ref<'pomelo' | 'b2c' | 'b2b'>('pomelo');
const error = ref('');

const tabs = [
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
}

const pomeloQuotes = ref<Quote[]>([
  {
    amount: '',
    from: 'USD',
    to: 'COP',
    calculatedAmount: '-',
    rate: '4.005,00',
    spread: '15bp',
    provider: 'Supra',
  },
  {
    amount: '',
    from: 'USDT',
    to: 'BRL',
    calculatedAmount: '-',
    rate: '5,20',
    spread: '20bp',
    provider: 'Cobre',
  },
  {
    amount: '',
    from: 'USD',
    to: 'ARS',
    calculatedAmount: '-',
    rate: '850,00',
    spread: '18bp',
    provider: 'Kira',
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
    from: 'USDT',
    to: 'COP',
    calculatedAmount: '-',
    rate: '4.005,00',
    spread: '17bp',
    provider: 'Supra',
  },
  {
    amount: '',
    from: 'USD',
    to: 'MXN',
    calculatedAmount: '-',
    rate: '18,50',
    spread: '25bp',
    provider: 'Cobre',
  },
  {
    amount: '',
    from: 'USDT',
    to: 'USD',
    calculatedAmount: '-',
    rate: '1,00',
    spread: '12bp',
    provider: 'Kira',
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

const b2cRecipients = ref<any[]>([
  {
    id: 'b2c-cobre',
    name: 'Cobre',
    bank: 'Bancolombia',
    account_type: 'Corriente',
    type: 'company',
    account_number: '9876548765',
  },
  {
    id: 'b2c-paymentsway',
    name: 'Payments Way',
    bank: 'BBVA',
    account_type: 'Ahorros',
    type: 'company',
    account_number: '55554321',
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

const b2cProviders = computed(() => [
  { value: 'cobre', label: 'Cobre', disabled: false },
  { value: 'kira', label: 'Kira', disabled: true },
  { value: 'supra', label: 'Supra', disabled: true },
]);

const b2bProviders = computed(() => [
  { value: 'supra', label: 'Supra', disabled: false },
  { value: 'cobre', label: 'Cobre', disabled: false },
  { value: 'kira', label: 'Kira', disabled: false },
]);

const handleTabChange = (tab: string) => {
  activeAccountType.value = tab as 'pomelo' | 'b2c' | 'b2b';
  // Reset quotes when switching tabs
  const quotes = activeAccountType.value === 'pomelo' ? pomeloQuotes.value :
                 activeAccountType.value === 'b2c' ? b2cQuotes.value : b2bQuotes.value;
  quotes.forEach((q) => {
    q.amount = '';
    q.calculatedAmount = '-';
  });
};

const handleMonetize = async (payoutData: any) => {
  error.value = '';

  try {
    await cassandraApi.post('/v1/payouts/account/pay/payout', payoutData);
    
    // Success - reset form
    const quotes = activeAccountType.value === 'pomelo' ? pomeloQuotes.value :
                   activeAccountType.value === 'b2c' ? b2cQuotes.value : b2bQuotes.value;
    quotes.forEach((q) => {
      q.amount = '';
      q.calculatedAmount = '-';
    });
    error.value = '';
    alert('Monetización exitosa');
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Error al monetizar';
    console.error('Monetize error:', err);
  }
};
</script>
