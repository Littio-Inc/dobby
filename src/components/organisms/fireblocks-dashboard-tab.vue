<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex items-start justify-between gap-4 pb-4 border-b border-neutral-20">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-neutral-80 mb-1">Dashboard de Saldos Diagon</h2>
        <p class="text-sm text-neutral-60">Resumen de saldos por token y desglose por wallet interna</p>
      </div>

      <!-- Real-time Status Module -->
      <div class="flex items-center gap-3 bg-white border border-neutral-20 rounded-lg px-4 py-3 shadow-sm">
        <div class="flex items-center gap-2">
          <div
            :class="['h-2 w-2 rounded-full', isAutoRefreshActive ? 'bg-green-500 animate-pulse' : 'bg-neutral-40']"
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
            :class="[
              'px-3 py-1.5 h-8 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-1 text-sm',
              isRefreshing ? 'opacity-75 cursor-not-allowed' : '',
            ]"
            :disabled="isRefreshing"
            @click="handleRefresh"
          >
            <ArrowPathIcon :class="['h-3 w-3', isRefreshing ? 'animate-spin' : '']" />
            {{ isRefreshing ? 'Refrescando...' : 'Refrescar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <p class="text-red-800 text-sm">
        {{ error }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && wallets.length === 0"
      class="flex items-center justify-center py-12"
    >
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-littio-secondary-sky mb-4" />
        <p class="text-neutral-60">Cargando datos...</p>
      </div>
    </div>

    <!-- Balance Cards Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4"
      >
        <!-- Token Header -->
        <div class="flex items-center justify-between">
          <span :class="['px-3 py-1 rounded-full text-xs font-semibold', token.badgeColor]">
            {{ token.symbol }}
          </span>
        </div>

        <!-- Balance -->
        <div class="space-y-1">
          <p class="text-3xl font-bold text-neutral-80">
            {{ formatBalance(token.balance) }}
          </p>
          <p class="text-sm text-neutral-60">{{ token.walletsCount }} wallets</p>
        </div>

        <!-- Action Button -->
        <button
          :class="[
            'w-full px-4 py-2 border rounded transition-colors text-sm font-medium',
            selectedToken === token.symbol
              ? 'border-littio-secondary-sky bg-littio-secondary-sky/10 text-littio-secondary-sky'
              : 'border-neutral-20 hover:bg-neutral-20/20',
          ]"
          @click="handleViewWallets(token.symbol)"
        >
          {{ selectedToken === token.symbol ? 'Ocultar wallets' : 'Ver wallets' }}
        </button>
      </div>
    </div>

    <!-- Wallets List Section -->
    <div
      v-if="(!isLoading || wallets.length > 0) && wallets.length > 0"
      class="space-y-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-neutral-80">Wallets Fireblocks</h3>
        <div
          v-if="selectedToken"
          class="flex items-center gap-2"
        >
          <span class="text-sm text-neutral-60">Mostrando wallets de:</span>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-semibold',
              tokens.find((t) => t.symbol === selectedToken)?.badgeColor || 'bg-neutral-100 text-neutral-700',
            ]"
          >
            {{ selectedToken }}
          </span>
          <button
            class="text-sm text-neutral-60 hover:text-neutral-80 underline"
            @click="selectedToken = null"
          >
            Limpiar filtro
          </button>
        </div>
      </div>

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
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Blockchain
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Proveedor
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Balance{{ selectedToken ? ` ${selectedToken}` : '' }}
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-20">
              <tr
                v-if="filteredWallets.length === 0"
                class="hover:bg-neutral-10"
              >
                <td
                  colspan="6"
                  class="px-6 py-8 text-center text-neutral-60"
                >
                  No se encontraron wallets
                </td>
              </tr>
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
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold', getTypeBadgeColor(wallet.type)]">
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
                    <template v-if="selectedToken">
                      {{ formatTokenBalance(getWalletTokenBalance(wallet.id, selectedToken)) }} {{ selectedToken }}
                    </template>
                    <template v-else>
                      <template v-if="walletMainTokens[wallet.id]">
                        {{ formatTokenBalance(walletMainTokens[wallet.id].balance) }}
                        {{ walletMainTokens[wallet.id].token }}
                      </template>
                      <template v-else> - </template>
                    </template>
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
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';
import { DiagonService, type DiagonWallet, type DiagonAccountResponse, type DiagonAsset } from '../../services/api';

interface Token {
  symbol: string;
  balance: number;
  change: number;
  walletsCount: number;
  badgeColor: string;
}

const wallets = ref<DiagonWallet[]>([]);
const accounts = ref<DiagonAccountResponse[]>([]);
const tokens = ref<Token[]>([]);
const selectedToken = ref<string | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false); // Estado separado para refresh manual
const error = ref<string | null>(null);
const lastUpdateTime = ref('');
const isAutoRefreshActive = ref(true);

const AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let updateInterval: ReturnType<typeof setInterval> | null = null;
let dataRefreshInterval: ReturnType<typeof setInterval> | null = null;
let isRefreshingFlag = false; // Flag interno para evitar múltiples refreshes

const loadData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const accountsData = await DiagonService.getAccountsWithAssets();
    accounts.value = accountsData;

    const walletsData = accountsData.map((account) => ({
      id: account.id,
      name: account.name,
      type: inferWalletType(account.name),
      blockchain: getMainBlockchainFromAssets(account.assets),
      provider: extractProviderFromName(account.name),
      balanceEth: getEthBalanceFromAssets(account.assets),
    }));

    wallets.value = walletsData;

    tokens.value = calculateTokenBalances(accountsData);

    const now = new Date();
    lastUpdateTime.value = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (err: any) {
    console.error('[FireblocksDashboard] Error loading data:', err);
    error.value = err.message || 'Error al cargar los datos';
    wallets.value = [];
    accounts.value = [];
    tokens.value = [];
  } finally {
    isLoading.value = false;
  }
};

const searchQuery = ref('');
const selectedType = ref('all');
const selectedProvider = ref('all');

const inferWalletType = (name: string): 'Vault' | 'OTC' | 'Proveedor' | 'Operativa' => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('vault') || nameLower.includes('treasury')) return 'Vault';
  if (nameLower.includes('otc') || nameLower.includes('trading')) return 'OTC';
  if (
    nameLower.includes('supra') ||
    nameLower.includes('cobre') ||
    nameLower.includes('kira') ||
    nameLower.includes('bridge') ||
    nameLower.includes('koywe')
  )
    return 'Proveedor';
  return 'Operativa';
};

const extractProviderFromName = (name: string): string | null => {
  const providers = ['Supra', 'Cobre', 'Kira', 'Bridge', 'Koywe'];
  for (const provider of providers) {
    if (name.toLowerCase().includes(provider.toLowerCase())) {
      return provider;
    }
  }
  return null;
};

const getEthBalanceFromAssets = (assets: DiagonAsset[]): number => {
  for (const asset of assets) {
    const { token } = parseAssetId(asset.id);
    if (token.toUpperCase() === 'ETH' || asset.id.includes('ETH')) {
      return parseFloat(asset.balance) || 0;
    }
  }
  return 0;
};

