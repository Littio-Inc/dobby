<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border border-neutral-20 p-6">
      <h2 class="text-2xl font-bold text-neutral-80 mb-6">Ejecutar Movimiento</h2>

      <LoadingSpinner
        v-if="isLoading"
        message="Cargando wallets..."
      />

      <form
        v-else
        class="space-y-8"
        @submit.prevent="handleSubmit"
      >
        <!-- Sección 1: Información General -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full bg-littio-secondary-sky text-white font-semibold text-sm"
              >1</span
            >
            <h3 class="text-lg font-semibold text-neutral-80">Información General</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <!-- Token -->
            <div>
              <label
                for="token"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Token <span class="text-carmine">*</span>
              </label>
              <select
                id="token"
                v-model="formData.token"
                required
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
                @change="handleTokenChange"
              >
                <option
                  value=""
                  disabled
                >
                  Seleccione token
                </option>
                <option
                  v-for="token in availableTokens"
                  :key="token.symbol"
                  :value="token.symbol"
                >
                  {{ token.symbol }}
                </option>
              </select>
            </div>

            <!-- Tipo de Operación -->
            <div>
              <label
                for="operation-type"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Tipo de Operación <span class="text-carmine">*</span>
              </label>
              <select
                id="operation-type"
                v-model="formData.operationType"
                required
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
              >
                <option
                  value=""
                  disabled
                >
                  Seleccione tipo
                </option>
                <option value="prefunding_provider">Prefondeo proveedor</option>
                <option value="b2c_funding">Fondeo B2C</option>
                <option value="internal_rebalancing">Rebalanceo interno</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sección 2: Wallet Origen -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full bg-littio-secondary-sky text-white font-semibold text-sm"
              >2</span
            >
            <h3 class="text-lg font-semibold text-neutral-80">Wallet Origen</h3>
          </div>

          <div class="pl-10 space-y-4">
            <div>
              <label
                for="origin-wallet"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Seleccionar Wallet <span class="text-carmine">*</span>
              </label>
              <select
                id="origin-wallet"
                v-model="formData.originWallet"
                required
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
              >
                <option
                  value=""
                  disabled
                >
                  Seleccione wallet origen
                </option>
                <option
                  v-for="wallet in originWallets"
                  :key="wallet.id"
                  :value="wallet.id"
                >
                  {{ wallet.name }}
                </option>
              </select>
            </div>

            <!-- Balance Card para Wallet Origen -->
            <div
              v-if="selectedOriginWalletBalance"
              class="bg-neutral-10 rounded-lg p-4 border border-neutral-20"
            >
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-neutral-60">Balance disponible:</span>
                <div class="text-right">
                  <div class="text-lg font-bold text-neutral-80 leading-tight">
                    {{ selectedOriginWalletBalance.balance }} {{ formData.token }}
                  </div>
                  <div class="text-sm text-neutral-60 mt-0.5">${{ selectedOriginWalletBalance.usdValue }} USD</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección 3: Wallet Destino -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full bg-littio-secondary-sky text-white font-semibold text-sm"
              >3</span
            >
            <h3 class="text-lg font-semibold text-neutral-80">Wallet Destino</h3>
          </div>

          <div :class="showProviderField ? 'grid grid-cols-1 md:grid-cols-2 gap-6 pl-10' : 'pl-10'">
            <!-- Proveedor (solo para prefunding_provider y b2c_funding) -->
            <div v-if="showProviderField">
              <label
                for="provider"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Proveedor <span class="text-carmine">*</span>
              </label>
              <select
                id="provider"
                v-model="formData.provider"
                required
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
                @change="handleProviderChange"
              >
                <option
                  value=""
                  disabled
                >
                  Seleccione proveedor
                </option>
                <option
                  v-for="provider in availableProviders"
                  :key="provider.value"
                  :value="provider.value"
                >
                  {{ provider.label }}
                </option>
              </select>
            </div>

            <!-- Wallet Destino -->
            <div class="space-y-4">
              <div>
                <label
                  for="destination-wallet"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Wallet Destino <span class="text-carmine">*</span>
                </label>
                <select
                  id="destination-wallet"
                  v-model="formData.destinationWallet"
                  required
                  :disabled="
                    (showProviderField && !formData.provider) ||
                    (formData.operationType === 'internal_rebalancing' && !formData.originWallet)
                  "
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white disabled:bg-neutral-20 disabled:cursor-not-allowed"
                >
                  <option
                    value=""
                    disabled
                  >
                    {{
                      formData.operationType === 'internal_rebalancing' && !formData.originWallet
                        ? 'Seleccione primero la wallet origen'
                        : 'Seleccione wallet destino'
                    }}
                  </option>
                  <option
                    v-for="wallet in destinationWallets"
                    :key="wallet.id"
                    :value="wallet.id"
                  >
                    {{ wallet.name }}
                    {{ 'address' in wallet ? `(${wallet.address})` : '' }}
                  </option>
                </select>
              </div>

              <!-- Balance Card para Wallet Destino (solo para rebalanceo interno) -->
              <div
                v-if="formData.operationType === 'internal_rebalancing' && selectedDestinationWalletBalance"
                class="bg-neutral-10 rounded-lg p-4 border border-neutral-20"
              >
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-neutral-60">Balance disponible:</span>
                  <div class="text-right">
                    <div class="text-lg font-bold text-neutral-80 leading-tight">
                      {{ selectedDestinationWalletBalance.balance }} {{ formData.token }}
                    </div>
                    <div class="text-sm text-neutral-60 mt-0.5">
                      ${{ selectedDestinationWalletBalance.usdValue }} USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección 4: Monto y Fees -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full bg-littio-secondary-sky text-white font-semibold text-sm"
              >4</span
            >
            <h3 class="text-lg font-semibold text-neutral-80">Monto y Fees</h3>
          </div>

          <div class="pl-10 space-y-6">
            <!-- Monto -->
            <div>
              <label
                for="amount"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Monto <span class="text-carmine">*</span>
              </label>
              <input
                id="amount"
                v-model="formData.amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60"
              />
            </div>

            <!-- Velocidad de Transacción -->
            <div>
              <label
                for="transaction-speed"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Velocidad de Transacción <span class="text-carmine">*</span>
              </label>
              <div class="relative">
                <select
                  id="transaction-speed"
                  v-model="formData.transactionSpeed"
                  required
                  :disabled="isLoadingFee || !feeOptions || speedOptions.length === 0"
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white disabled:bg-neutral-20 disabled:cursor-not-allowed appearance-none pr-10"
                >
                  <option
                    value=""
                    disabled
                  >
                    {{
                      isLoadingFee
                        ? 'Calculando fees...'
                        : speedOptions.length === 0
                          ? 'Complete los campos para calcular fees'
                          : 'Seleccione velocidad'
                    }}
                  </option>
                  <option
                    v-for="option in speedOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <svg
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-60 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>

            <!-- Gas y Fee Info -->
            <div class="bg-neutral-10 rounded-lg p-4 border border-neutral-20">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-neutral-60">Gas estimado:</span>
                <span class="text-lg font-bold text-neutral-80">
                  {{ estimatedGas === '-' ? '-' : estimatedGas }}
                </span>
              </div>
            </div>

            <!-- Fee Error Message -->
            <div
              v-if="feeError"
              class="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <p class="text-sm text-red-800">
                {{ feeError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sección 5: Notas -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full bg-littio-secondary-sky text-white font-semibold text-sm"
              >5</span
            >
            <h3 class="text-lg font-semibold text-neutral-80">Notas (Opcional)</h3>
          </div>

          <div class="pl-10">
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="4"
              placeholder="Agregar comentarios internos sobre esta transacción..."
              class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60 resize-y"
            />
          </div>
        </div>

        <!-- Botón de envío -->
        <div class="flex justify-end pt-4 border-t border-neutral-20">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2.5 bg-littio-secondary-sky text-white rounded-lg font-medium hover:bg-littio-secondary-sky/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ isSubmitting ? 'Ejecutando...' : 'Ejecutar Movimiento' }}
          </button>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-carmine-light border border-carmine rounded-lg p-4"
        >
          <p class="text-carmine font-medium">
            {{ error }}
          </p>
        </div>

        <!-- Success Message -->
        <div
          v-if="success"
          class="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <p class="text-green-800 font-medium">
            {{ success }}
          </p>
        </div>
      </form>
    </div>

    <!-- Movimientos Unificados Table -->
    <div class="bg-white rounded-lg border border-neutral-20 p-6 mt-8">
      <UnifiedMovementsTable
        ref="movementsTableRef"
        provider="fireblocks"
        movement-type="internal"
        title="Movimientos Unificados"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  AzkabanService,
  type DiagonAccountResponse,
  type ExternalWallet,
  type EstimateFeeResponse,
  type FeeOption,
  type CreateTransactionRequest,
  type BlockchainWallet,
} from '../../services/api';
import { getTokenBadgeColor } from '../../utils/token-badge-colors';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import UnifiedMovementsTable from '../molecules/unified-movements-table.vue';

