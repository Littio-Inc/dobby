<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex items-start justify-between gap-4 pb-4 border-b border-neutral-20">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-neutral-80 mb-1">Dashboard de Saldos Diagon</h2>
        <p class="text-sm text-neutral-60">Resumen de saldos por token y desglose por wallet interna</p>
      </div>

      <RefreshControls
        :is-active="isAutoRefreshActive"
        :is-refreshing="isRefreshing"
        :last-update-time="lastUpdateTime"
        @toggle="toggleAutoRefresh"
        @refresh="handleRefresh"
      />
    </div>

    <ErrorMessage :message="error" />

    <LoadingSpinner
      v-if="isLoading && wallets.length === 0"
      message="Cargando datos..."
    />

    <!-- Balance Cards Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <TokenBalanceCard
        v-for="token in tokens"
        :key="token.symbol"
        :symbol="token.symbol"
        :formatted-balance="formatBalance(token.balance)"
        :wallets-count="token.walletsCount"
        :badge-color="token.badgeColor"
        :is-selected="selectedToken === token.symbol"
        @toggle="handleViewWallets(token.symbol)"
      />
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

      <WalletsFilters
        :search-query="searchQuery"
        :selected-type="selectedType"
        @update:search-query="searchQuery = $event"
        @update:selected-type="selectedType = $event"
      />

      <WalletsTable
        :wallets="tableWallets"
        :selected-token="selectedToken"
        @copy-id="copyToClipboard"
        @actions="handleWalletActions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { DiagonService, type DiagonWallet, type DiagonAccountResponse, type DiagonAsset } from '../../services/api';
import { getTokenBadgeColor } from '../../utils/token-badge-colors';
import ErrorMessage from '../atoms/error-message.vue';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import RefreshControls from '../molecules/refresh-controls.vue';
import TokenBalanceCard from '../molecules/token-balance-card.vue';
import WalletsFilters from '../molecules/wallets-filters.vue';
import WalletsTable from '../molecules/wallets-table.vue';

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

  const importantTokens = ['ETH', 'BTC'];

  return Object.entries(tokenBalances)
    .map(([symbol, data]) => ({
      symbol,
      balance: data.total,
      change: 0,
      walletsCount: data.wallets.size,
      badgeColor: getTokenBadgeColor(symbol),
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

const tableWallets = computed(() => {
  return filteredWallets.value.map((wallet) => {
    let formattedBalance = '-';
    
    if (selectedToken.value) {
      const balance = getWalletTokenBalance(wallet.id, selectedToken.value);
      formattedBalance = `${formatTokenBalance(balance)} ${selectedToken.value}`;
    } else {
      const mainToken = walletMainTokens.value[wallet.id];
      if (mainToken) {
        formattedBalance = `${formatTokenBalance(mainToken.balance)} ${mainToken.token}`;
      }
    }

    return {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      typeBadgeColor: getTypeBadgeColor(wallet.type),
      blockchain: wallet.blockchain,
      provider: wallet.provider,
      formattedBalance,
    };
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
