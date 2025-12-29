<template>
  <div class="space-y-6">
    <PayoutHistoryTable
      :payouts="payouts"
      :is-loading="isLoading"
      @refresh="loadPayoutHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import PayoutHistoryTable from '../molecules/payout-history-table.vue';
import { getPayoutHistory, type PayoutHistoryItem } from '../../services';

const props = defineProps<{
  account: 'transfer' | 'pay';
}>();

const payouts = ref<PayoutHistoryItem[]>([]);
const isLoading = ref(false);

const loadPayoutHistory = async () => {
  isLoading.value = true;
  try {
    const response = await getPayoutHistory(props.account);
    if (response.status === 'success' && response.data) {
      payouts.value = response.data;
    } else {
      payouts.value = [];
    }
  } catch (error: any) {
    console.error('Error loading payout history:', error);
    payouts.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Cargar historial al montar
onMounted(() => {
  loadPayoutHistory();
});

// Recargar historial cuando cambie el account (tab activo)
watch(
  () => props.account,
  () => {
    loadPayoutHistory();
  },
);
</script>
