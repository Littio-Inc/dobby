<template>
  <div class="space-y-6">
    <QuotesTable
      :quotes="quotes"
      :usdt-balance="usdtBalance"
      :usd-balance="usdBalance"
      :selected-provider="selectedProvider"
      @update:quote="handleQuoteUpdate"
      @quote="handleQuote"
      @refresh="handleRefresh"
      @select:provider="handleProviderSelect"
    />

    <ProviderRecipientCard
      :selected-provider="selectedProvider"
      :selected-recipient="selectedRecipient"
      :available-providers="availableProviders"
      :formatted-total-amount="formattedTotalAmount"
      :can-monetize="canMonetize"
      :is-processing="isProcessing"
      :recipient-disabled="true"
      @update:selected-recipient="selectedRecipient = $event"
      @monetize="handleMonetize"
    />

    <!-- Dialog Modal -->
    <DialogModal
      :is-open="dialog.isOpen"
      :title="dialog.title"
      :message="dialog.message"
      :type="dialog.type"
      :show-confirm="dialog.showConfirm"
      :confirm-text="dialog.confirmText"
      :cancel-text="dialog.cancelText"
      :is-loading="dialog.isLoading"
      @close="closeDialog"
      @confirm="handleConfirmDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import QuotesTable from '../molecules/quotes-table.vue';
import ProviderRecipientCard from '../molecules/provider-recipient-card.vue';
import DialogModal from '../atoms/dialog-modal.vue';
import { getQuote, createPayout, WALLET_IDS, Provider } from '../../services';
import { $userId } from '../../stores/auth-store';
import { useStore } from '@nanostores/vue';

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
  availableProviders: Array<{ value: string; label: string; disabled: boolean }>;
  usdtBalance?: number;
  usdBalance?: number; // USD balance for Cobre
}>();

const emit = defineEmits<{
  monetize: [data: any];
  'update:quotes': [quotes: Quote[]];
}>();

const selectedProvider = ref('cobre');
const selectedRecipient = ref('');
const isProcessing = ref(false);
const savedQuote = ref<any>(null);
const currentUserId = useStore($userId);

// Helper function to convert string to Provider enum
const stringToProvider = (providerStr: string): Provider => {
  const normalized = (providerStr || '').toLowerCase();
  if (normalized === 'cobre') return Provider.COBRE;
  // Default to COBRE for B2C
  return Provider.COBRE;
};

// Dialog state
const dialog = ref({
  isOpen: false,
  title: 'Información',
  message: '',
  type: 'info' as 'info' | 'error' | 'success',
  showConfirm: false,
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isLoading: false,
});

// B2C doesn't use recipients

const formattedTotalAmount = computed(() => {
  // Show amount when provider is selected, even if not quoted yet
  if (!selectedProvider.value) {
    return '-';
  }

  const selectedQuote = props.quotes.find(
    (q) => (q.provider || '').toLowerCase() === (selectedProvider.value || '').toLowerCase(),
  );

  // If quote has calculated amount, show it
  if (selectedQuote && selectedQuote.calculatedAmount && selectedQuote.calculatedAmount !== '-') {
    const currency = selectedQuote.to === 'COP' ? 'COP' : selectedQuote.to === 'USD' ? 'USD' : selectedQuote.to;
    return `$${selectedQuote.calculatedAmount} ${currency}`;
  }

  // If provider is selected but no quote yet, show placeholder or rate-based calculation
  if (selectedQuote && selectedQuote.amount && selectedQuote.rate && selectedQuote.rate !== '-') {
    try {
      const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
      const cleanRate = selectedQuote.rate.replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(cleanAmount);
      const rate = parseFloat(cleanRate);
      if (!isNaN(amount) && !isNaN(rate) && amount > 0 && rate > 0) {
        const calculated = amount * rate;
        const currency = selectedQuote.to === 'COP' ? 'COP' : selectedQuote.to === 'USD' ? 'USD' : selectedQuote.to;
        return `$${calculated.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} ${currency}`;
      }
    } catch (e) {
      console.warn('Error calculating amount:', e);
    }
  }

  // Default: show placeholder or empty
  return '-';
});

