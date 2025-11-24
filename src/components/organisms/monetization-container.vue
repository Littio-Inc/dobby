<template>
  <div class="space-y-4">
    <!-- Account Selector -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-neutral-80 mb-2">Cuenta</label>
      <select
        v-model="selectedAccount"
        class="px-4 py-2 border border-neutral-40 rounded bg-white min-w-[200px]"
      >
        <option value="B2B">B2B</option>
        <option value="B2C">B2C</option>
      </select>
    </div>

    <!-- Tabs -->
    <div class="border-b border-neutral-20 mb-6">
      <div class="flex gap-2">
        <button
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'transfer'
              ? 'bg-littio-secondary-sky text-white border-b-2 border-littio-secondary-sky'
              : 'bg-neutral-10 text-neutral-60 hover:bg-neutral-20',
          ]"
          @click="activeTab = 'transfer'"
        >
          Transferencia B2B
        </button>
        <button
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'transactions'
              ? 'bg-littio-secondary-sky text-white border-b-2 border-littio-secondary-sky'
              : 'bg-neutral-10 text-neutral-60 hover:bg-neutral-20',
          ]"
          @click="activeTab = 'transactions'"
        >
          Registro de Transacciones
        </button>
      </div>
    </div>

    <!-- Transferencia B2B Tab Content -->
    <div
      v-if="activeTab === 'transfer'"
      class="space-y-6"
    >
      <!-- Balance Section -->
      <div class="bg-white rounded-lg border border-neutral-20 p-6">
        <div class="flex items-center gap-4">
          <label class="text-sm font-bold text-neutral-80">Saldo :</label>
          <div class="px-4 py-2 bg-carmine-light rounded border border-carmine">
            <span class="text-xl font-bold text-carmine">{{ balance }}</span>
          </div>
          <select
            v-model="selectedCurrency"
            class="px-4 py-2 border border-neutral-40 rounded bg-white"
          >
            <option value="USDC">USDC</option>
            <option value="USD">USD</option>
            <option value="COP">COP</option>
          </select>
        </div>
      </div>

      <!-- Quote Section -->
      <div class="bg-white rounded-lg border border-neutral-20 p-6">
        <label class="block text-sm font-medium text-neutral-80 mb-4">Cotizacion</label>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <input
              v-model="quoteAmount"
              type="text"
              class="w-full px-4 py-2 border border-neutral-40 rounded"
              placeholder="1,00"
            />
          </div>
          <div>
            <select
              v-model="fromCurrency"
              class="w-full px-4 py-2 border border-neutral-40 rounded bg-white"
            >
              <option value="USD">US$</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-neutral-60 mb-1">De</label>
            <select
              v-model="fromCurrency"
              class="w-full px-4 py-2 border border-neutral-40 rounded bg-white"
            >
              <option value="USD">USD</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-neutral-60 mb-1">Hacia</label>
            <select
              v-model="toCurrency"
              class="w-full px-4 py-2 border border-neutral-40 rounded bg-white"
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <button
              :disabled="isLoadingQuote"
              class="w-full px-6 py-2 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/80 disabled:opacity-50"
              @click="getQuote"
            >
              {{ isLoadingQuote ? 'Cotizando...' : 'Cotizar' }}
            </button>
          </div>
        </div>

        <!-- Quote Results -->
        <div
          v-if="quote"
          class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Monto</label>
            <div class="px-4 py-3 bg-littio-secondary-sky/10 rounded border border-littio-secondary-sky/20">
              <span class="font-bold text-littio-secondary-sky">{{ formattedAmount }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Cotizacion Tasa</label>
            <div class="px-4 py-3 bg-littio-secondary-sky/10 rounded border border-littio-secondary-sky/20">
              <span class="font-bold text-littio-secondary-sky">{{ formattedRate }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Fecha de vencimiento</label>
            <div class="px-4 py-3 bg-littio-secondary-sky/10 rounded border border-littio-secondary-sky/20">
              <span class="font-bold text-littio-secondary-sky">{{ expirationDate }}</span>
            </div>
          </div>
          <div class="flex items-end">
            <div class="w-6 h-6 rounded-full bg-green-500 border-2 border-green-600" />
          </div>
        </div>
      </div>

      <!-- Transfer Details Section -->
      <div
        v-if="quote"
        class="bg-white rounded-lg border border-neutral-20 p-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Monto</label>
            <div class="px-4 py-3 bg-littio-secondary-sky/10 rounded border border-littio-secondary-sky/20">
              <span class="font-bold text-littio-secondary-sky">{{ formattedAmount }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Destinatario</label>
            <select
              v-model="selectedRecipient"
              class="w-full px-4 py-2 border border-neutral-40 rounded bg-white"
            >
              <option value="">Seleccionar destinatario</option>
              <option
                v-for="recipient in recipients"
                :key="recipient.id"
                :value="recipient.id"
              >
                {{
                  recipient.name ||
                    `${recipient.first_name || ''} ${recipient.last_name || ''} ${recipient.quinche || ''}`
                }}
                ({{ recipient.method || 'PSE' }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Comentario</label>
            <input
              v-model="reference"
              type="text"
              class="w-full px-4 py-2 border border-neutral-40 rounded"
              placeholder="Comentario"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <select class="w-full px-4 py-2 border border-neutral-40 rounded bg-white">
              <option value="">Seleccionar...</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-80 mb-2">Tasa Manual</label>
            <div class="flex gap-2">
              <input
                v-model="manualRate"
                type="text"
                class="flex-1 px-4 py-2 border border-neutral-40 rounded"
                placeholder="0,00"
              />
              <select class="px-4 py-2 border border-neutral-40 rounded bg-white">
                <option>US$</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              :disabled="!canCreatePayout || isCreatingPayout"
              class="px-6 py-3 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/80 disabled:opacity-50 font-medium"
              @click="createPayout"
            >
              {{ isCreatingPayout ? 'Procesando...' : 'Monetizar y enviar fondos' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Registro de Transacciones Tab Content -->
    <div
      v-if="activeTab === 'transactions'"
      class="bg-white rounded-lg border border-neutral-20 p-6"
    >
      <h3 class="text-lg font-semibold mb-4">Registro de Transacciones</h3>
      <p class="text-neutral-60">Funcionalidad en desarrollo...</p>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-carmine-light border border-carmine rounded p-4"
    >
      <p class="text-carmine font-bold">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { $user } from '../../stores/auth-store';
import { cassandraApi } from '../../stores/common/api-client';

defineProps<{
  lang: string;
}>();

const user = useStore($user);
const activeTab = ref<'transfer' | 'transactions'>('transfer');
const selectedAccount = ref('B2B');
const balance = ref('10.00');
const selectedCurrency = ref('USDC');
const quoteAmount = ref('');
const fromCurrency = ref('USD');
const toCurrency = ref('COP');
const quote = ref<any>(null);
const isLoadingQuote = ref(false);
const recipients = ref<any[]>([]);
const selectedRecipient = ref('');
const reference = ref('');
const manualRate = ref('0,00');
const error = ref('');
const isCreatingPayout = ref(false);

const formattedAmount = computed(() => {
  if (!quote.value) return '$ 0,00';
  return `$ ${quote.value.quote_amount?.toLocaleString('es-CO') || '0,00'}`;
});

const formattedRate = computed(() => {
  if (!quote.value) return '$ 0,00';
  return `$ ${quote.value.rate?.toLocaleString('es-CO') || '0,00'}`;
});

const expirationDate = computed(() => {
  if (!quote.value?.expiration_ts_utc) return 'N/A';
  const date = new Date(quote.value.expiration_ts_utc);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
});

const canCreatePayout = computed(() => {
  return quote.value && selectedRecipient.value && reference.value;
});

const getQuote = async () => {
  if (!quoteAmount.value) {
    error.value = 'Por favor ingrese un monto';
    return;
  }

  isLoadingQuote.value = true;
  error.value = '';

  try {
    const response = await cassandraApi.get('/v1/payouts/account/pay/quote', {
      params: {
        base_currency: fromCurrency.value,
        quote_currency: toCurrency.value,
        amount: parseFloat(quoteAmount.value.replace(',', '.')),
        amount_is_to_currency: false,
      },
    });

    quote.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Error obteniendo cotización';
    console.error('Quote error:', err);
  } finally {
    isLoadingQuote.value = false;
  }
};

const createPayout = async () => {
  if (!canCreatePayout.value) return;

  isCreatingPayout.value = true;
  error.value = '';

  try {
    const payoutData = {
      recipient_id: selectedRecipient.value,
      wallet_id: quote.value.wallet_id || '',
      reference: reference.value,
      quote_id: quote.value.quote_id,
      base_currency: fromCurrency.value,
      quote_currency: toCurrency.value,
      amount: parseFloat(quoteAmount.value.replace(',', '.')),
      amount_is_to_currency: false,
    };

    await cassandraApi.post('/v1/payouts/account/pay/payout', payoutData);

    // Success - reset form
    quote.value = null;
    quoteAmount.value = '';
    selectedRecipient.value = '';
    reference.value = '';
    error.value = '';
    alert('Payout creado exitosamente');
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Error creando payout';
    console.error('Payout error:', err);
  } finally {
    isCreatingPayout.value = false;
  }
};

onMounted(async () => {
  // Load recipients
  try {
    // Get user_id from Firebase user
    const user_id = user.value?.uid || '';
    if (!user_id) {
      console.warn('No user ID available');
      return;
    }

    const response = await cassandraApi.get('/v1/payouts/account/pay/recipient', {
      params: {
        user_id: user_id,
      },
    });
    recipients.value = response.data.recipients || [];
  } catch (err) {
    console.error('Error loading recipients:', err);
  }
});
</script>