interface Wallet {
  id: string;
  name: string;
  balance: string;
  token: string;
}

interface DestinationWallet {
  id: string;
  name: string;
  address: string;
  walletId: string;
  assetId: string;
}

interface FormData {
  token: string;
  operationType: string;
  originWallet: string;
  provider: string;
  destinationWallet: string;
  amount: string;
  transactionSpeed: string;
  notes: string;
}

const props = defineProps<{
  walletId?: string | null;
  walletName?: string;
  walletBalance?: string;
  walletToken?: string | null;
}>();

const formData = ref<FormData>({
  token: '',
  operationType: '',
  originWallet: props.walletId || '',
  provider: '',
  destinationWallet: '',
  amount: '',
  transactionSpeed: '',
  notes: '',
});

const isSubmitting = ref(false);
const error = ref('');
const success = ref('');
const isLoading = ref(false);
const accounts = ref<DiagonAccountResponse[]>([]);
const originWallets = ref<Wallet[]>([]);
const destinationWallets = ref<Array<DestinationWallet | Wallet>>([]);
const availableTokens = ref<Array<{ symbol: string; badgeColor: string }>>([]);
const externalWallets = ref<ExternalWallet[]>([]);
const blockchainWallets = ref<BlockchainWallet[]>([]);
const feeOptions = ref<EstimateFeeResponse | null>(null);
const isLoadingFee = ref(false);
const feeError = ref<string | null>(null);
const movementsTableRef = ref<{ refresh: () => void } | null>(null);

