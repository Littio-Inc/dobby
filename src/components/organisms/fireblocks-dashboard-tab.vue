<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex items-start justify-between gap-4 pb-4 border-b border-neutral-20">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-neutral-80 mb-1">
          Dashboard de Saldos Fireblocks
        </h2>
        <p class="text-sm text-neutral-60">
          Resumen de saldos por token y desglose por wallet interna
        </p>
      </div>
      
      <!-- Real-time Status Module -->
      <div class="flex items-center gap-3 bg-white border border-neutral-20 rounded-lg px-4 py-3 shadow-sm">
        <div class="flex items-center gap-2">
          <div
            :class="[
              'h-2 w-2 rounded-full',
              isAutoRefreshActive ? 'bg-green-500 animate-pulse' : 'bg-neutral-40',
            ]"
          />
          <div class="text-sm">
            <p class="text-neutral-60 text-xs">Última actualización:</p>
            <p class="font-mono font-medium text-neutral-80">
              {{ lastUpdateTime }}
            </p>
          </div>
        </div>
        
        <div class="h-8 w-px bg-neutral-20" />
        
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 h-8 border border-neutral-20 rounded hover:bg-neutral-20/20 transition-colors flex items-center gap-1 text-sm"
            @click="toggleAutoRefresh"
          >
            <PlayIcon
              v-if="!isAutoRefreshActive"
              class="h-3 w-3"
            />
            <PauseIcon
              v-else
              class="h-3 w-3"
            />
            {{ isAutoRefreshActive ? 'Pausar' : 'Reanudar' }}
          </button>
          <button
            class="px-3 py-1.5 h-8 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-1 text-sm"
            @click="handleRefresh"
          >
            <ArrowPathIcon class="h-3 w-3" />
            Refrescar
          </button>
        </div>
      </div>
    </div>

    <!-- Balance Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4"
      >
        <!-- Token Header -->
        <div class="flex items-center justify-between">
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-semibold',
              token.badgeColor,
            ]"
          >
            {{ token.symbol }}
          </span>
          <div
            :class="[
              'flex items-center gap-1 text-sm font-semibold',
              token.change >= 0 ? 'text-green-600' : 'text-red-600',
            ]"
          >
            <ArrowUpIcon
              v-if="token.change >= 0"
              class="w-4 h-4"
            />
            <ArrowDownIcon
              v-else
              class="w-4 h-4"
            />
            {{ Math.abs(token.change).toFixed(2) }}%
          </div>
        </div>

        <!-- Balance -->
        <div class="space-y-1">
          <p class="text-3xl font-bold text-neutral-80">
            {{ formatBalance(token.balance) }}
          </p>
          <p class="text-sm text-neutral-60">
            {{ token.walletsCount }} wallets
          </p>
        </div>

        <!-- Action Button -->
        <button
          class="w-full px-4 py-2 border border-neutral-20 rounded hover:bg-neutral-20/20 transition-colors text-sm font-medium"
          @click="handleViewWallets(token.symbol)"
        >
          Ver wallets
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/vue/24/outline';

interface Token {
  symbol: string;
  balance: number;
  change: number;
  walletsCount: number;
  badgeColor: string;
}

// Datos quemados de Fireblocks (actualizados según la imagen)
const tokens = ref<Token[]>([
  {
    symbol: 'USDT',
    balance: 330000.0,
    change: 1.99,
    walletsCount: 7,
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    symbol: 'USDC',
    balance: 435000.0,
    change: -3.88,
    walletsCount: 7,
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    symbol: 'ETH',
    balance: 86.1,
    change: 4.87,
    walletsCount: 7,
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    symbol: 'DAI',
    balance: 185000.0,
    change: 2.19,
    walletsCount: 7,
    badgeColor: 'bg-orange-100 text-orange-700',
  },
]);

const lastUpdateTime = ref('14:50:57');
const isAutoRefreshActive = ref(true);
let updateInterval: ReturnType<typeof setInterval> | null = null;

const formatBalance = (balance: number): string => {
  if (balance >= 1000) {
    return balance.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return balance.toLocaleString('es-ES', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

const toggleAutoRefresh = () => {
  isAutoRefreshActive.value = !isAutoRefreshActive.value;
  if (isAutoRefreshActive.value && !updateInterval) {
    startUpdateInterval();
  } else if (!isAutoRefreshActive.value && updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
};

const handleRefresh = () => {
  const now = new Date();
  lastUpdateTime.value = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  // TODO: Implementar lógica de refresh de datos
};

const handleViewWallets = (symbol: string) => {
  // TODO: Implementar navegación a vista de wallets
  console.log('Ver wallets de', symbol);
};

const startUpdateInterval = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  updateInterval = setInterval(() => {
    if (isAutoRefreshActive.value) {
      const now = new Date();
      lastUpdateTime.value = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  }, 1000);
};

onMounted(() => {
  startUpdateInterval();
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
</script>

