<template>
  <div class="space-y-4">
    <h3 class="text-xl font-bold text-neutral-80">{{ title }}</h3>

    <ErrorMessage :message="transactionsError" />

    <!-- Copy feedback message -->
    <div
      v-if="copyMessage"
      :class="[
        'rounded-lg p-3 text-sm',
        copyMessageType === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800',
      ]"
    >
      {{ copyMessage }}
    </div>

    <div class="bg-white rounded-lg border border-neutral-20 overflow-hidden">
      <LoadingSpinner
        v-if="isLoadingTransactions && transactions.length === 0"
        message="Cargando transacciones..."
      />
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full">
          <thead class="bg-neutral-10 border-b border-neutral-20">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">ST ID</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                <div class="flex items-center gap-1">
                  Fecha
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                <div class="flex items-center gap-1">
                  Tipo
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                <div class="flex items-center gap-1">
                  Proveedor
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Método</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                <div class="flex items-center justify-end gap-1">
                  Monto
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th
                v-if="showFees"
                class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider"
              >
                Fees
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Rate</th>
              <th
                v-if="showHash"
                class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider"
              >
                Hash
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-20">
            <tr
              v-if="transactions.length === 0 && !isLoadingTransactions"
              class="hover:bg-neutral-10"
            >
              <td
                :colspan="getTotalColumns()"
                class="px-6 py-8 text-center text-neutral-60"
              >
                No hay transacciones disponibles
              </td>
            </tr>
            <tr
              v-for="transaction in transactions"
              :key="transaction.id"
              class="hover:bg-neutral-10"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-neutral-80">{{ transaction.st_id || transaction.id.substring(0, 8) }}</span>
                  <button
                    class="text-neutral-60 hover:text-neutral-80"
                    @click="copyToClipboard(transaction.st_id || transaction.id)"
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ formatDate(transaction.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    getTypeBadgeColorForTransaction(transaction.type),
                  ]"
                >
                  {{ transaction.type.toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ transaction.provider.toUpperCase() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="['px-2 py-1 rounded-full text-xs font-semibold', getMethodBadgeColor(transaction.method)]"
                >
                  {{ transaction.method ? transaction.method.toUpperCase() : '-' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    getStatusBadgeColor(getTransactionStatus(transaction)),
                  ]"
                >
                  {{ getTransactionStatusDisplay(transaction) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <span class="text-sm font-medium text-neutral-80">{{ formatNumber(transaction.amount) }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      getTokenBadgeColor(transaction.currency) || 'bg-neutral-100 text-neutral-700',
                    ]"
                  >
                    {{ transaction.currency }}
                  </span>
                </div>
              </td>
              <td
                v-if="showFees"
                class="px-6 py-4 whitespace-nowrap text-right"
              >
                <div
                  v-if="transaction.fees && parseFloat(transaction.fees) > 0"
                  class="flex items-center justify-end gap-2"
                >
                  <span class="text-sm text-neutral-80">{{ formatNumber(transaction.fees) }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      getTokenBadgeColor(transaction.currency) || 'bg-neutral-100 text-neutral-700',
                    ]"
                  >
                    {{ transaction.currency }}
                  </span>
                </div>
                <span
                  v-else
                  class="text-sm text-neutral-60"
                  >-</span
                >
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ formatRate(transaction.rate) }}
              </td>
              <td
                v-if="showHash"
                class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80"
              >
                {{ transaction.st_hash || transaction.transfer_id || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginación -->
      <div
        v-if="transactions.length > 0"
        class="px-6 py-4 border-t border-neutral-20 flex items-center justify-between"
      >
        <div class="text-sm text-neutral-60">
          Mostrando {{ (currentPage - 1) * limit + 1 }}-{{ Math.min(currentPage * limit, totalCount) }} de
          {{ totalCount }}
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 1"
            :class="[
              'px-3 py-1 rounded text-sm',
              currentPage === 1 ? 'text-neutral-40 cursor-not-allowed' : 'text-neutral-80 hover:bg-neutral-10',
            ]"
            @click="handlePageChange(currentPage - 1)"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span class="text-sm text-neutral-80">Página {{ currentPage }} de {{ totalPages }}</span>
          <button
            :disabled="currentPage === totalPages"
            :class="[
              'px-3 py-1 rounded text-sm',
              currentPage === totalPages ? 'text-neutral-40 cursor-not-allowed' : 'text-neutral-80 hover:bg-neutral-10',
            ]"
            @click="handlePageChange(currentPage + 1)"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AzkabanService, type BackofficeTransaction } from '../../services/api';
import { getTokenBadgeColor } from '../../utils/token-badge-colors';
import ErrorMessage from '../atoms/error-message.vue';
import LoadingSpinner from '../atoms/loading-spinner.vue';

interface Props {
  provider?: string;
  excludeProvider?: string;
  movementType?: string;
  title?: string;
  showFees?: boolean;
  showHash?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  provider: undefined,
  excludeProvider: undefined,
  movementType: undefined,
  title: 'Movimientos Unificados',
  showFees: true,
  showHash: false,
});

const getTotalColumns = () => {
  return props.showFees ? (props.showHash ? 10 : 9) : props.showHash ? 9 : 8;
};

// Estados para transacciones de backoffice
const transactions = ref<BackofficeTransaction[]>([]);
const isLoadingTransactions = ref(false);
const transactionsError = ref<string | null>(null);
const currentPage = ref(1);
const totalCount = ref(0);
const limit = ref(10);
const copyMessage = ref<string | null>(null);
const copyMessageType = ref<'success' | 'error'>('success');
let requestId = 0;

const loadTransactions = async (page: number = 1) => {
  // Increment request ID to track the latest request
  const currentRequestId = ++requestId;
  isLoadingTransactions.value = true;
  transactionsError.value = null;

  try {
    const params: {
      provider?: string;
      exclude_provider?: string;
      movement_type?: string;
      page: number;
      limit: number;
    } = {
      page,
      limit: limit.value,
    };

    if (props.provider) {
      params.provider = props.provider;
    }

    if (props.excludeProvider) {
      params.exclude_provider = props.excludeProvider;
    }

    if (props.movementType) {
      params.movement_type = props.movementType;
    }

    const response = await AzkabanService.getBackofficeTransactions(params);

    // Ignore stale responses (if a newer request was made)
    if (currentRequestId !== requestId) {
      return;
    }

    transactions.value = response.transactions;
    totalCount.value = response.total_count;
    currentPage.value = response.page;
  } catch (err: any) {
    // Ignore stale responses (if a newer request was made)
    if (currentRequestId !== requestId) {
      return;
    }

    console.error('[UnifiedMovementsTable] Error loading transactions:', err);
    // Normalize error messages: prefer server-provided messages
    const errorMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Error al cargar las transacciones';
    transactionsError.value = errorMessage;
    transactions.value = [];
  } finally {
    if (currentRequestId === requestId) {
      isLoadingTransactions.value = false;
    }
  }
};

const handlePageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    loadTransactions(newPage);
  }
};