const showProviderField = computed(() => {
  return formData.value.operationType === 'prefunding_provider' || formData.value.operationType === 'b2c_funding';
});

const extractProviderFromWalletName = (walletName: string, prefix: string): string | null => {
  if (!walletName.toUpperCase().startsWith(prefix.toUpperCase())) {
    return null;
  }

  const providerPart = walletName.substring(prefix.length);
  if (!providerPart) {
    return null;
  }

  return providerPart.toLowerCase();
};

const getProviderDisplayName = (providerValue: string): string => {
  return providerValue.toUpperCase().replace(/_/g, ' ');
};

const getUniqueProviderBase = (providerValue: string): string => {
  const parts = providerValue.split('_');
  return parts[0];
};

const availableProviders = computed(() => {
  if (!externalWallets.value.length) {
    return [];
  }

  if (formData.value.operationType === 'prefunding_provider') {
    const providers = new Set<string>();
    externalWallets.value.forEach((wallet) => {
      const provider = extractProviderFromWalletName(wallet.name, 'PROVIDER_');
      if (provider) {
        const baseProvider = getUniqueProviderBase(provider);
        providers.add(baseProvider);
      }
    });

    return Array.from(providers)
      .sort()
      .map((provider) => ({
        value: provider,
        label: getProviderDisplayName(provider),
      }));
  }

  if (formData.value.operationType === 'b2c_funding') {
    const providers = new Set<string>();
    externalWallets.value.forEach((wallet) => {
      const provider = extractProviderFromWalletName(wallet.name, 'B2C_');
      if (provider) {
        const baseProvider = getUniqueProviderBase(provider);
        providers.add(baseProvider);
      }
    });

    return Array.from(providers)
      .sort()
      .map((provider) => ({
        value: provider,
        label: getProviderDisplayName(provider),
      }));
  }

  return [];
});

const getFeeOptionFromSpeed = (speed: string): FeeOption | null => {
  if (!feeOptions.value) return null;

  const speedMap: Record<string, keyof EstimateFeeResponse> = {
    slow: 'low',
    medium: 'medium',
    fast: 'high',
  };

  const apiSpeed = speedMap[speed];
  if (!apiSpeed) return null;

  return feeOptions.value[apiSpeed] || null;
};

const estimatedGas = computed(() => {
  if (!feeOptions.value || !formData.value.transactionSpeed) {
    return '-';
  }

  const option = getFeeOptionFromSpeed(formData.value.transactionSpeed);
  if (option?.gasPrice) {
    return `${option.gasPrice} Gwei`;
  }

  return '-';
});

const formatGasPrice = (gasPrice: string | undefined): string => {
  if (!gasPrice) {
    return '—';
  }

  const parsed = parseFloat(gasPrice);
  if (!Number.isFinite(parsed)) {
    return '—';
  }

  return parsed.toFixed(2);
};

