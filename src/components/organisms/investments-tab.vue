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

    <div class="space-y-6">
      <LoadingSpinner
        v-if="isLoading"
        message="Cargando información de inversiones..."
      />

      <template v-else>
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
                ${{ formatNumber(portfolioBalanceUSDC) }}
                <span class="text-base font-normal text-neutral-60">USDC</span>
              </p>
              <p class="text-2xl font-bold text-neutral-80">
                €{{ formatNumber(portfolioBalanceEURC) }}
                <span class="text-base font-normal text-neutral-60">EURC</span>
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
              <template v-if="averageAPY !== null">
                <p class="text-3xl font-bold text-green-600">{{ averageAPY.toFixed(2) }}%</p>
              </template>
              <template v-else>
                <p class="text-3xl font-bold text-green-600">-</p>
              </template>
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
              <p class="text-3xl font-bold text-neutral-80">{{ activeVaultsCount }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-xl font-bold text-neutral-80">Vaults Disponibles</h3>

          <div
            v-if="vaults.length === 0"
            class="text-center py-8 text-neutral-60"
          >
            No hay vaults disponibles
          </div>

          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
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
                <p class="text-xl font-bold text-neutral-80">
                  <template v-if="vault.apy === 'Variable'">-</template>
                  <template v-else>{{ vault.apy }}</template>
                </p>
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
                  v-if="getExplorerUrl(vault.chainConfigName, vault.poolAddr)"
                  class="px-3 py-2 border border-neutral-40 bg-white text-neutral-80 rounded-lg hover:bg-neutral-20/20 transition-colors flex items-center justify-center"
                  @click="handleViewOnExplorer(vault.chainConfigName, vault.poolAddr)"
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

        <!-- Movimientos Unificados Section -->
        <UnifiedMovementsTable
          provider="open_trade"
          movement-type="internal"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UnifiedMovementsTable from '../molecules/unified-movements-table.vue';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import { AzkabanService, type OpentradeVault, type OpentradeVaultOverviewResponse } from '../../services/api/azkaban';

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
  poolAddr: string;
  liquidityAssetAddr: string;
  chainConfigName: string;
}

const vaults = ref<Vault[]>([]);
const isLoading = ref(true);
const portfolioBalanceUSDC = ref(0);
const portfolioBalanceEURC = ref(0);
const averageAPY = ref<number | null>(null);
const activeVaultsCount = ref(0);

const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  if (num >= 1000000) {
    return (
      (num / 1000000).toLocaleString('es-ES', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }) + 'M'
    );
  }

  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const basisPointsToPercentage = (basisPoints: string): number => {
  const bp = parseFloat(basisPoints);
  if (isNaN(bp)) return 0;
  return bp / 100;
};

/**
 * Obtiene el número de decimales para un token basándose en su símbolo
 * @param tokenSymbol - Símbolo del token (ej: 'USDC', 'EURC')
 * @returns Número de decimales del token (default: 6 para stablecoins comunes)
 */
const getTokenDecimals = (tokenSymbol: string): number => {
  const upper = tokenSymbol.toUpperCase();
  // USDC y EURC típicamente usan 6 decimales
  if (upper.includes('USDC') || upper.includes('MUSDC')) return 6;
  if (upper.includes('EURC') || upper.includes('MEURC')) return 6;
  // Por defecto, asumimos 6 decimales para tokens no especificados
  // Esto puede necesitar ajustarse cuando se agreguen nuevos tokens con diferentes decimales
  return 6;
};

