<template>
  <div class="space-y-8">
    <!-- Title Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Movimientos Internos</h1>
      <p class="text-base text-neutral-60">Gestión de movimientos apificados y no apificados</p>
    </div>

    <!-- Main Tabs: Apificados / No Apificados -->
    <BackOfficeTabs
      :active-tab="activeMainTab"
      :tabs="mainTabs"
      @update:active-tab="handleMainTabChange"
    />

    <!-- Content based on main tab -->
    <div
      v-if="activeMainTab === 'applied'"
      class="space-y-6"
    >
      <!-- Sub-tabs for Applied Movements -->
      <BackOfficeTabs
        :active-tab="activeSubTab"
        :tabs="appliedSubTabs"
        @update:active-tab="handleSubTabChange"
      />

      <!-- Sub-tab Content -->
      <FireblocksDashboardTab
        v-if="activeSubTab === 'dashboard'"
        @move-funds="handleMoveFunds"
      />

      <MoveFundsTab
        v-if="activeSubTab === 'move-funds'"
        :wallet-id="selectedWalletId"
        :wallet-name="selectedWalletName"
        :wallet-balance="selectedWalletBalance"
        :wallet-token="selectedWalletToken"
      />
    </div>

    <NonAppliedMovementsTab v-if="activeMainTab === 'non-applied'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackOfficeTabs from '../molecules/back-office-tabs.vue';
import FireblocksDashboardTab from './fireblocks-dashboard-tab.vue';
import MoveFundsTab from './move-funds-tab.vue';
import NonAppliedMovementsTab from './non-applied-movements-tab.vue';

defineProps<{
  lang: string;
}>();

// Main tabs: Apificados / No Apificados
const activeMainTab = ref<'applied' | 'non-applied'>('applied');

const mainTabs = [
  { value: 'applied', label: 'Movimientos Apificados (Fireblocks)' },
  { value: 'non-applied', label: 'Movimientos No Apificados' },
];

// Sub-tabs for Applied Movements
const activeSubTab = ref<'dashboard' | 'move-funds'>('dashboard');

const appliedSubTabs = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'move-funds', label: 'Mover fondos' },
];

// Move funds state
const selectedWalletId = ref<string | null>(null);
const selectedWalletName = ref<string>('');
const selectedWalletBalance = ref<string>('');
const selectedWalletToken = ref<string | null>(null);

const handleMainTabChange = (tab: string) => {
  activeMainTab.value = tab as 'applied' | 'non-applied';
  // Reset sub-tab when switching main tabs
  if (activeMainTab.value === 'applied') {
    activeSubTab.value = 'dashboard';
  }
};

const handleSubTabChange = (tab: string) => {
  activeSubTab.value = tab as 'dashboard' | 'move-funds';
};

const handleMoveFunds = (payload: { walletId: string; walletName: string; balance: string; token: string | null }) => {
  selectedWalletId.value = payload.walletId;
  selectedWalletName.value = payload.walletName;
  selectedWalletBalance.value = payload.balance;
  selectedWalletToken.value = payload.token;
  activeSubTab.value = 'move-funds';
};
</script>