const speedOptions = computed(() => {
  if (!feeOptions.value) {
    return [];
  }

  const options = [];

  if (feeOptions.value.low) {
    const low = feeOptions.value.low;
    const gasPrice = formatGasPrice(low.gasPrice);
    options.push({ value: 'slow', label: `Lento (5-10 min) - ${gasPrice} Gwei` });
  }

  if (feeOptions.value.medium) {
    const medium = feeOptions.value.medium;
    const gasPrice = formatGasPrice(medium.gasPrice);
    options.push({ value: 'medium', label: `Medio (2-5 min) - ${gasPrice} Gwei` });
  }

  if (feeOptions.value.high) {
    const high = feeOptions.value.high;
    const gasPrice = formatGasPrice(high.gasPrice);
    options.push({ value: 'fast', label: `Rápido (1-2 min) - ${gasPrice} Gwei` });
  }

  return options;
});

const updateOriginWallets = () => {
  if (!formData.value.token || accounts.value.length === 0) {
    originWallets.value = [];
    return;
  }

  const tokenUpper = formData.value.token.toUpperCase();
  const importantTokens = ['ETH', 'BTC'];

  originWallets.value = accounts.value
    .filter((account) => {
      if (importantTokens.includes(tokenUpper)) {
        const hasToken = account.assets.some((asset) => {
          const { token } = parseAssetId(asset.id);
          return token.toUpperCase() === tokenUpper;
        });
        return hasToken;
      } else {
        const balance = getWalletTokenBalance(account, tokenUpper);
        return balance > 0;
      }
    })
    .map((account) => {
      const balance = getWalletTokenBalance(account, tokenUpper);
      return {
        id: account.id,
        name: account.name,
        balance: `${formatTokenBalance(balance)} ${tokenUpper}`,
        token: tokenUpper,
      };
    });

  if (formData.value.originWallet && !originWallets.value.some((w) => w.id === formData.value.originWallet)) {
    formData.value.originWallet = '';
  }
};

