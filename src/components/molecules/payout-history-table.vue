<template>
  <div class="bg-white rounded-lg border border-neutral-20 shadow-md overflow-hidden">
    <div class="p-4 border-b border-neutral-20 bg-neutral-10/30">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-neutral-80">Historial de Transacciones</h3>
        <button
          class="px-4 py-2 text-sm font-medium text-neutral-70 bg-white border border-neutral-40 rounded-lg hover:bg-neutral-20 transition-colors"
          @click="$emit('refresh')"
        >
          <div class="flex items-center gap-2">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </div>
        </button>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-neutral-70 mb-1">Filtrar por ID</label>
          <input
            v-model="filterId"
            type="text"
            placeholder="Buscar por ID..."
            class="w-full px-3 py-2 border border-neutral-40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-neutral-70 mb-1">Filtrar por Fecha</label>
          <div class="relative">
            <input
              v-model="filterDateDisplay"
              type="text"
              placeholder="aaaa-mm-dd"
              readonly
              class="w-full px-3 py-2 border border-neutral-40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky cursor-pointer"
              @click="openDatePicker"
            />
            <input
              ref="datePickerInput"
              v-model="filterDate"
              type="date"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              @change="updateDateDisplay"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-60 hover:text-neutral-80 transition-colors cursor-pointer"
              @click="openDatePicker"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner
      v-if="isLoading && payouts.length === 0"
      message="Cargando historial de payouts..."
    />

    <div
      v-else
      class="overflow-x-auto overflow-y-auto"
      style="max-height: 450px"
    >
      <table class="w-full">
        <thead class="sticky top-0 z-10">
          <tr class="border-b bg-neutral-20/30">
            <th class="text-left p-4 font-semibold text-sm text-neutral-80 cursor-pointer hover:bg-neutral-30/50">
              <div class="flex items-center gap-1">
                ID
                <span class="text-neutral-50">↑↓</span>
              </div>
            </th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80">Provider</th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80 cursor-pointer hover:bg-neutral-30/50">
              <div class="flex items-center gap-1">
                Creado
                <span class="text-neutral-50">↑↓</span>
              </div>
            </th>
            <th class="text-right p-4 font-semibold text-sm text-neutral-80 cursor-pointer hover:bg-neutral-30/50">
              <div class="flex items-center justify-end gap-1">
                Tasa
                <span class="text-neutral-50">↑↓</span>
              </div>
            </th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80">Moneda Inicial</th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80">Moneda Final</th>
            <th class="text-right p-4 font-semibold text-sm text-neutral-80">Monto Inicial</th>
            <th class="text-right p-4 font-semibold text-sm text-neutral-80">Monto Final</th>
            <th class="text-center p-4 font-semibold text-sm text-neutral-80">Estado</th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80">Provider</th>
            <th class="text-left p-4 font-semibold text-sm text-neutral-80">Cuenta de Destino</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="filteredPayouts.length === 0 && !isLoading"
            class="border-b"
          >
            <td
              colspan="10"
              class="p-8 text-center text-neutral-60"
            >
              {{
                props.payouts.length === 0
                  ? 'No hay payouts disponibles'
                  : 'No se encontraron resultados con los filtros aplicados'
              }}
            </td>
          </tr>
          <tr
            v-for="payout in filteredPayouts"
            :key="payout.id"
            class="border-b border-neutral-10 hover:bg-neutral-20/20 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-neutral-80 font-mono">{{ formatId(payout.id) }}</span>
                <button
                  class="text-neutral-60 hover:text-neutral-80 transition-colors"
                  @click="copyToClipboard(payout.id)"
                  title="Copiar ID completo"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </td>

            <td class="p-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  getProviderBadgeClass(payout.provider),
                ]"
              >
                {{ formatProvider(payout.provider) }}
              </span>
            </td>

            <td class="p-4 text-sm text-neutral-70">
              {{ formatDate(payout.created_at) }}
            </td>

            <td class="p-4 text-right text-sm text-neutral-70">
              {{ formatAmount(payout.rate) }}
            </td>

            <td class="p-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  getCurrencyBadgeClass(payout.initial_currency),
                ]"
              >
                {{ payout.initial_currency }}
              </span>
            </td>

            <td class="p-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  getCurrencyBadgeClass(payout.final_currency),
                ]"
              >
                {{ payout.final_currency }}
              </span>
            </td>

            <td class="p-4 text-right text-sm text-neutral-80 font-medium">
              {{ formatAmount(payout.initial_amount) }}
            </td>

            <td class="p-4 text-right text-sm text-neutral-80 font-medium">
              {{ formatAmount(payout.final_amount) }}
            </td>

            <td class="p-4 text-center">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  getStatusBadgeClass(payout.status),
                ]"
              >
                {{ payout.status }}
              </span>
            </td>

            <td class="p-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-neutral-70">{{ getDestinationAccount(payout) }}</span>
                <button
                  class="text-neutral-60 hover:text-neutral-80 transition-colors"
                  @click="copyToClipboard(getDestinationAccount(payout))"
                  title="Copiar cuenta de destino"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="copyMessage"
      :class="[
        'mx-4 mb-4 rounded-lg p-3 text-sm',
        copyMessageType === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800',
      ]"
    >
      {{ copyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import type { PayoutHistoryItem } from '../../services/api/monetizacion/types';

const props = defineProps<{
  payouts: PayoutHistoryItem[];
  isLoading?: boolean;
}>();

defineEmits<{
  refresh: [];
}>();

const copyMessage = ref<string>('');
const copyMessageType = ref<'success' | 'error'>('success');
const filterId = ref<string>('');
const filterDate = ref<string>('');
const filterDateDisplay = ref<string>('');
const datePickerInput = ref<HTMLInputElement | null>(null);

watch(filterDate, (newValue) => {
  filterDateDisplay.value = newValue;
});

const updateDateDisplay = () => {
  if (filterDate.value) {
    filterDateDisplay.value = filterDate.value;
  }
};

const openDatePicker = () => {
  if (datePickerInput.value) {
    datePickerInput.value.showPicker?.();
  }
};

const filteredPayouts = computed(() => {
  let filtered = [...props.payouts];

  if (filterId.value.trim()) {
    const searchId = filterId.value.trim().toLowerCase();
    filtered = filtered.filter((payout) => payout.id.toLowerCase().includes(searchId));
  }

  if (filterDate.value) {
    const [filterYear, filterMonth, filterDay] = filterDate.value.split('-').map(Number);
    const filterMonthIndex = filterMonth - 1;

    filtered = filtered.filter((payout) => {
      try {
        const payoutDate = new Date(payout.created_at);
        const payoutYear = payoutDate.getFullYear();
        const payoutMonth = payoutDate.getMonth();
        const payoutDay = payoutDate.getDate();

        return payoutYear === filterYear && payoutMonth === filterMonthIndex && payoutDay === filterDay;
      } catch (error) {
        console.error('Error parsing date:', payout.created_at, error);
        return false;
      }
    });
  }

  return filtered;
});

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copyMessage.value = 'ID copiado al portapapeles';
    copyMessageType.value = 'success';
    setTimeout(() => {
      copyMessage.value = '';
    }, 2000);
  } catch {
    copyMessage.value = 'Error al copiar';
    copyMessageType.value = 'error';
    setTimeout(() => {
      copyMessage.value = '';
    }, 2000);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  const displayHours = hours % 12 || 12;
  return `${year}-${month}-${day}, ${displayHours}:${minutes} ${ampm}`;
};

const formatId = (id: string) => {
  if (id.length > 20) {
    return `${id.substring(0, 20)}...`;
  }
  return id;
};

const formatAmount = (amount: string) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(num);
};