const canMonetize = computed(() => {
  // Must have provider selected (radio button must be selected)
  if (!selectedProvider.value) return false;

  // B2C doesn't require recipient (it's disabled)

  // Must have a selected quote that matches the selected provider
  const selectedQuote = props.quotes.find(
    (q) => (q.provider || '').toLowerCase() === (selectedProvider.value || '').toLowerCase(),
  );
  if (!selectedQuote) return false;

  // Must have amount entered
  if (!selectedQuote.amount || selectedQuote.amount.trim() === '') return false;

  // Must have valid amount (greater than 0)
  try {
    const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) return false;
  } catch (error) {
    console.warn('Error parsing amount in canMonetize:', error);
    return false;
  }

  // For Cobre, must have complete quote data (calculatedAmount and rate)
  const providerLower = (selectedProvider.value || '').toLowerCase();
  if (providerLower === 'cobre') {
    // Must have calculated amount (from quote or automatic calculation)
    if (!selectedQuote.calculatedAmount || selectedQuote.calculatedAmount === '-') return false;
    // Must have a valid rate (from quote)
    if (!selectedQuote.rate || selectedQuote.rate === '-') return false;
    // Must have spread (optional but indicates quote was obtained)
    // Note: spread can be '-' for some quotes, so we don't require it
    return true;
  }

  // All validations passed
  return true;
});

const handleProviderSelect = (provider: string) => {
  selectedProvider.value = provider;
  selectedRecipient.value = ''; // Reset recipient when provider changes

  // B2C doesn't load recipients (recipient is disabled)
};

// Helper function to update quote with calculated amount
const updateQuoteWithValue = (index: number, quote: Quote, updatedQuotes: Quote[]) => {
  let updatedQuote = { ...quote };

  if (!quote.amount) {
    updatedQuote.calculatedAmount = '-';
    // Preserve disabled property
    updatedQuote.disabled = quote.disabled;
    updatedQuotes[index] = updatedQuote;
    emit('update:quotes', updatedQuotes);
    return;
  }

  try {
    const cleanAmount = quote.amount.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) {
      updatedQuote.calculatedAmount = '-';
      // Preserve disabled property
      updatedQuote.disabled = quote.disabled;
      updatedQuotes[index] = updatedQuote;
      emit('update:quotes', updatedQuotes);
      return;
    }

    // For Cobre, use the fixed rate if available
    const cleanRate = quote.rate.replace(/\./g, '').replace(',', '.');
    const rate = parseFloat(cleanRate);
    if (!isNaN(rate) && rate > 0) {
      const calculated = amount * rate;
      // Format all currencies with 2 decimals
      updatedQuote.calculatedAmount = calculated.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      updatedQuote.calculatedAmount = '-';
    }
  } catch (e) {
    console.warn('Error calculating quote amount:', e);
    updatedQuote.calculatedAmount = '-';
  }

  // Preserve disabled property
  updatedQuote.disabled = quote.disabled;

  // Emit update to parent
  updatedQuotes[index] = updatedQuote;
  emit('update:quotes', updatedQuotes);
};

const handleQuoteUpdate = (index: number, quote: Quote) => {
  const currentQuote = props.quotes[index];

  // Always preserve disabled property from currentQuote (don't allow it to be overridden)
  // This ensures that quotes that are enabled stay enabled
  const preservedDisabled = currentQuote.disabled !== undefined ? currentQuote.disabled : false;

  // Create updated quote with preserved disabled property
  const updatedQuote = { ...currentQuote, ...quote, disabled: preservedDisabled };
  const updatedQuotes = [...props.quotes];
  updatedQuotes[index] = updatedQuote;

  // For Cobre, always calculate automatically when amount changes
  const providerLower = (quote.provider || '').toLowerCase();
  if (providerLower === 'cobre' && quote.amount) {
    // Calculate using the updated quote
    updateQuoteWithValue(index, updatedQuote, updatedQuotes);
    return;
  }

  // Don't call updateQuote if we already have a calculatedAmount from a quote API
  // This prevents overwriting the calculatedAmount from the API response
  if (currentQuote.calculatedAmount && currentQuote.calculatedAmount !== '-') {
    // If we already have a calculated amount (from quote API), just update the quote object
    emit('update:quotes', updatedQuotes);
  } else {
    // Otherwise, use the updateQuote logic for manual calculation
    updateQuoteWithValue(index, updatedQuote, updatedQuotes);
  }
};

const handleRefresh = async (index: number, quote: Quote) => {
  // For Cobre, refresh means getting a new quote from API
  const providerLower = (quote.provider || '').toLowerCase();
  if (providerLower === 'cobre' && quote.amount) {
    await handleQuote(index, quote);
  }
};

const showDialog = (
  title: string,
  message: string,
  type: 'info' | 'error' | 'success' = 'info',
  showConfirm = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
) => {
  dialog.value = {
    isOpen: true,
    title,
    message,
    type,
    showConfirm,
    confirmText,
    cancelText,
    isLoading,
  };
};

const closeDialog = () => {
  dialog.value.isOpen = false;
  dialog.value.showConfirm = false;
  dialog.value.isLoading = false;
};

// Store payout data for confirmation
const pendingPayoutData = ref<any>(null);

