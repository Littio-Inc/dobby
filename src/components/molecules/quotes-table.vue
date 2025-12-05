<template>
  <div class="bg-white rounded-lg border border-neutral-20 shadow-md overflow-hidden">
    <div class="p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b bg-neutral-20/30">
              <th class="text-left p-4 font-semibold text-sm text-neutral-80">Cotización</th>
              <th class="text-left p-4 font-semibold text-sm text-neutral-80">De</th>
              <th class="text-center p-4 font-semibold text-sm text-neutral-80"></th>
              <th class="text-left p-4 font-semibold text-sm text-neutral-80">Hacia</th>
              <th class="text-right p-4 font-semibold text-sm text-neutral-80">Saldo</th>
              <th class="text-center p-4 font-semibold text-sm text-neutral-80">Cotizar</th>
              <th class="text-right p-4 font-semibold text-sm text-neutral-80">Monto</th>
              <th class="text-right p-4 font-semibold text-sm text-neutral-80">Cotización Tasa</th>
              <th class="text-center p-4 font-semibold text-sm text-neutral-80">Spread</th>
              <th class="text-left p-4 font-semibold text-sm text-neutral-80">Proveedores</th>
              <th class="text-center p-4 font-semibold text-sm text-neutral-80">Seleccionar</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(quote, index) in quotes"
              :key="index"
              :class="[
                'border-b border-neutral-10 transition-colors',
                quote.disabled === true ? 'opacity-50 bg-neutral-10' : 'hover:bg-neutral-20/20',
              ]"
            >
              <td class="p-4">
                <input
                  :value="quote.amount"
                  type="text"
                  :disabled="!!quote.disabled"
                  class="w-36 px-3 py-2 border border-neutral-40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky bg-white disabled:bg-neutral-20 disabled:cursor-not-allowed"
                  placeholder="Monto a cotizar"
                  @input="handleAmountInput(index, ($event.target as HTMLInputElement).value)"
                />
              </td>

              <!-- De (From Currency) -->
              <td class="p-4">
                <select
                  :value="quote.from || 'USDC'"
                  :disabled="!!quote.disabled"
                  class="w-28 px-3 py-2 border border-neutral-40 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer disabled:bg-neutral-20 disabled:cursor-not-allowed"
                  @change="
                    $emit('update:quote', index, {
                      ...quote,
                      from: ($event.target as HTMLSelectElement).value || 'USDC',
                    })
                  "
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </td>

              <!-- Arrow -->
              <td class="p-4 text-center">
                <svg
                  class="w-5 h-5 text-neutral-60 inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </td>

              <!-- Hacia (To Currency) -->
              <td class="p-4">
                <select
                  :value="quote.to"
                  :disabled="!!quote.disabled"
                  class="w-28 px-3 py-2 border border-neutral-40 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer disabled:bg-neutral-20 disabled:cursor-not-allowed"
                  @change="$emit('update:quote', index, { ...quote, to: ($event.target as HTMLSelectElement).value })"
                >
                  <option
                    v-if="quote.provider === 'Kira' || quote.provider === 'Cotizar'"
                    value="COP"
                  >
                    COP
                  </option>
                  <template v-else>
                    <option value="COP">COP</option>
                  </template>
                </select>
              </td>

              <td class="p-4 text-right">
                <span
                  v-if="quote.provider === 'Kira' && quote.from"
                  class="text-sm font-medium text-neutral-80"
                >
                  {{ formatBalance(getBalanceForCurrency(quote.from)) }}
                </span>
                <span
                  v-else
                  class="text-neutral-60"
                  >-</span
                >
              </td>

              <td class="p-4 text-center">
                <button
                  v-if="quote.provider === 'Kira' && quote.disabled !== true"
                  type="button"
                  class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg text-sm font-medium hover:bg-littio-secondary-sky/90 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
                  @click="$emit('quote', index, quote)"
                >
                  Cotizar
                </button>
                <span
                  v-else
                  class="text-neutral-60"
                  >-</span
                >
              </td>

              <td class="p-4 text-right font-semibold">
                <span class="text-sm text-neutral-80">
                  {{ quote.calculatedAmount || '-' }}
                </span>
              </td>

              <td class="p-4 text-right">
                <span class="text-sm font-mono text-neutral-80">
                  {{ quote.rate || '-' }}
                </span>
              </td>

              <!-- Spread (Badge) -->
              <td class="p-4 text-center">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                    getSpreadBadgeClass(quote.spread),
                  ]"
                >
                  {{ quote.spread || '-' }}
                </span>
              </td>

              <!-- Proveedores (Provider Badge) -->
              <td class="p-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-20 text-neutral-70"
                >
                  {{ quote.provider || '-' }}
                </span>
              </td>

              <!-- Seleccionar (Radio Button) -->
              <td class="p-4 text-center">
                <input
                  v-if="quote.disabled !== true"
                  type="radio"
                  :name="`provider-${quote.provider}`"
                  :checked="selectedProvider === quote.provider.toLowerCase()"
                  :disabled="!!quote.disabled"
                  class="w-4 h-4 text-littio-secondary-sky focus:ring-littio-secondary-sky focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                  @change="$emit('select:provider', quote.provider.toLowerCase())"
                />
                <span
                  v-else
                  class="text-neutral-60"
                  >-</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Quote {
  amount: string;
  from: string;
  to: string;
  calculatedAmount: string;
  rate: string;
  spread: string;
  provider: string;
  disabled?: boolean;
}

const props = defineProps<{
  quotes: Quote[];
  usdcBalance?: number;
  usdtBalance?: number;
  selectedProvider?: string;
}>();

const emit = defineEmits<{
  'update:quote': [index: number, quote: Quote];
  quote: [index: number, quote: Quote];
  'select:provider': [provider: string];
}>();

// Get balance for a specific currency
const getBalanceForCurrency = (currency: string): number => {
  if (currency === 'USDC') {
    return props.usdcBalance ?? 0;
  }
  if (currency === 'USDT') {
    return props.usdtBalance ?? 0;
  }
  return 0;
};

// Format balance for display
const formatBalance = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const handleAmountInput = (index: number, value: string) => {
  const currentQuote = props.quotes[index];
  emit('update:quote', index, {
    ...currentQuote,
    amount: value,
    // Ensure 'from' has a default value if empty
    from: currentQuote.from || 'USDC',
  });
};

const getSpreadBadgeClass = (spread: string) => {
  if (!spread) return 'bg-neutral-20 text-neutral-70';
  const bp = parseInt(spread.replace('bp', ''));
  if (bp <= 15) return 'bg-green-100 text-green-700';
  if (bp <= 20) return 'bg-yellow-100 text-yellow-700';
  return 'bg-orange-100 text-orange-700';
};
</script>