const getStatusBadgeClass = (status: string) => {
  const statusUpper = status.toUpperCase();
  if (statusUpper === 'PROCESSING' || statusUpper === 'PENDING') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (statusUpper === 'COMPLETED' || statusUpper === 'SUCCESS') {
    return 'bg-green-100 text-green-800';
  }
  if (statusUpper === 'FAILED' || statusUpper === 'ERROR') {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-neutral-100 text-neutral-800';
};

const getCurrencyBadgeClass = (currency: string) => {
  const currencyUpper = currency.toUpperCase();
  if (currencyUpper === 'USD' || currencyUpper === 'USDT' || currencyUpper === 'USDC') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (currencyUpper === 'COP') {
    return 'bg-green-100 text-green-800';
  }
  if (currencyUpper === 'BRL') {
    return 'bg-blue-100 text-blue-800';
  }
  if (currencyUpper === 'MXN') {
    return 'bg-purple-100 text-purple-800';
  }
  if (currencyUpper === 'ARS') {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-neutral-100 text-neutral-800';
};

const formatProvider = (provider: string) => {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
};

const getProviderBadgeClass = (provider: string) => {
  const providerLower = provider.toLowerCase();
  if (providerLower === 'kira') {
    return 'bg-blue-100 text-blue-800';
  }
  if (providerLower === 'cobre') {
    return 'bg-orange-100 text-orange-800';
  }
  if (providerLower === 'supra') {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-neutral-100 text-neutral-800';
};

const getDestinationAccount = (payout: PayoutHistoryItem): string => {
  if (payout.additional_data) {
    const accountNumber = (payout.additional_data as any)?.account_number;
    const bankName = (payout.additional_data as any)?.bank_name || (payout.additional_data as any)?.bank;
    if (accountNumber) {
      const last4 = accountNumber.toString().slice(-4);
      return bankName ? `${bankName} ****${last4}` : `****${last4}`;
    }
  }
  if (payout.provider_external_id) {
    return payout.provider_external_id;
  }
  return '-';
};
</script>