const formatAssetBalance = (balance: string, _decimals: number = 6): string => {
  const num = parseFloat(balance);
  if (isNaN(num) || num === 0) return '0.00';

  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getCurrencySymbol = (tokenSymbol: string): string => {
  const upper = tokenSymbol.toUpperCase();
  if (upper.includes('USDC') || upper.includes('MUSDC')) return 'USDC';
  if (upper.includes('EURC') || upper.includes('MEURC')) return 'EURC';
  return tokenSymbol;
};

const getVaultTags = (vault: OpentradeVault): string[] => {
  const tags: string[] = [];

  const currency = getCurrencySymbol(vault.liquidity_token_symbol);
  tags.push(currency);

  tags.push(vault.chain_config_name.replace('Sandbox', ''));

  if (vault.contract_name) {
    tags.push(vault.contract_name);
  }

  if (vault.pool_type === 2) {
    tags.push('Dynamic');
  }

  return tags;
};

const getVaultCategory = (vault: OpentradeVault): string => {
  const name = vault.display_name.toLowerCase();
  if (name.includes('money market')) return 'Tokenized Money Market Fund';
  if (name.includes('corporate bond') || name.includes('bond')) return 'Fixed Income Strategy';
  if (name.includes('dynamic')) return 'Money Market / Liquidity';
  return 'Liquidity Vault';
};

const getAPYFromOverview = (overview: OpentradeVaultOverviewResponse): { apy: string; apyLabel: string } => {
  const interestRate = basisPointsToPercentage(overview.vault_overview_cto.interest_rate);
  if (interestRate > 0) {
    return {
      apy: `${interestRate.toFixed(2)}%`,
      apyLabel: 'APY',
    };
  }

  const indicativeRate = basisPointsToPercentage(overview.vault_overview_cto.indicative_interest_rate);
  if (indicativeRate > 0) {
    return {
      apy: `${indicativeRate.toFixed(2)}%`,
      apyLabel: 'Indicative APY',
    };
  }

  return {
    apy: 'Variable',
    apyLabel: 'APY',
  };
};

const getExplorerUrl = (chainConfigName: string, poolAddr: string): string | null => {
  const chainName = chainConfigName.replace('Sandbox', '').toLowerCase();

  if (chainName.includes('fuji')) {
    return `https://testnet.snowtrace.io/address/${poolAddr}`;
  } else if (chainName.includes('sepolia')) {
    return `https://sepolia.etherscan.io/address/${poolAddr}`;
  }

  return null;
};

const loadVaultsData = async () => {
  try {
    isLoading.value = true;

    const vaultsList = await AzkabanService.getOpentradeVaults();
    activeVaultsCount.value = vaultsList.length;

    // Fetch all vault overviews once
    const overviewPromises = vaultsList.map(async (vault) => {
      try {
        const overview = await AzkabanService.getOpentradeVaultOverview(vault.pool_addr);
        return { poolAddr: vault.pool_addr, overview };
      } catch (error) {
        console.warn(`[InvestmentsTab] Error fetching overview for vault ${vault.pool_addr}:`, error);
        return { poolAddr: vault.pool_addr, overview: null };
      }
    });

    const overviewResults = await Promise.all(overviewPromises);
    const overviewsMap = new Map<string, OpentradeVaultOverviewResponse | null>();
    overviewResults.forEach(({ poolAddr, overview }) => {
      overviewsMap.set(poolAddr, overview);
    });

    // Calculate average APY using the overviewsMap
    const apyValues: number[] = [];
    overviewsMap.forEach((overview) => {
      if (overview) {
        const interestRate = basisPointsToPercentage(overview.vault_overview_cto.interest_rate);
        if (interestRate > 0) {
          apyValues.push(interestRate);
        } else {
          const indicativeRate = basisPointsToPercentage(overview.vault_overview_cto.indicative_interest_rate);
          if (indicativeRate > 0) {
            apyValues.push(indicativeRate);
          }
        }
      }
    });

    if (apyValues.length > 0) {
      const sum = apyValues.reduce((acc, val) => acc + val, 0);
      averageAPY.value = sum / apyValues.length;
    }

    let totalUSDC = 0;
    let totalEURC = 0;

    const vaultDataPromises = vaultsList.map(async (vault) => {
      try {
        // Note: Using liquidity_asset_addr as accountAddr parameter.
        // The OpentradeVault type doesn't have an account_addr field, but the API
        // endpoint expects an account address. Verify with API documentation if this is correct.
        const accountData = await AzkabanService.getOpentradeVaultAccount(vault.pool_addr, vault.liquidity_asset_addr);

        const currency = getCurrencySymbol(vault.liquidity_token_symbol);
        const tokenDecimals = getTokenDecimals(vault.liquidity_token_symbol);
        const divisor = Math.pow(10, tokenDecimals);
        const rawValue = accountData.vault_account_cto.current_asset_value || '0';
        const assetBalance = parseFloat(rawValue) / divisor;

        if (currency === 'USDC') {
          totalUSDC += assetBalance;
        } else if (currency === 'EURC') {
          totalEURC += assetBalance;
        }

        // Use overviewsMap instead of making another service call
        let apy = 'Variable';
        let apyLabel = 'APY';
        const overview = overviewsMap.get(vault.pool_addr);
        if (overview) {
          const apyData = getAPYFromOverview(overview);
          apy = apyData.apy;
          apyLabel = apyData.apyLabel;
        }

        return {
          id: vault.pool_addr,
          title: vault.display_name,
          category: getVaultCategory(vault),
          tags: getVaultTags(vault),
          apy,
          apyLabel,
          vaultToken: vault.symbol,
          principalEarning: `${formatAssetBalance(accountData.vault_account_cto.principal_earning_interest, tokenDecimals)} ${currency}`,
          tokensInVault: `${formatAssetBalance(accountData.vault_account_cto.token_balance, tokenDecimals)} ${vault.symbol}`,
          poolAddr: vault.pool_addr,
          liquidityAssetAddr: vault.liquidity_asset_addr,
          chainConfigName: vault.chain_config_name,
        };
      } catch (error) {
        console.warn(`[InvestmentsTab] Error fetching account data for vault ${vault.pool_addr}:`, error);

        // Use overviewsMap instead of making another service call
        let apy = 'Variable';
        let apyLabel = 'APY';
        const overview = overviewsMap.get(vault.pool_addr);
        if (overview) {
          const apyData = getAPYFromOverview(overview);
          apy = apyData.apy;
          apyLabel = apyData.apyLabel;
        }

        const currency = getCurrencySymbol(vault.liquidity_token_symbol);

        return {
          id: vault.pool_addr,
          title: vault.display_name,
          category: getVaultCategory(vault),
          tags: getVaultTags(vault),
          apy,
          apyLabel,
          vaultToken: vault.symbol,
          principalEarning: `0.00 ${currency}`,
          tokensInVault: `0.00 ${vault.symbol}`,
          poolAddr: vault.pool_addr,
          liquidityAssetAddr: vault.liquidity_asset_addr,
          chainConfigName: vault.chain_config_name,
        };
      }
    });

    vaults.value = await Promise.all(vaultDataPromises);

    portfolioBalanceUSDC.value = totalUSDC;
    portfolioBalanceEURC.value = totalEURC;
  } catch (error) {
    console.error('[InvestmentsTab] Error loading vaults data:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleInvest = (vaultId: string) => {
  console.log('Invest in vault:', vaultId);
};

const handleDivest = (vaultId: string) => {
  console.log('Divest from vault:', vaultId);
};

const handleViewOnExplorer = (chainConfigName: string, poolAddr: string) => {
  const explorerUrl = getExplorerUrl(chainConfigName, poolAddr);
  if (explorerUrl) {
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  }
};

onMounted(() => {
  loadVaultsData();
});
</script>