const handleTokenChange = () => {
  formData.value.destinationWallet = '';
  updateOriginWallets();
  updateDestinationWallets();
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

const getWalletTokenBalance = (account: DiagonAccountResponse, tokenSymbol: string): number => {
  const tokenUpper = tokenSymbol.toUpperCase();
  let totalBalance = 0;

  for (const asset of account.assets) {
    const { token } = parseAssetId(asset.id);
    if (token.toUpperCase() === tokenUpper) {
      totalBalance += parseFloat(asset.balance) || 0;
    }
  }

  return totalBalance;
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

const calculateUsdValue = (balance: number, token: string): string => {
  const tokenUpper = token.toUpperCase();

  if (tokenUpper === 'USDT' || tokenUpper === 'USDC' || tokenUpper === 'DAI') {
    return balance.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return balance.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const selectedOriginWalletBalance = computed(() => {
  if (!formData.value.originWallet || !formData.value.token) {
    return null;
  }

  const wallet = originWallets.value.find((w) => w.id === formData.value.originWallet);
  if (!wallet) {
    return null;
  }

  const account = accounts.value.find((acc) => acc.id === formData.value.originWallet);
  if (!account) {
    return null;
  }

  const tokenUpper = formData.value.token.toUpperCase();
  const balance = getWalletTokenBalance(account, tokenUpper);
  const formattedBalance = formatTokenBalance(balance);
  const usdValue = calculateUsdValue(balance, tokenUpper);

  return {
    balance: formattedBalance,
    usdValue,
  };
});

const selectedDestinationWalletBalance = computed(() => {
  if (
    !formData.value.destinationWallet ||
    !formData.value.token ||
    formData.value.operationType !== 'internal_rebalancing'
  ) {
    return null;
  }

  const wallet = destinationWallets.value.find((w) => !('address' in w) && w.id === formData.value.destinationWallet);
  if (!wallet || !('balance' in wallet)) {
    return null;
  }

  const account = accounts.value.find((acc) => acc.id === formData.value.destinationWallet);
  if (!account) {
    return null;
  }

  const tokenUpper = formData.value.token.toUpperCase();
  const balance = getWalletTokenBalance(account, tokenUpper);
  const formattedBalance = formatTokenBalance(balance);
  const usdValue = calculateUsdValue(balance, tokenUpper);

  return {
    balance: formattedBalance,
    usdValue,
  };
});

const extractAvailableTokens = (
  accountsData: DiagonAccountResponse[],
): Array<{ symbol: string; badgeColor: string }> => {
  const tokenSet = new Set<string>();
  const importantTokens = ['ETH', 'BTC'];

  for (const account of accountsData) {
    for (const asset of account.assets) {
      const { token } = parseAssetId(asset.id);
      const tokenSymbol = token.toUpperCase();
      const balance = parseFloat(asset.balance) || 0;

      if (importantTokens.includes(tokenSymbol) || balance > 0) {
        tokenSet.add(tokenSymbol);
      }
    }
  }

  return Array.from(tokenSet)
    .map((symbol) => ({
      symbol,
      badgeColor: getTokenBadgeColor(symbol),
    }))
    .sort((a, b) => {
      const aIsImportant = importantTokens.includes(a.symbol);
      const bIsImportant = importantTokens.includes(b.symbol);

      if (aIsImportant && !bIsImportant) return -1;
      if (!aIsImportant && bIsImportant) return 1;

      return a.symbol.localeCompare(b.symbol);
    });
};

const loadExternalWallets = async () => {
  try {
    const wallets = await AzkabanService.getExternalWallets();
    externalWallets.value = wallets;

    if (formData.value.provider) {
      handleProviderChange();
    }
  } catch (err: any) {
    console.error('[ExecuteMovementForm] Error loading external wallets:', err);
    externalWallets.value = [];
  }
};

const loadBlockchainWallets = async () => {
  try {
    const wallets = await AzkabanService.getBlockchainWallets('FIREBLOCKS');
    blockchainWallets.value = wallets;
  } catch (err: any) {
    console.error('[ExecuteMovementForm] Error loading blockchain wallets:', err);
    blockchainWallets.value = [];
  }
};

const loadWallets = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    const accountsData = await AzkabanService.getAccountsWithAssets();
    await loadExternalWallets();
    await loadBlockchainWallets();

    accounts.value = accountsData;

    availableTokens.value = extractAvailableTokens(accountsData);

    const normalizedWalletToken = props.walletToken?.toUpperCase();
    if (normalizedWalletToken && availableTokens.value.some((t) => t.symbol === normalizedWalletToken)) {
      formData.value.token = normalizedWalletToken;
      updateOriginWallets();
    }

    if (formData.value.operationType) {
      updateDestinationWallets();
    }
  } catch (err: any) {
    console.error('[ExecuteMovementForm] Error loading wallets:', err);
    error.value = err.message || 'Error al cargar las wallets';
  } finally {
    isLoading.value = false;
  }
};

const getOriginAssetId = (): string | null => {
  if (!formData.value.originWallet || !formData.value.token) {
    return null;
  }

  const account = accounts.value.find((acc) => acc.id === formData.value.originWallet);
  if (!account) {
    return null;
  }

  const tokenUpper = formData.value.token.toUpperCase();
  for (const asset of account.assets) {
    const { token } = parseAssetId(asset.id);
    if (token.toUpperCase() === tokenUpper) {
      return asset.id;
    }
  }

  return null;
};

const getDestinationWalletId = (): string | null => {
  if (!formData.value.destinationWallet) {
    return null;
  }

  if (formData.value.operationType === 'internal_rebalancing') {
    return formData.value.destinationWallet;
  }

  const destinationWallet = destinationWallets.value.find(
    (w) => 'address' in w && w.id === formData.value.destinationWallet,
  );
  return destinationWallet && 'walletId' in destinationWallet ? destinationWallet.walletId : null;
};

const getDestinationType = (): 'VAULT_ACCOUNT' | 'EXTERNAL_WALLET' => {
  return formData.value.operationType === 'internal_rebalancing' ? 'VAULT_ACCOUNT' : 'EXTERNAL_WALLET';
};

const estimateTransactionFee = async () => {
  if (
    !formData.value.originWallet ||
    !formData.value.destinationWallet ||
    !formData.value.token ||
    !formData.value.amount ||
    parseFloat(formData.value.amount) <= 0
  ) {
    feeOptions.value = null;
    formData.value.transactionSpeed = '';
    feeError.value = null;
    return;
  }

  const assetId = getOriginAssetId();
  const destinationWalletId = getDestinationWalletId();

  if (!assetId || !destinationWalletId) {
    feeOptions.value = null;
    formData.value.transactionSpeed = '';
    feeError.value = null;
    return;
  }

  isLoadingFee.value = true;
  feeError.value = null;

  try {
    const response = await AzkabanService.estimateFee({
      operation: 'TRANSFER',
      source: {
        type: 'VAULT_ACCOUNT',
        id: formData.value.originWallet,
      },
      destination: {
        type: getDestinationType(),
        id: destinationWalletId,
      },
      assetId: assetId,
      amount: String(formData.value.amount),
    });

    feeOptions.value = response;
    feeError.value = null;

    if (!response.low && !response.medium && !response.high) {
      formData.value.transactionSpeed = '';
    }
  } catch (err: any) {
    console.error('[ExecuteMovementForm] Error estimating fee:', err);
    feeOptions.value = null;
    formData.value.transactionSpeed = '';

    if (err.response) {
      const status = err.response.status;
      const errorData = err.response.data;

      if (status === 400 || status === 422) {
        feeError.value =
          errorData?.message ||
          errorData?.detail ||
          'Los datos proporcionados no son válidos para estimar los fees. Por favor, verifique los campos.';
      } else if (status === 404) {
        feeError.value = 'No se pudo encontrar la información necesaria para estimar los fees.';
      } else if (status >= 500) {
        feeError.value = 'Error del servidor al calcular los fees. Por favor, intente nuevamente en unos momentos.';
      } else if (status === 401 || status === 403) {
        feeError.value = 'No tiene permisos para estimar los fees. Por favor, verifique su sesión.';
      } else {
        feeError.value =
          errorData?.message ||
          errorData?.detail ||
          `Error al calcular los fees (código ${status}). Por favor, intente nuevamente.`;
      }
    } else if (err.request) {
      feeError.value = 'No se pudo conectar con el servidor para calcular los fees. Verifique su conexión a internet.';
    } else {
      feeError.value = err.message || 'Error al calcular los fees. Por favor, intente nuevamente.';
    }
  } finally {
    isLoadingFee.value = false;
  }
};

const updateDestinationWallets = () => {
  formData.value.destinationWallet = '';
  formData.value.transactionSpeed = '';
  feeOptions.value = null;

  if (formData.value.operationType === 'internal_rebalancing') {
    if (!formData.value.token || !formData.value.originWallet) {
      destinationWallets.value = [];
      return;
    }

    destinationWallets.value = originWallets.value
      .filter((wallet) => wallet.id !== formData.value.originWallet)
      .map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        balance: wallet.balance,
        token: wallet.token,
      }));
    return;
  }

  if (formData.value.operationType === 'prefunding_provider' || formData.value.operationType === 'b2c_funding') {
    if (!formData.value.provider || !formData.value.token) {
      destinationWallets.value = [];
      return;
    }

    const providerValue = formData.value.provider.toLowerCase();
    const tokenUpper = formData.value.token.toUpperCase();

    const prefix = formData.value.operationType === 'prefunding_provider' ? 'PROVIDER_' : 'B2C_';

    destinationWallets.value = externalWallets.value
      .filter((wallet) => {
        const walletProvider = extractProviderFromWalletName(wallet.name, prefix);
        if (!walletProvider) {
          return false;
        }

        const walletBaseProvider = getUniqueProviderBase(walletProvider);
        return walletBaseProvider === providerValue;
      })
      .flatMap((wallet) => {
        return wallet.assets
          .filter((asset) => {
            const { token } = parseAssetId(asset.id);
            return token.toUpperCase() === tokenUpper;
          })
          .map((asset) => {
            const nameWithoutPrefix = wallet.name.replace(new RegExp(`^${prefix}`, 'i'), '');
            return {
              id: `${wallet.id}-${asset.id}`,
              name: nameWithoutPrefix.replace(/_/g, ' '),
              address: asset.address,
              walletId: wallet.id,
              assetId: asset.id,
            };
          });
      });
    return;
  }

  destinationWallets.value = [];
};

