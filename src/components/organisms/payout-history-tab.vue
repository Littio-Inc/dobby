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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import PayoutHistoryTable from '../molecules/payout-history-table.vue';
import { getPayoutHistory, type PayoutHistoryItem } from '../../services';

const props = defineProps<{
  account: 'transfer' | 'pay';
}>();

const payouts = ref<PayoutHistoryItem[]>([]);
const isLoading = ref(false);
let pollingInterval: ReturnType<typeof setInterval> | null = null;

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

const startPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(() => {
    if (isLoading.value) {
      return;
    }
    loadPayoutHistory();
  }, 60000);
};

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isLoading.value = false;
};

onMounted(() => {
  loadPayoutHistory();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

watch(
  () => props.account,
  () => {
    if (isLoading.value) {
      return;
    }
    stopPolling();
    loadPayoutHistory();
    startPolling();
  },
);

defineExpose({
  loadPayoutHistory,
});
</script>