const getMainBlockchainFromAssets = (assets: DiagonAsset[]): string => {
  if (assets.length === 0) return 'Ethereum';

  const blockchainCount: Record<string, number> = {};
  for (const asset of assets) {
    const { blockchain } = parseAssetId(asset.id);
    blockchainCount[blockchain] = (blockchainCount[blockchain] || 0) + 1;
  }

  return Object.entries(blockchainCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ethereum';
};

const calculateTokenBalances = (accounts: DiagonAccountResponse[]): Token[] => {
  const tokenBalances: Record<string, { total: number; wallets: Set<string> }> = {};

  for (const account of accounts) {
    for (const asset of account.assets) {
      const { token } = parseAssetId(asset.id);
      const tokenSymbol = token.toUpperCase();
      const balance = parseFloat(asset.balance) || 0;

      if (!tokenBalances[tokenSymbol]) {
        tokenBalances[tokenSymbol] = {
          total: 0,
          wallets: new Set(),
        };
      }

      tokenBalances[tokenSymbol].total += balance;
      tokenBalances[tokenSymbol].wallets.add(account.id);
    }
  }

  const badgeColors: Record<string, string> = {
    USDT: 'bg-green-100 text-green-700',
    USDC: 'bg-blue-100 text-blue-700',
    ETH: 'bg-purple-100 text-purple-700',
    DAI: 'bg-orange-100 text-orange-700',
    BTC: 'bg-yellow-100 text-yellow-700',
    POL: 'bg-indigo-100 text-indigo-700',
    MATIC: 'bg-indigo-100 text-indigo-700',
  };

  const importantTokens = ['ETH', 'BTC'];

  return Object.entries(tokenBalances)
    .map(([symbol, data]) => ({
      symbol,
      balance: data.total,
      change: 0,
      walletsCount: data.wallets.size,
      badgeColor: badgeColors[symbol] || 'bg-neutral-100 text-neutral-700',
    }))
    .filter((token) => {
      if (importantTokens.includes(token.symbol) && token.walletsCount > 0) {
        return true;
      }
      return token.balance > 0;
    })
    .sort((a, b) => {
      const aIsImportant = importantTokens.includes(a.symbol);
      const bIsImportant = importantTokens.includes(b.symbol);

      if (aIsImportant && !bIsImportant) return -1;
      if (!aIsImportant && bIsImportant) return 1;

      return b.balance - a.balance;
    });
};

const getWalletTokenBalance = (walletId: string, tokenSymbol: string): number => {
  const account = accounts.value.find((acc) => acc.id === walletId);
  if (!account) return 0;

  const tokenUpper = tokenSymbol.toUpperCase();
  for (const asset of account.assets) {
    const { token } = parseAssetId(asset.id);
    if (token.toUpperCase() === tokenUpper) {
      return parseFloat(asset.balance) || 0;
    }
  }
  return 0;
};

const getWalletMainToken = (walletId: string): { token: string; balance: number } | null => {
  const account = accounts.value.find((acc) => acc.id === walletId);
  if (!account || account.assets.length === 0) return null;

  let mainToken: { token: string; balance: number } | null = null;

  for (const asset of account.assets) {
    const { token } = parseAssetId(asset.id);
    const balance = parseFloat(asset.balance) || 0;

    if (balance > 0) {
      if (!mainToken || balance > mainToken.balance) {
        mainToken = { token: token.toUpperCase(), balance };
      }
    }
  }

  return mainToken;
};

const parseAssetId = (assetId: string): { token: string; blockchain: string } => {
  const parts = assetId.split('_');
  const assetIdUpper = assetId.toUpperCase();

  const knownTokens = ['USDC', 'USDT', 'ETH', 'BTC', 'DAI', 'MATIC', 'POL', 'WBTC', 'WETH'];

  const blockchainMap: Record<string, string> = {
    POLYGON: 'Polygon',
    AMOY: 'Polygon',
    BITCOIN: 'Bitcoin',
    BTC: 'Bitcoin',
  };

  let blockchain = 'Unknown';
  for (const [key, value] of Object.entries(blockchainMap)) {
    if (assetIdUpper.includes(key)) {
      blockchain = value;
      break;
    }
  }

  let token = parts[0].toUpperCase();

  if (token === 'BTC' || assetIdUpper.startsWith('BTC_')) {
    token = 'BTC';
    blockchain = 'Bitcoin';
    return { token, blockchain };
  }

  if (token === 'AMOY' || token === 'POLYGON') {
    let foundToken = false;
    for (const knownToken of knownTokens) {
      if (assetIdUpper.includes(`_${knownToken}_`) || assetIdUpper.startsWith(`${knownToken}_`)) {
        token = knownToken;
        foundToken = true;
        break;
      }
    }

    if (!foundToken && blockchain === 'Polygon') {
      token = 'POL';
    }
  }

  if (token === 'MATIC') {
    token = 'POL';
  }

  if (blockchain === 'Unknown' && token !== 'BTC') {
    blockchain = 'Ethereum';
  }

  return { token, blockchain };
};

const walletMainTokens = computed(() => {
  const tokensMap: Record<string, { token: string; balance: number }> = {};
  for (const wallet of wallets.value) {
    const mainToken = getWalletMainToken(wallet.id);
    if (mainToken) {
      tokensMap[wallet.id] = mainToken;
    }
  }
  return tokensMap;
});

const filteredWallets = computed(() => {
  return wallets.value.filter((wallet) => {
    if (selectedToken.value) {
      const account = accounts.value.find((acc) => acc.id === wallet.id);
      if (!account) return false;

      const importantTokens = ['ETH', 'BTC'];
      if (importantTokens.includes(selectedToken.value)) {
        const hasToken = account.assets.some((asset) => {
          const { token } = parseAssetId(asset.id);
          return token.toUpperCase() === selectedToken.value.toUpperCase();
        });
        if (!hasToken) return false;
      } else {
        const tokenBalance = getWalletTokenBalance(wallet.id, selectedToken.value);
        if (tokenBalance <= 0) {
          return false;
        }
      }
    }

    const matchesSearch =
      searchQuery.value === '' ||
      wallet.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      wallet.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (wallet.provider && wallet.provider.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesType = selectedType.value === 'all' || wallet.type.toLowerCase() === selectedType.value.toLowerCase();

    const matchesProvider =
      selectedProvider.value === 'all' ||
      (wallet.provider && wallet.provider.toLowerCase() === selectedProvider.value.toLowerCase()) ||
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

const handleRefresh = async () => {
  // Evitar múltiples refreshes simultáneos
  if (isRefreshingFlag) {
    return;
  }

  isRefreshingFlag = true;
  isRefreshing.value = true; // Mostrar indicador de refresh sin ocultar la tabla
  error.value = null;

  try {
    // Refrescar todos los balances (POST)
    await DiagonService.refreshAllBalances();
    // Recargar los datos actualizados
    await loadData();
  } catch (err: any) {
    console.error('[FireblocksDashboard] Error refreshing data:', err);
    error.value = err.message || 'Error al refrescar los datos';
  } finally {
    isRefreshing.value = false;
    isRefreshingFlag = false;
  }
};

const handleViewWallets = (symbol: string) => {
  if (selectedToken.value === symbol) {
    selectedToken.value = null;
  } else {
    selectedToken.value = symbol;
  }
  searchQuery.value = '';
  selectedType.value = 'all';
  selectedProvider.value = 'all';
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

const formatTokenBalance = (balance: number): string => {
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copiado al portapapeles:', text);
  } catch (err) {
    console.error('Error al copiar:', err);
  }
};

const handleWalletActions = (walletId: string) => {
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

const startDataRefreshInterval = () => {
  if (dataRefreshInterval) {
    clearInterval(dataRefreshInterval);
  }
  dataRefreshInterval = setInterval(async () => {
    if (isAutoRefreshActive.value && !isRefreshingFlag) {
      isRefreshingFlag = true;
      try {
        await DiagonService.refreshAllBalances();
        await loadData();
      } catch (err: any) {
        if (!error.value) {
          error.value = err.message || 'Error en la actualización automática';
        }
      } finally {
        isRefreshingFlag = false;
      }
    }
  }, AUTO_REFRESH_INTERVAL_MS);
};

const toggleAutoRefresh = () => {
  isAutoRefreshActive.value = !isAutoRefreshActive.value;
  if (isAutoRefreshActive.value) {
    startUpdateInterval();
    startDataRefreshInterval();
  } else {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    if (dataRefreshInterval) {
      clearInterval(dataRefreshInterval);
      dataRefreshInterval = null;
    }
  }
};

onMounted(async () => {
  startUpdateInterval();
  await loadData();
  if (isAutoRefreshActive.value) {
    startDataRefreshInterval();
  }
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (dataRefreshInterval) {
    clearInterval(dataRefreshInterval);
  }
});
</script>