const totalPages = computed(() => {
  const l = Number(limit.value);
  if (isNaN(l) || l <= 0) {
    return 0;
  }
  return Math.ceil(totalCount.value / l);
});

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatNumber = (amount: string): string => {
  const numAmount = parseFloat(amount);
  if (!Number.isFinite(numAmount)) {
    return '--';
  }
  return numAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatRate = (rate: string | null | undefined): string => {
  if (!rate) return '-';
  const rateValue = parseFloat(rate);
  if (!Number.isFinite(rateValue) || isNaN(rateValue)) return '-';
  if (rateValue === 1.0 || rateValue === 1) return '-';
  if (rateValue <= 0) return '-';
  return rateValue.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

const getTransactionStatus = (transaction: BackofficeTransaction): string => {
  return transaction.status || 'completed';
};

const getTransactionStatusDisplay = (transaction: BackofficeTransaction): string => {
  const status = getTransactionStatus(transaction);
  return status.toUpperCase();
};

const getStatusBadgeColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('completed') || statusLower.includes('completado')) {
    return 'bg-green-100 text-green-700';
  }
  if (statusLower.includes('processing') || statusLower.includes('procesando')) {
    return 'bg-purple-100 text-purple-700';
  }
  if (statusLower.includes('failed') || statusLower.includes('fallido')) {
    return 'bg-red-100 text-red-700';
  }
  if (statusLower.includes('created') || statusLower.includes('creado')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (statusLower.includes('canceled') || statusLower.includes('cancelado')) {
    return 'bg-gray-200 text-gray-800';
  }
  if (statusLower.includes('pending') || statusLower.includes('pendiente')) {
    return 'bg-yellow-200 text-yellow-900';
  }
  return 'bg-neutral-100 text-neutral-700';
};

const getTypeBadgeColorForTransaction = (type: string): string => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('transfer')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (typeLower.includes('payment')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (typeLower.includes('swap')) {
    return 'bg-slate-100 text-slate-700';
  }
  if (typeLower.includes('deposit') || typeLower.includes('ingreso')) {
    return 'bg-green-100 text-green-700';
  }
  if (typeLower.includes('withdrawal') || typeLower.includes('retiro')) {
    return 'bg-orange-100 text-orange-700';
  }
  return 'bg-neutral-100 text-neutral-700';
};

const getMethodBadgeColor = (method: string | undefined): string => {
  if (!method) return 'bg-neutral-100 text-neutral-700';
  const methodLower = method.toLowerCase();
  if (methodLower.includes('transfer_in') || methodLower === 'transfer_in') {
    return 'bg-green-100 text-green-700';
  }
  if (methodLower.includes('transfer_out') || methodLower === 'transfer_out') {
    return 'bg-orange-100 text-orange-700';
  }
  if (methodLower.includes('swap_in') || methodLower === 'swap_in') {
    return 'bg-slate-600 text-white';
  }
  if (methodLower.includes('swap_out') || methodLower === 'swap_out') {
    return 'bg-slate-600 text-white';
  }
  if (methodLower.includes('payment') || methodLower === 'payment') {
    return 'bg-blue-600 text-white';
  }
  if (methodLower.includes('withdrawal') || methodLower === 'withdrawal') {
    return 'bg-red-100 text-red-700';
  }
  if (methodLower.includes('transfer')) {
    return 'bg-purple-100 text-purple-700';
  }
  return 'bg-neutral-100 text-neutral-700';
};

const showCopyMessage = (message: string, type: 'success' | 'error') => {
  copyMessage.value = message;
  copyMessageType.value = type;
  setTimeout(() => {
    copyMessage.value = null;
  }, 3000);
};

const copyToClipboard = async (text: string) => {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showCopyMessage('Copiado al portapapeles', 'success');
      return;
    } catch {
      // Fall through to DOM-based fallback
    }
  }

  // Fallback: DOM-based copy using textarea and execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      showCopyMessage('Copiado al portapapeles', 'success');
    } else {
      throw new Error('execCommand copy failed');
    }
  } catch {
    showCopyMessage('Error al copiar al portapapeles', 'error');
  }
};

onMounted(async () => {
  await loadTransactions(1);
});

// Exponer método para refrescar la tabla desde componentes padre
defineExpose({
  refresh: () => {
    loadTransactions(currentPage.value);
  },
});
</script>
