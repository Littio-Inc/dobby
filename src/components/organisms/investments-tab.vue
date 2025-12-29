<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4 pb-4 border-b border-neutral-20">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-neutral-80 mb-1">Inversiones OpenTrade</h2>
        <p class="text-sm text-neutral-60">
          Gestiona inversiones en vaults de OpenTrade de forma controlada y trazable.
        </p>
      </div>
    </div>

    <BackOfficeTabs
      :active-tab="activeTab"
      :tabs="tabs"
      @update:active-tab="handleTabChange"
    />

    <div
      v-if="activeTab === 'vaults'"
      class="space-y-6"
    >
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 text-neutral-60">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              ></path>
            </svg>
          </div>
          <p class="text-sm text-neutral-60">Portafolio Balance</p>
        </div>
        <div class="space-y-2">
          <p class="text-2xl font-bold text-neutral-80">
            $3.125.000 <span class="text-base font-normal text-neutral-60">USDC</span>
          </p>
          <p class="text-2xl font-bold text-neutral-80">
            €430.000 <span class="text-base font-normal text-neutral-60">EURC</span>
          </p>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 text-neutral-60">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              ></path>
            </svg>
          </div>
          <p class="text-sm text-neutral-60">APY Promedio</p>
        </div>
        <div class="space-y-1">
          <p class="text-3xl font-bold text-green-600">3.28%</p>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 text-neutral-60">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              ></path>
            </svg>
          </div>
          <p class="text-sm text-neutral-60">Vaults Activos</p>
        </div>
        <div class="space-y-1">
          <p class="text-3xl font-bold text-neutral-80">8</p>
        </div>
      </div>
    </div>

      <div class="space-y-4">
        <h3 class="text-xl font-bold text-neutral-80">Vaults Disponibles</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="vault in vaults"
            :key="vault.id"
            class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4"
          >
            <div class="space-y-1">
              <h4 class="text-lg font-bold text-neutral-80">{{ vault.title }}</h4>
              <p class="text-xs text-neutral-60">{{ vault.category }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in vault.tags"
                :key="tag"
                class="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-10 text-neutral-70 border border-neutral-20"
              >
                {{ tag }}
              </span>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-neutral-60">{{ vault.apyLabel }}</p>
              <p class="text-xl font-bold text-neutral-80">{{ vault.apy }}</p>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-neutral-60">Token del Vault</p>
              <p class="text-base font-semibold text-neutral-80">{{ vault.vaultToken }}</p>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-neutral-60">My Principal Earning Interest</p>
              <p class="text-base font-semibold text-neutral-80">{{ vault.principalEarning }}</p>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-neutral-60">Tokens en Vault</p>
              <p class="text-base font-semibold text-neutral-80">{{ vault.tokensInVault }}</p>
            </div>

            <div class="flex gap-2 pt-2">
              <button
                disabled
                class="flex-1 px-4 py-2 bg-littio-secondary-sky text-white rounded-lg font-medium hover:bg-littio-secondary-sky/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleInvest(vault.id)"
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
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                Invertir
              </button>
              <button
                disabled
                class="flex-1 px-4 py-2 border border-neutral-40 bg-white text-neutral-80 rounded-lg font-medium hover:bg-neutral-20/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleDivest(vault.id)"
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
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                Desinvertir
              </button>
              <button
                class="px-3 py-2 border border-neutral-40 bg-white text-neutral-80 rounded-lg hover:bg-neutral-20/20 transition-colors flex items-center justify-center"
                @click="handleViewDetails(vault.id)"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <UnifiedMovementsTable
        provider="open_trade"
        movement-type="internal"
      />
    </div>

    <div
      v-if="activeTab === 'history'"
      class="space-y-4"
    >
      <UnifiedMovementsTable
        provider="open_trade"
        movement-type="internal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackOfficeTabs from '../molecules/back-office-tabs.vue';
import UnifiedMovementsTable from '../molecules/unified-movements-table.vue';

const activeTab = ref<'vaults' | 'history'>('vaults');

const tabs = [
  { value: 'vaults', label: 'Vaults Disponibles' },
  { value: 'history', label: 'Historial de Operaciones' },
];

const handleTabChange = (tab: string) => {
  activeTab.value = tab as 'vaults' | 'history';
};

interface Vault {
  id: string;
  title: string;
  category: string;
  tags: string[];
  apy: string;
  apyLabel: string;
  vaultToken: string;
  principalEarning: string;
  tokensInVault: string;
}

const vaults: Vault[] = [
  {
    id: '1',
    title: 'Flexible Term USDC Vault AVAX',
    category: 'Money Market / Liquidity',
    tags: ['USDC', 'Avalanche', 'v4.0', 'Flexible'],
    apy: '3.55%',
    apyLabel: 'Indicative APY',
    vaultToken: 'FTUSDC',
    principalEarning: '125,000.00 USDC',
    tokensInVault: '125.000 FTUSDC',
  },
  {
    id: '2',
    title: 'Franklin Templeton Benji MMF Vault',
    category: 'Tokenized Money Market Fund',
    tags: ['USDC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: '3.35%',
    apyLabel: 'Indicative APY',
    vaultToken: 'BENJI',
    principalEarning: '250,000.00 USDC',
    tokensInVault: '250.000 BENJI',
  },
  {
    id: '3',
    title: 'USDC Liquidity Vault 1',
    category: 'Liquidity Vault',
    tags: ['USDC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: 'Variable',
    apyLabel: 'APY',
    vaultToken: 'USDCLV1',
    principalEarning: '1,500,000.00 USDC',
    tokensInVault: '1.500.000 USDCLV1',
  },
  {
    id: '4',
    title: 'USDC Liquidity Vault 2',
    category: 'Liquidity Vault',
    tags: ['USDC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: 'Variable',
    apyLabel: 'APY',
    vaultToken: 'USDCLV2',
    principalEarning: '0.00 USDC',
    tokensInVault: '0.00 USDCLV2',
  },
  {
    id: '5',
    title: 'USDC Money Market Fund (Fidelity) V5 Vault',
    category: 'Tokenized Money Market Fund',
    tags: ['USDC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: '3.55%',
    apyLabel: 'Indicative APY',
    vaultToken: 'FMMF',
    principalEarning: '500,000.00 USDC',
    tokensInVault: '500.000 FMMF',
  },
  {
    id: '6',
    title: 'Diversified Fixed Income Strategy',
    category: 'Fixed Income Strategy',
    tags: ['USDC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: '4.22%',
    apyLabel: 'Indicative APY',
    vaultToken: 'XDFIS',
    principalEarning: '750,000.00 USDC',
    tokensInVault: '750.000 XDFIS',
  },
  {
    id: '7',
    title: 'EURC Liquidity Vault 1',
    category: 'Liquidity Vault',
    tags: ['EURC', 'Avalanche', 'v5.0', 'Flexible'],
    apy: 'Variable',
    apyLabel: 'APY',
    vaultToken: 'EURCLV1',
    principalEarning: '350,000.00 EURC',
    tokensInVault: '350.000 EURCLV1',
  },
  {
    id: '8',
    title: 'Flexible Term EURC Vault (AVAX)',
    category: 'Money Market / Liquidity',
    tags: ['EURC', 'Avalanche', 'v4.0', 'Flexible'],
    apy: '1.73%',
    apyLabel: 'APY',
    vaultToken: 'FTEURC',
    principalEarning: '80,000.00 EURC',
    tokensInVault: '80.000 FTEURC',
  },
];

const handleInvest = (vaultId: string) => {
  console.log('Invest in vault:', vaultId);
};

const handleDivest = (vaultId: string) => {
  console.log('Divest from vault:', vaultId);
};

const handleViewDetails = (vaultId: string) => {
  console.log('View details for vault:', vaultId);
};
</script>