const handleConfirmDialog = async () => {
  if (pendingPayoutData.value) {
    // Show loading state in dialog immediately
    dialog.value.isLoading = true;
    // Use nextTick to ensure Vue updates the DOM before starting the async operation
    await nextTick();

    // Don't close the dialog yet, wait for executePayout to complete
    try {
      await executePayout(pendingPayoutData.value);
      pendingPayoutData.value = null;
    } catch {
      // Error is already handled in executePayout, just reset loading state
      dialog.value.isLoading = false;
    }
  } else {
    closeDialog();
  }
};

const handleQuote = async (index: number, quote: Quote) => {
  if (!quote.amount) {
    showDialog('Monto requerido', 'Por favor ingresa un monto para cotizar', 'info');
    return;
  }

  // Clean amount for parsing
  const cleanAmount = quote.amount.replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(cleanAmount);

  if (isNaN(amount) || amount <= 0) {
    showDialog('Monto inválido', 'Por favor ingresa un monto válido', 'error');
    return;
  }

  // Validate balance for selected currency BEFORE making the request
  const usdBalance = props.usdBalance ?? 0; // USD balance for Cobre

  if (quote.from === 'USD') {
    if (amount > usdBalance) {
      showDialog(
        'Saldo insuficiente',
        `El monto a cotizar (${amount.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD) es mayor al saldo disponible (${usdBalance.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD)`,
        'error',
      );
      return;
    }
  }

  try {
    // Call quote API - B2C uses USD or COP as base currency
    // Use quote.provider if available, otherwise use selectedProvider
    const providerStr = quote.provider?.toLowerCase() || selectedProvider.value || 'cobre';
    const quoteResponse = await getQuote('pay', {
      amount,
      base_currency: quote.from, // Use the selected from currency (USD or COP)
      quote_currency: quote.to, // Use the selected to currency (COP or USD)
      provider: stringToProvider(providerStr), // Use provider from quote or selected provider
    });

    // Guardar el quote en una variable
    savedQuote.value = quoteResponse;

    // Format rate from quote response (use rate if available, otherwise balam_rate)
    const rateValue = quoteResponse.rate || quoteResponse.balam_rate || 0;
    const formattedRate = rateValue.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Format quote_amount as number with thousand separators
    const formattedAmount = quoteResponse.quote_amount.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Format spread from quote response (in basis points)
    let formattedSpread = '-';
    if (quoteResponse.spread !== null && quoteResponse.spread !== undefined) {
      // Round to nearest integer and format as "Xbp"
      const spreadBp = Math.round(quoteResponse.spread);
      formattedSpread = `${spreadBp}bp`;
    }

    // Crear una copia actualizada de las quotes
    const updatedQuotes = [...props.quotes];
    const currentQuote = updatedQuotes[index];
    updatedQuotes[index] = {
      ...currentQuote,
      rate: formattedRate,
      calculatedAmount: formattedAmount,
      spread: formattedSpread,
      // Preserve disabled property
      disabled: currentQuote.disabled,
    };

    // Emitir el evento para actualizar las quotes
    emit('update:quotes', updatedQuotes);
  } catch (error: any) {
    showDialog(
      'Error al obtener cotización',
      error.response?.data?.error?.message || error.message || 'Error al obtener la cotización',
      'error',
    );
  }
};

// B2C doesn't use recipients, so no need for getRecipientDisplayName

