<template>
  <div class="space-y-4">
    <h3 class="text-xl font-bold text-neutral-80">Movimientos Unificados</h3>

    <ErrorMessage :message="transactionsError" />

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
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                Categoría
              </th>
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
              <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider">Fees</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Rate</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Hash</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-20">
            <tr
              v-if="transactions.length === 0 && !isLoadingTransactions"
              class="hover:bg-neutral-10"
            >
              <td
                colspan="10"
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
                  :class="['px-2 py-1 rounded-full text-xs font-semibold', getCategoryBadgeColor(transaction.category)]"
                >
                  {{ transaction.category.toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2 py-1 rounded-full text-xs font-semibold', getStatusBadgeColor('completed')]">
                  COMPLETED
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
              <td class="px-6 py-4 whitespace-nowrap text-right">
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
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

// Estados para transacciones de backoffice
const transactions = ref<BackofficeTransaction[]>([]);
const isLoadingTransactions = ref(false);
const transactionsError = ref<string | null>(null);
const currentPage = ref(1);
const totalCount = ref(0);
const limit = ref(5); // 5 filas para probar el paginado

const loadTransactions = async (page: number = 1) => {
  isLoadingTransactions.value = true;
  transactionsError.value = null;

  try {
    const response = await AzkabanService.getBackofficeTransactions({
      provider: 'fireblocks',
      page,
      limit: limit.value,
    });

    transactions.value = response.transactions;
    totalCount.value = response.total_count;
    currentPage.value = response.page;
  } catch (err: any) {
    console.error('[UnifiedMovementsTable] Error loading transactions:', err);
    transactionsError.value = err.message || 'Error al cargar las transacciones';
    transactions.value = [];
  } finally {
    isLoadingTransactions.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    loadTransactions(newPage);
  }
};

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / limit.value);
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
  return numAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatRate = (rate: string | null | undefined): string => {
  if (!rate) return '-';
  const rateValue = parseFloat(rate);
  if (rateValue === 1.0 || rateValue === 1) return '-';
  if (rateValue <= 0) return '-';
  return rate;
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
  return 'bg-neutral-100 text-neutral-700';
};

const getTypeBadgeColorForTransaction = (type: string): string => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('transfer')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (typeLower.includes('deposit') || typeLower.includes('ingreso')) {
    return 'bg-green-100 text-green-700';
  }
  if (typeLower.includes('withdrawal') || typeLower.includes('retiro')) {
    return 'bg-orange-100 text-orange-700';
  }
  return 'bg-neutral-100 text-neutral-700';
};

const getCategoryBadgeColor = (category: string): string => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('transfer')) {
    return 'bg-purple-100 text-purple-700';
  }
  if (categoryLower.includes('settlement')) {
    return 'bg-indigo-100 text-indigo-700';
  }
  if (categoryLower.includes('deposit')) {
    return 'bg-green-100 text-green-700';
  }
  return 'bg-neutral-100 text-neutral-700';
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copiado al portapapeles:', text);
  } catch (err) {
    console.error('Error al copiar:', err);
  }
};

onMounted(async () => {
  await loadTransactions(1);
});
</script>