const handleProviderChange = () => {
  updateDestinationWallets();
};

const getNetworkFromBlockchain = (blockchain: string): string => {
  const networkMap: Record<string, string> = {
    Polygon: 'polygon',
    Ethereum: 'ethereum',
    Bitcoin: 'bitcoin',
  };
  return networkMap[blockchain] || blockchain.toLowerCase();
};

const getDestinationAddress = (): string | null => {
  if (!formData.value.destinationWallet) {
    return null;
  }

  const destinationWallet = destinationWallets.value.find(
    (w) => 'address' in w && w.id === formData.value.destinationWallet,
  );

  if (destinationWallet && 'address' in destinationWallet) {
    return destinationWallet.address;
  }

  return null;
};

const mapTransactionSpeedToFeeLevel = (speed: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const speedMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
    slow: 'LOW',
    medium: 'MEDIUM',
    fast: 'HIGH',
  };
  return speedMap[speed] || 'MEDIUM';
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  error.value = '';
  success.value = '';

  try {
    if (
      !formData.value.originWallet ||
      !formData.value.destinationWallet ||
      !formData.value.token ||
      !formData.value.amount ||
      !formData.value.transactionSpeed
    ) {
      error.value = 'Por favor complete todos los campos requeridos';
      return;
    }

    const originAssetId = getOriginAssetId();
    if (!originAssetId) {
      error.value = 'No se pudo determinar el asset de origen';
      return;
    }

    const { blockchain } = parseAssetId(originAssetId);
    const network = getNetworkFromBlockchain(blockchain);

    const transactionRequest: CreateTransactionRequest = {
      network,
      service: 'BLOCKCHAIN_WITHDRAWAL',
      token: formData.value.token.toLowerCase(),
      sourceVaultId: formData.value.originWallet,
      feeLevel: mapTransactionSpeedToFeeLevel(formData.value.transactionSpeed),
      amount: String(formData.value.amount),
    };

    if (formData.value.operationType === 'internal_rebalancing') {
      transactionRequest.destinationVaultId = formData.value.destinationWallet;
    } else {
      const destinationAddress = getDestinationAddress();
      if (!destinationAddress) {
        error.value = 'No se pudo obtener la dirección de destino';
        return;
      }
      transactionRequest.destinationWalletId = destinationAddress;
    }

    const response = await AzkabanService.createTransaction(transactionRequest);

    const originAccount = accounts.value.find((acc) => acc.id === formData.value.originWallet);
    const originWalletName = originAccount?.name || formData.value.originWallet;

    let destinationWalletName = '';
    if (formData.value.operationType === 'internal_rebalancing') {
      const destinationAccount = accounts.value.find((acc) => acc.id === formData.value.destinationWallet);
      destinationWalletName = destinationAccount?.name || formData.value.destinationWallet;
    } else {
      const destinationWallet = destinationWallets.value.find(
        (w) => 'address' in w && w.id === formData.value.destinationWallet,
      );
      destinationWalletName = destinationWallet?.name || formData.value.destinationWallet;
    }

    const now = new Date();
    const operationDate = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const operationTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

    const isInternalTransfer = formData.value.operationType === 'internal_rebalancing';
    const isWithdrawal =
      formData.value.operationType === 'prefunding_provider' || formData.value.operationType === 'b2c_funding';

    const commonParams = {
      operationDate,
      operationTime,
      provider: 'fireblocks',
      amount: parseFloat(formData.value.amount),
      currency: formData.value.token.toUpperCase(),
      externalTransactionId: response.id,
      notes: formData.value.notes || undefined,
      method: 'BLOCKCHAIN',
      status: 'PROCESSING',
      movement_type: 'internal',
    };

    // Track backoffice transaction success
    // If backoffice fails, we still want to show a partial success message
    // since the blockchain transaction was successful
    // Alternatively, you may re-throw the error here if you want the whole operation to fail
    let backofficeSuccess = true;

    try {
      if (isInternalTransfer) {
        const originBlockchainWallet = blockchainWallets.value.find(
          (bw) => bw.provider_id === formData.value.originWallet,
        );
        const destinationBlockchainWallet = blockchainWallets.value.find(
          (bw) => bw.provider_id === formData.value.destinationWallet,
        );

        const originBlockchainWalletId = originBlockchainWallet?.id;
        const destinationBlockchainWalletId = destinationBlockchainWallet?.id;

        if (!originBlockchainWalletId) {
          throw new Error(
            `No se encontró blockchain_wallet.id para la wallet de origen: ${originWalletName} (provider_id: ${formData.value.originWallet}). Por favor, verifique que la wallet tenga un blockchain_wallet asociado.`,
          );
        }

        if (!destinationBlockchainWalletId) {
          throw new Error(
            `No se encontró blockchain_wallet.id para la wallet de destino: ${destinationWalletName} (provider_id: ${formData.value.destinationWallet}). Por favor, verifique que la wallet tenga un blockchain_wallet asociado.`,
          );
        }

        await AzkabanService.createBackofficeTransaction({
          ...commonParams,
          movementType: 'transfer_out',
          destinationAccount: destinationWalletName,
          originAccount: originWalletName,
          originProvider: originWalletName,
          userIdFrom: originBlockchainWalletId,
          userIdTo: destinationBlockchainWalletId,
        });
      } else if (isWithdrawal) {
        const blockchainWallet = blockchainWallets.value.find((bw) => bw.provider_id === formData.value.originWallet);

        const blockchainWalletId = blockchainWallet?.id;

        if (!blockchainWalletId) {
          throw new Error(
            `No se encontró blockchain_wallet.id para la wallet de origen: ${originWalletName} (provider_id: ${formData.value.originWallet}). Por favor, verifique que la wallet tenga un blockchain_wallet asociado.`,
          );
        }

        const destinationWallet = destinationWallets.value.find(
          (w) => 'address' in w && w.id === formData.value.destinationWallet,
        );
        const destinationAddress =
          destinationWallet && 'address' in destinationWallet ? destinationWallet.address : null;

        if (!destinationAddress) {
          throw new Error(
            `No se encontró la dirección de la wallet de destino: ${destinationWalletName}. Por favor, verifique que la wallet tenga una dirección asociada.`,
          );
        }

        await AzkabanService.createBackofficeTransaction({
          ...commonParams,
          movementType: 'withdrawal',
          destinationAccount: destinationWalletName,
          originAccount: originWalletName,
          originProvider: originWalletName,
          userIdFrom: blockchainWalletId,
          userIdTo: destinationAddress,
        });
      }
    } catch (backofficeError: any) {
      backofficeSuccess = false;
      console.error('[ExecuteMovementForm] Error creating backoffice transaction:', {
        error: backofficeError,
        message: backofficeError?.message,
        response: backofficeError?.response?.data,
        status: backofficeError?.response?.status,
        stack: backofficeError?.stack,
      });
      // Note: We catch and log the error but don't re-throw it, allowing the
      // blockchain transaction success to be communicated to the user with a
      // partial success message. If you want the whole operation to fail when
      // backoffice registration fails, uncomment the line below:
      // throw backofficeError;
    }

    if (backofficeSuccess) {
      success.value = `Movimiento ejecutado exitosamente. ID de transacción: ${response.id}`;
    } else {
      success.value = `Transacción blockchain exitosa (ID: ${response.id}), pero el registro en backoffice falló. Contacte al administrador.`;
    }

    if (movementsTableRef.value) {
      movementsTableRef.value.refresh();
    }

    setTimeout(() => {
      formData.value = {
        token: '',
        operationType: '',
        originWallet: props.walletId || '',
        provider: '',
        destinationWallet: '',
        amount: '',
        transactionSpeed: '',
        notes: '',
      };
      success.value = '';
    }, 5000);
  } catch (err: any) {
    console.error('[ExecuteMovementForm] Error creating transaction:', err);
    error.value =
      err.response?.data?.message || err.message || 'Error al ejecutar el movimiento. Por favor, intente nuevamente.';
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => props.walletId,
  (newId) => {
    if (newId) {
      formData.value.originWallet = newId;
    }
  },
);

