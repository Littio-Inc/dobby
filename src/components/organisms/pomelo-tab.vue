<template>
  <div class="space-y-6">
    <QuotesTable
      :quotes="quotes"
      @update:quote="handleQuoteUpdate"
    />

    <ProviderRecipientCard
      :selected-provider="selectedProvider"
      :selected-recipient="selectedRecipient"
      :recipients="recipients"
      :available-providers="availableProviders"
      :formatted-total-amount="formattedTotalAmount"
      :can-monetize="canMonetize"
      :is-processing="isProcessing"
      @update:selected-provider="selectedProvider = $event"
      @update:selected-recipient="selectedRecipient = $event"
      @monetize="handleMonetize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import QuotesTable from '../molecules/quotes-table.vue';
import ProviderRecipientCard from '../molecules/provider-recipient-card.vue';

interface Quote {
  amount: string;
  from: string;
  to: string;
  calculatedAmount: string;
  rate: string;
  spread: string;
  provider: string;
}

interface Recipient {
  id: string;
  name?: string;
  bank?: string;
  account_type?: string;
  account_number?: string;
  type?: string;
}

const props = defineProps<{
  quotes: Quote[];
  recipients: Recipient[];
  availableProviders: Array<{ value: string; label: string; disabled: boolean }>;
}>();

const emit = defineEmits<{
  monetize: [data: any];
}>();

const selectedProvider = ref('supra');
const selectedRecipient = ref('');
const isProcessing = ref(false);

const formattedTotalAmount = computed(() => {
  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);
  if (!selectedQuote || !selectedQuote.calculatedAmount || selectedQuote.calculatedAmount === '-') {
    if (selectedProvider.value === 'supra') {
      return '$3.200.000 COP';
    }
    return '-';
  }
  const currency = selectedQuote.to === 'COP' ? 'COP' : selectedQuote.to;
  return `$${selectedQuote.calculatedAmount} ${currency}`;
});

const canMonetize = computed(() => {
  return selectedProvider.value && selectedRecipient.value && formattedTotalAmount.value !== '-';
});

const handleQuoteUpdate = (index: number, quote: Quote) => {
  Object.assign(props.quotes[index], quote);
  updateQuote(index);
};

const updateQuote = (index: number) => {
  const quote = props.quotes[index];
  if (!quote.amount) {
    quote.calculatedAmount = '-';
    return;
  }

  try {
    const cleanAmount = quote.amount.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) {
      quote.calculatedAmount = '-';
      return;
    }

    const cleanRate = quote.rate.replace(/\./g, '').replace(',', '.');
    const rate = parseFloat(cleanRate);
    if (!isNaN(rate) && rate > 0) {
      const calculated = amount * rate;
      quote.calculatedAmount = calculated.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      quote.calculatedAmount = '-';
    }
  } catch (err) {
    console.error('Error calculating quote:', err);
    quote.calculatedAmount = '-';
  }
};

const handleMonetize = () => {
  if (!canMonetize.value) return;
  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);
  if (!selectedQuote) return;

  emit('monetize', {
    recipient_id: selectedRecipient.value,
    provider: selectedProvider.value,
    from_currency: selectedQuote.from,
    to_currency: selectedQuote.to,
    amount: selectedQuote.amount ? parseFloat(selectedQuote.amount.replace(/\./g, '').replace(',', '.')) : 0,
    rate: parseFloat(selectedQuote.rate.replace(/\./g, '').replace(',', '.')),
  });
};
</script>
