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
              <th class="text-right p-4 font-semibold text-sm text-neutral-80">Monto</th>
              <th class="text-right p-4 font-semibold text-sm text-neutral-80">Cotización Tasa</th>
              <th class="text-center p-4 font-semibold text-sm text-neutral-80">Spread</th>
              <th class="text-left p-4 font-semibold text-sm text-neutral-80">Proveedores</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(quote, index) in quotes"
              :key="index"
              class="border-b border-neutral-10 hover:bg-neutral-20/20 transition-colors"
            >
              <!-- Cotización (Input) -->
              <td class="p-4">
                <input
                  :value="quote.amount"
                  type="text"
                  class="w-36 px-3 py-2 border border-neutral-40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky bg-white"
                  placeholder="Monto a cotizar"
                  @input="handleAmountInput(index, ($event.target as HTMLInputElement).value)"
                />
              </td>

              <!-- De (From Currency) -->
              <td class="p-4">
                <select
                  :value="quote.from"
                  class="w-28 px-3 py-2 border border-neutral-40 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer"
                  @change="$emit('update:quote', index, { ...quote, from: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
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
                  class="w-28 px-3 py-2 border border-neutral-40 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer"
                  @change="$emit('update:quote', index, { ...quote, to: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="COP">COP</option>
                  <option value="BRL">BRL</option>
                  <option value="MXN">MXN</option>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </td>

              <!-- Monto (Calculated Amount) -->
              <td class="p-4 text-right font-semibold">
                <span class="text-sm text-neutral-80">
                  {{ quote.calculatedAmount || '-' }}
                </span>
              </td>

              <!-- Cotización Tasa (Rate) -->
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
}

const props = defineProps<{
  quotes: Quote[];
}>();

const emit = defineEmits<{
  'update:quote': [index: number, quote: Quote];
}>();

const handleAmountInput = (index: number, value: string) => {
  emit('update:quote', index, { ...props.quotes[index], amount: value });
};

const getSpreadBadgeClass = (spread: string) => {
  if (!spread) return 'bg-neutral-20 text-neutral-70';
  const bp = parseInt(spread.replace('bp', ''));
  if (bp <= 15) return 'bg-green-100 text-green-700';
  if (bp <= 20) return 'bg-yellow-100 text-yellow-700';
  return 'bg-orange-100 text-orange-700';
};
</script>
