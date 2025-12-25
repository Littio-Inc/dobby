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
                  inputmode="decimal"
                  :disabled="!!quote.disabled"
                  class="w-36 px-3 py-2 border border-neutral-40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky bg-white disabled:bg-neutral-20 disabled:cursor-not-allowed"
                  placeholder="Monto a cotizar"
                  @input="handleAmountInput(index, ($event.target as HTMLInputElement).value)"
                  @keydown="handleNumericKeyDown"
                />
              </td>

              <!-- De (From Currency) -->
              <td class="p-4">
                <select
                  :value="quote.from || (quote.provider === 'Cobre' ? 'USD' : 'USDC')"
                  :disabled="!!quote.disabled"
                  class="w-28 px-3 py-2 border border-neutral-40 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer disabled:bg-neutral-20 disabled:cursor-not-allowed"
                  @change="
                    $emit('update:quote', index, {
                      ...quote,
                      from: ($event.target as HTMLSelectElement).value || (quote.provider === 'Cobre' ? 'USD' : 'USDC'),
                    })
                  "
                >
                  <option
                    v-if="quote.provider === 'Cobre'"
                    value="USD"
                  >
                    USD
                  </option>
                  <template v-else>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </template>
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
                    v-if="quote.provider === 'Kira' || quote.provider === 'Cobre' || quote.provider === 'Cotizar'"
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
                  v-if="(quote.provider === 'Kira' || quote.provider === 'Cobre') && quote.from"
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
                  v-if="(quote.provider === 'Kira' || quote.provider === 'Cobre') && quote.disabled !== true"
                  type="button"
                  class="h-8 w-8 rounded-full bg-white border border-neutral-40 hover:bg-neutral-20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="quote.provider === 'Kira' ? $emit('quote', index, quote) : $emit('refresh', index, quote)"
                  :title="quote.provider === 'Kira' ? 'Cotizar' : 'Refrescar tasa'"
                >
                  <svg
                    class="w-4 h-4 text-neutral-70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
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
  usdBalance?: number; // USD balance for Cobre
  selectedProvider?: string;
}>();

const emit = defineEmits<{
  'update:quote': [index: number, quote: Quote];
  quote: [index: number, quote: Quote];
  'select:provider': [provider: string];
  refresh: [index: number, quote: Quote];
}>();

// Get balance for a specific currency
const getBalanceForCurrency = (currency: string): number => {
  if (currency === 'USDC') {
    return props.usdcBalance ?? 0;
  }
  if (currency === 'USDT') {
    return props.usdtBalance ?? 0;
  }
  if (currency === 'USD') {
    // For USD, prioritize USD balance prop (for Cobre)
    // Only use USDC as fallback if USD balance is explicitly not provided (undefined)
    if (props.usdBalance !== undefined) {
      return props.usdBalance;
    }
    // Fallback to USDC balance only if USD balance is not provided
    return props.usdcBalance ?? 0;
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

// Helper to validate numeric input (allows numbers, dot, and comma)
const handleNumericKeyDown = (e: KeyboardEvent) => {
  // Allow control and navigation keys
  if (
    [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ].includes(e.key) ||
    (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
  ) {
    return;
  }
  // Only allow numbers, dot, and comma
  if (!/^[0-9.,]$/.test(e.key)) {
    e.preventDefault();
  }
};

const handleAmountInput = (index: number, value: string) => {
  const currentQuote = props.quotes[index];

  // Only allow numeric characters, dots, and commas
  const cleanedValue = value.replace(/[^\d.,]/g, '');

  // Ensure only one decimal separator
  const parts = cleanedValue.split(/[,.]/);
  const formattedValue = parts.length > 2 ? parts[0] + (parts[1] ? ',' + parts.slice(1).join('') : '') : cleanedValue;

  emit('update:quote', index, {
    ...currentQuote,
    amount: formattedValue,
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
