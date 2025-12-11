<template>
  <ExecuteMovementForm
    :wallet-id="walletId"
    :wallet-name="walletName"
    :wallet-balance="walletBalance"
    :wallet-token="walletToken"
  />
</template>

<script setup lang="ts">
import ExecuteMovementForm from './execute-movement-form.vue';

defineProps<{
  walletId: string | null;
  walletName: string;
  walletBalance: string;
  walletToken: string | null;
}>();
</script>
