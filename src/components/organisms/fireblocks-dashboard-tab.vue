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

    <!-- Wallets List Section -->
    <div class="space-y-4">
      <h3 class="text-xl font-bold text-neutral-80">
        Wallets Fireblocks
      </h3>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-60" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar wallet o proveedor..."
              class="w-full pl-10 pr-4 py-2.5 border border-neutral-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
            />
          </div>
        </div>
        <div class="flex gap-3">
          <select
            v-model="selectedType"
            class="px-4 py-2.5 border border-neutral-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent bg-white"
          >
            <option value="all">Todos los tipos</option>
            <option value="vault">Vault</option>
            <option value="otc">OTC</option>
            <option value="proveedor">Proveedor</option>
            <option value="operativa">Operativa</option>
          </select>
          <select
            v-model="selectedProvider"
            class="px-4 py-2.5 border border-neutral-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent bg-white"
          >
            <option value="all">Todas</option>
            <option value="supra">Supra</option>
            <option value="cobre">Cobre</option>
            <option value="kira">Kira</option>
            <option value="bridge">Bridge</option>
            <option value="koywe">Koywe</option>
          </select>
        </div>
      </div>

      <!-- Wallets Table -->
      <div class="bg-white rounded-lg border border-neutral-20 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-10 border-b border-neutral-20">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Tipo
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Blockchain
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Proveedor
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Balance ETH
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-20">
              <tr
                v-for="wallet in filteredWallets"
                :key="wallet.id"
                class="hover:bg-neutral-10 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div>
                      <p class="text-sm font-medium text-neutral-80">
                        {{ wallet.name }}
                      </p>
                      <div class="flex items-center gap-1 mt-1">
                        <p class="text-xs text-neutral-60">
                          {{ wallet.id }}
                        </p>
                        <button
                          class="text-neutral-60 hover:text-neutral-80 transition-colors"
                          @click="copyToClipboard(wallet.id)"
                          title="Copiar ID"
                        >
                          <DocumentDuplicateIcon class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-semibold',
                      getTypeBadgeColor(wallet.type),
                    ]"
                  >
                    {{ wallet.type }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-neutral-80">
                    {{ wallet.blockchain }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-neutral-80">
                    {{ wallet.provider || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-neutral-80">
                    {{ formatEthBalance(wallet.balanceEth) }} ETH
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    class="p-1.5 text-neutral-60 hover:text-neutral-80 hover:bg-neutral-20 rounded transition-colors"
                    @click="handleWalletActions(wallet.id)"
                    title="Más opciones"
                  >
                    <EllipsisVerticalIcon class="h-5 w-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';

interface Token {
  symbol: string;
  balance: number;
  change: number;
  walletsCount: number;
  badgeColor: string;
}

interface Wallet {
  id: string;
  name: string;
  type: 'Vault' | 'OTC' | 'Proveedor' | 'Operativa';
  blockchain: string;
  provider: string | null;
  balanceEth: number;
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

// Wallets data
const wallets = ref<Wallet[]>([
  {
    id: 'fb-vault-01',
    name: 'Vault Principal',
    type: 'Vault',
    blockchain: 'Ethereum',
    provider: null,
    balanceEth: 45.5,
  },
  {
    id: 'fb-otc-01',
    name: 'OTC Trading',
    type: 'OTC',
    blockchain: 'Ethereum',
    provider: null,
    balanceEth: 12.3,
  },
  {
    id: 'supra-wallet',
    name: 'Supra Wallet',
    type: 'Proveedor',
    blockchain: 'Polygon',
    provider: 'Supra',
    balanceEth: 5.2,
  },
  {
    id: 'cobre-wallet',
    name: 'Cobre Wallet',
    type: 'Proveedor',
    blockchain: 'Ethereum',
    provider: 'Cobre',
    balanceEth: 8.7,
  },
  {
    id: 'kira-wallet',
    name: 'Kira Wallet',
    type: 'Proveedor',
    blockchain: 'BSC',
    provider: 'Kira',
    balanceEth: 3.1,
  },
  {
    id: 'bridge-b2c',
    name: 'Bridge B2C',
    type: 'Operativa',
    blockchain: 'Arbitrum',
    provider: 'Bridge',
    balanceEth: 6.5,
  },
  {
    id: 'koywe-b2c',
    name: 'Koywe B2C',
    type: 'Operativa',
    blockchain: 'Polygon',
    provider: 'Koywe',
    balanceEth: 4.8,
  },
]);

// Search and filters
const searchQuery = ref('');
const selectedType = ref('all');
const selectedProvider = ref('all');

// Filtered wallets
const filteredWallets = computed(() => {
  return wallets.value.filter((wallet) => {
    const matchesSearch =
      searchQuery.value === '' ||
      wallet.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      wallet.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (wallet.provider &&
        wallet.provider.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesType =
      selectedType.value === 'all' ||
      wallet.type.toLowerCase() === selectedType.value.toLowerCase();

    const matchesProvider =
      selectedProvider.value === 'all' ||
      (wallet.provider &&
        wallet.provider.toLowerCase() === selectedProvider.value.toLowerCase()) ||
      (selectedProvider.value === 'all' && !wallet.provider);

    return matchesSearch && matchesType && matchesProvider;
  });
});

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

const getTypeBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    Vault: 'bg-blue-100 text-blue-700',
    OTC: 'bg-purple-100 text-purple-700',
    Proveedor: 'bg-green-100 text-green-700',
    Operativa: 'bg-orange-100 text-orange-700',
  };
  return colors[type] || 'bg-neutral-100 text-neutral-700';
};

const formatEthBalance = (balance: number): string => {
  return balance.toLocaleString('es-ES', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // TODO: Mostrar notificación de éxito
    console.log('Copiado al portapapeles:', text);
  } catch (err) {
    console.error('Error al copiar:', err);
  }
};

const handleWalletActions = (walletId: string) => {
  // TODO: Implementar menú de acciones
  console.log('Acciones para wallet:', walletId);
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