const handleMonetize = async () => {
  if (!canMonetize.value) return;
  const selectedQuote = props.quotes.find(
    (q) => (q.provider || '').toLowerCase() === (selectedProvider.value || '').toLowerCase(),
  );
  if (!selectedQuote) return;

  // For Cobre, get quote from API if we don't have one
  const providerLower = (selectedProvider.value || '').toLowerCase();
  if (providerLower === 'cobre' && !savedQuote.value) {
    try {
      isProcessing.value = true;
      const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(cleanAmount);
      // Use the selected from currency (USD or COP)
      const baseCurrency = selectedQuote.from;
      const quoteResponse = await getQuote('pay', {
        amount,
        base_currency: baseCurrency,
        quote_currency: selectedQuote.to,
        provider: stringToProvider(selectedProvider.value),
      });
      savedQuote.value = quoteResponse;
    } catch (error: any) {
      isProcessing.value = false;
      const errorMessage =
        error.response?.data?.detail?.error?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.detail?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Error al obtener la cotización';
      showDialog('Error', errorMessage, 'error');
      return;
    } finally {
      isProcessing.value = false;
    }
  }

  // Validate that we have a saved quote (for Cobre)
  if (providerLower === 'cobre' && !savedQuote.value) {
    showDialog('Error', 'Por favor, primero cotiza el monto antes de monetizar', 'error');
    return;
  }

  // B2C doesn't require recipient (it's disabled)

  // Parse amount from input (remove dots and replace comma with dot)
  const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(cleanAmount);

  if (isNaN(amount) || amount <= 0) {
    showDialog('Error', 'El monto ingresado no es válido', 'error');
    return;
  }

  // Format rate from saved quote (use rate if available, otherwise balam_rate)
  const rateValue = savedQuote.value?.rate || savedQuote.value?.balam_rate || 0;
  const rate = rateValue.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format amounts with null-safe access
  const fromAmount = (savedQuote.value?.base_amount ?? 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const toAmount = (savedQuote.value?.quote_amount ?? 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Build confirmation message (B2C doesn't include recipient)
  const confirmationMessage = `Por favor, confirma los siguientes detalles del pago:\n\n💰 Monto: ${fromAmount} ${selectedQuote.from} → ${toAmount} ${selectedQuote.to}\n📊 Tasa: ${rate}\n\n¿Deseas continuar con el pago?`;

  // Prepare payout data for later execution
  // For B2C, use token based on from currency
  const token = selectedQuote.from === 'USD' ? 'USDC' : 'USDT'; // USD uses USDC, COP would use USDT (but COP is not a token, so this is for USD->COP)
  const walletId = WALLET_IDS.PAY; // B2C uses pay wallet
  const reference = `payout-${Date.now()}`;

  // Determine user_id based on provider
  let userId: string | undefined;
  if (currentUserId.value) {
    // For Cobre, use user_id from database (obtained from login)
    userId = currentUserId.value;
  }
  // If no user_id available, Azkaban will obtain it from database

  // B2C doesn't send recipient_id in payout - it's exchange-only
  pendingPayoutData.value = {
    wallet_id: walletId,
    reference: reference,
    base_currency: selectedQuote.from, // Use the selected from currency
    quote_currency: selectedQuote.to, // Use the selected to currency
    amount: savedQuote.value?.base_amount ?? 0,
    quote_id: savedQuote.value?.quote_id,
    quote: savedQuote.value,
    token: token,
    provider: stringToProvider(selectedProvider.value),
    user_id: userId, // Optional: will be set by Azkaban if not provided
    exchange_only: true, // Flag to indicate this is exchange-only (no recipient)
  };

  // Show confirmation dialog
  showDialog('Confirmar Pago', confirmationMessage, 'info', true, 'Confirmar Pago', 'Cancelar');
};

const executePayout = async (payoutData: any) => {
  try {
    isProcessing.value = true;
    dialog.value.isLoading = true;

    // Call createPayout API
    const response = await createPayout('pay', payoutData);

    // Close loading dialog first
    dialog.value.isLoading = false;
    closeDialog();

    // Success - show dialog with payout_id
    const successMessage = `El pago se ha generado exitosamente.\n\n📋 Payout ID:\n${response.payout_id}\n\n✅ Estado: ${response.status}\n💰 Monto: ${response.from_amount} ${response.from_currency} → ${response.to_amount} ${response.to_currency}`;
    showDialog('Pago Generado Exitosamente', successMessage, 'success', false, 'Confirmar', 'Cerrar', false);

    // Emit monetize event for parent component to handle (e.g., reload balances)
    emit('monetize', {
      payout_id: response.payout_id,
      status: response.status,
    });

    // Reset form (B2C doesn't have recipient to reset)
    const updatedQuotes = props.quotes.map((q) => {
      if ((q.provider || '').toLowerCase() === (selectedProvider.value || '').toLowerCase()) {
        return {
          ...q,
          amount: '',
          calculatedAmount: '-',
          rate: '-',
          // Preserve disabled property
          disabled: q.disabled,
        };
      }
      return q;
    });
    emit('update:quotes', updatedQuotes);
    savedQuote.value = null;
    pendingPayoutData.value = null;
  } catch (error: any) {
    // Close loading dialog first
    dialog.value.isLoading = false;

    // Extract error message from different possible locations
    let errorMessage = 'Error desconocido al crear el payout';

    if (error.response?.data) {
      // Try different error message formats
      const data = error.response.data;

      // Handle FastAPI error format: {"detail": "message"} or {"detail": {"error": {"message": "...", "code": "..."}}}
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (data.detail?.error?.message) {
        errorMessage = data.detail.error.message;
      } else if (data.error?.message) {
        errorMessage = data.error.message;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (typeof data.detail === 'object') {
        errorMessage = JSON.stringify(data.detail);
      } else {
        errorMessage = JSON.stringify(data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    showDialog('Error al Generar el Pago', errorMessage, 'error', false, 'Confirmar', 'Cerrar', false);
  } finally {
    isProcessing.value = false;
  }
};
</script>
