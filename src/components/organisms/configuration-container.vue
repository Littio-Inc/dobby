<template>
  <div class="space-y-8">
    <!-- Title Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Configuración</h1>
      <p class="text-base text-neutral-60">Gestión de recipients, wallets blockchain y webhooks</p>
    </div>

    <!-- Main Tabs -->
    <BackOfficeTabs
      :active-tab="activeTab"
      :tabs="tabs"
      @update:active-tab="handleTabChange"
    />

    <!-- Content based on active tab -->
    <div class="space-y-6">
      <RecipientsTab v-if="activeTab === 'recipients'" />
      <BlockchainWalletsTab v-if="activeTab === 'blockchain-wallets'" />
      <WebhooksTab v-if="activeTab === 'webhooks'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackOfficeTabs from '../molecules/back-office-tabs.vue';
import RecipientsTab from './recipients-tab.vue';
import BlockchainWalletsTab from './blockchain-wallets-tab.vue';
import WebhooksTab from './webhooks-tab.vue';

defineProps<{
  lang: string;
}>();

const activeTab = ref<'recipients' | 'blockchain-wallets' | 'webhooks'>('recipients');

const tabs = [
  { value: 'recipients', label: 'Recipients' },
  { value: 'blockchain-wallets', label: 'Blockchain Wallets' },
  { value: 'webhooks', label: 'Webhooks' },
];

const handleTabChange = (tab: string) => {
  activeTab.value = tab as 'recipients' | 'blockchain-wallets' | 'webhooks';
};
</script>