watch(
  () => props.walletToken,
  (newToken) => {
    const normalizedToken = newToken?.toUpperCase();
    if (normalizedToken && availableTokens.value.some((t) => t.symbol === normalizedToken)) {
      formData.value.token = normalizedToken;
      updateOriginWallets();
      updateDestinationWallets();
    }
  },
);

watch(
  () => formData.value.token,
  () => {
    updateOriginWallets();
    updateDestinationWallets();
    estimateTransactionFee();
  },
);

watch(
  () => formData.value.operationType,
  () => {
    formData.value.provider = '';
    updateDestinationWallets();
  },
);

watch(
  () => formData.value.originWallet,
  () => {
    if (formData.value.operationType === 'internal_rebalancing') {
      updateDestinationWallets();
    }
    estimateTransactionFee();
  },
);

watch(
  () => formData.value.destinationWallet,
  (newValue, oldValue) => {
    if (oldValue && newValue !== oldValue) {
      formData.value.transactionSpeed = '';
    }
    estimateTransactionFee();
  },
);

let amountTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => formData.value.amount,
  () => {
    if (amountTimeout) {
      clearTimeout(amountTimeout);
    }
    amountTimeout = setTimeout(() => {
      estimateTransactionFee();
      amountTimeout = null;
    }, 500);
  },
);

onMounted(() => {
  loadWallets();
});

onBeforeUnmount(() => {
  if (amountTimeout) {
    clearTimeout(amountTimeout);
    amountTimeout = null;
  }
});
</script>
