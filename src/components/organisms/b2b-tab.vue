<template>
  <div class="space-y-6">
    <QuotesTable
      :quotes="quotes"
      :usdc-balance="usdcBalance"
      :usdt-balance="usdtBalance"
      :usd-balance="usdBalance"
      :supra-usd-balance="supraUsdBalance"
      :selected-provider="selectedProvider"
      @update:quote="handleQuoteUpdate"
      @quote="handleQuote"
      @refresh="handleRefresh"
      @select:provider="handleProviderSelect"
    />

    <ProviderRecipientCard
      :selected-provider="selectedProvider"
      :selected-recipient="selectedRecipient"
      :recipients="localRecipients.length > 0 ? localRecipients : recipients"
      :available-providers="availableProviders"
      :formatted-total-amount="formattedTotalAmount"
      :can-monetize="canMonetize"
      :is-processing="isProcessing"
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
import { getQuote, getRecipients, createPayout, USER_IDS, WALLET_IDS, Provider, type Recipient } from '../../services';
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
}

const props = defineProps<{
  quotes: Quote[];
  recipients: Recipient[];
  availableProviders: Array<{ value: string; label: string; disabled: boolean }>;
  usdcBalance?: number;
  usdtBalance?: number;
  usdBalance?: number; // USD balance for Cobre
  supraUsdBalance?: number; // USD balance for Supra
}>();

const emit = defineEmits<{
  monetize: [data: any];
  'update:quotes': [quotes: Quote[]];
}>();

const selectedProvider = ref('');
const selectedRecipient = ref('');
const isProcessing = ref(false);
const savedQuote = ref<any>(null);
const isLoadingRecipients = ref(false);

// Helper function to convert string to Provider enum
const stringToProvider = (providerStr: string): Provider => {
  const normalized = (providerStr || '').toLowerCase();
  if (normalized === 'kira') return Provider.KIRA;
  if (normalized === 'cobre') return Provider.COBRE;
  if (normalized === 'supra') return Provider.SUPRA;
  // Default to KIRA if unknown
  return Provider.KIRA;
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

// Local recipients state (loaded from API)
const localRecipients = ref<Recipient[]>([]);

const formattedTotalAmount = computed(() => {
  // Show amount when provider is selected, even if not quoted yet
  if (!selectedProvider.value) {
    return '-';
  }

  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);

  // If quote has calculated amount, show it
  if (selectedQuote && selectedQuote.calculatedAmount && selectedQuote.calculatedAmount !== '-') {
    const currency = selectedQuote.to === 'COP' ? 'COP' : selectedQuote.to;
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
        const currency = selectedQuote.to === 'COP' ? 'COP' : selectedQuote.to;
        return `$${calculated.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} ${currency}`;
      }
    } catch {
      // Ignore calculation errors
    }
  }

  // Default: show placeholder or empty
  return '-';
});

const canMonetize = computed(() => {
  // Must have provider selected
  if (!selectedProvider.value) return false;

  // Must have recipient selected
  if (!selectedRecipient.value) return false;

  // Must have a selected quote with amount
  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);
  if (!selectedQuote) return false;

  // Must have amount entered
  if (!selectedQuote.amount || selectedQuote.amount.trim() === '') return false;

  // Must have valid amount (greater than 0)
  try {
    const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) return false;
  } catch {
    return false;
  }

  // For Cobre and Supra, we don't need a saved quote (they have fixed rate)
  const providerLower = (selectedProvider.value || '').toLowerCase();
  if (providerLower === 'cobre' || providerLower === 'supra') {
    // Must have calculated amount (from automatic calculation)
    if (!selectedQuote.calculatedAmount || selectedQuote.calculatedAmount === '-') return false;
    // Must have a valid rate
    if (!selectedQuote.rate || selectedQuote.rate === '-') return false;
    return true;
  }

  // For other providers (Kira), must have a saved quote
  if (!savedQuote.value) return false;

  // Must have calculated amount (from quote)
  if (!selectedQuote.calculatedAmount || selectedQuote.calculatedAmount === '-') return false;

  // All validations passed
  return true;
});

const handleProviderSelect = async (provider: string) => {
  selectedProvider.value = provider;
  selectedRecipient.value = ''; // Reset recipient when provider changes

  // Load recipients from API when a provider is selected
  if (provider) {
    await loadRecipients();
  }
};

const loadRecipients = async () => {
  if (!selectedProvider.value) return;

  isLoadingRecipients.value = true;
  try {
    const response = await getRecipients('pay', selectedProvider.value);

    if (import.meta.env.DEV) {
    }

    localRecipients.value = response.recipients.map((r) => {
      // Use id if available (UUID), otherwise fallback to recipient_id for compatibility
      const recipientId = r.id || r.recipient_id || '';
      const mapped = {
        id: recipientId, // Use id (UUID) as primary identifier
        recipient_id: recipientId, // Keep for compatibility
        company_name: r.company_name ?? null,
        first_name: r.first_name ?? null,
        middle_name: r.middle_name ?? null,
        last_name: r.last_name ?? null,
        bank: r.account_details?.bank_code || '',
        account_type: r.account_type || '', // Use account_type, NOT account_details.type
        account_number: r.account_details?.account_number || '',
        type: r.type || '',
        phone: r.phone ?? null,
        email: r.email ?? null,
        address: r.address ?? null,
      };

      if (import.meta.env.DEV) {
      }

      return mapped;
    });
  } catch (error: any) {
    showDialog(
      'Error al cargar destinatarios',
      error.response?.data?.error?.message || error.message || 'Error al cargar los destinatarios',
      'error',
    );
    localRecipients.value = [];
  } finally {
    isLoadingRecipients.value = false;
  }
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

    // For Cobre and Supra, use the fixed rate if available
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
  } catch {
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

  // For Cobre and Supra, always calculate automatically when amount changes
  const providerLower = (quote.provider || '').toLowerCase();
  if ((providerLower === 'cobre' || providerLower === 'supra') && quote.amount) {
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
  // For Cobre and Supra, refresh means getting a new quote from API
  const providerLower = (quote.provider || '').toLowerCase();
  if (providerLower === 'cobre' || providerLower === 'supra') {
    if (!quote.amount) {
      showDialog('Monto requerido', 'Por favor ingresa un monto para cotizar', 'info');
      return;
    }
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
    // Small delay to ensure the UI updates
    await new Promise((resolve) => setTimeout(resolve, 50));

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
  const usdcBalance = props.usdcBalance ?? 0;
  const usdtBalance = props.usdtBalance ?? 0;
  const usdBalance = props.usdBalance ?? 0; // USD balance for Cobre

  // Check if provider is Cobre or Supra and currency is USD
  const providerLower = (quote.provider || '').toLowerCase();
  const isCobreUSD = providerLower === 'cobre' && quote.from === 'USD';
  const isSupraUSD = providerLower === 'supra' && quote.from === 'USD';

  if (quote.from === 'USD') {
    // For Cobre, use Cobre USD balance; for Supra, use Supra USD balance; for others, use USD balance or USDC as fallback
    let balance: number;
    if (isCobreUSD) {
      balance = usdBalance;
    } else if (isSupraUSD) {
      balance = supraUsdBalance;
    } else {
      balance = usdBalance > 0 ? usdBalance : usdcBalance;
    }

    if (amount > balance) {
      showDialog(
        'Saldo insuficiente',
        `El monto a cotizar (${amount.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD) es mayor al saldo disponible (${balance.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD)`,
        'error',
      );
      return;
    }
  } else if (quote.from === 'USDC') {
    if (amount > usdcBalance) {
      showDialog(
        'Saldo insuficiente',
        `El monto a cotizar (${amount.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDC) es mayor al saldo disponible (${usdcBalance.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDC)`,
        'error',
      );
      return;
    }
  } else if (quote.from === 'USDT') {
    if (amount > usdtBalance) {
      showDialog(
        'Saldo insuficiente',
        `El monto a cotizar (${amount.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDT) es mayor al saldo disponible (${usdtBalance.toLocaleString('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDT)`,
        'error',
      );
      return;
    }
  }

  try {
    // Call quote API - always send USD to backend
    // Use quote.provider if available, otherwise use selectedProvider
    const providerStr = quote.provider?.toLowerCase() || selectedProvider.value || 'kira';
    const quoteResponse = await getQuote('pay', {
      amount,
      base_currency: 'USD', // Siempre enviar USD al backend
      quote_currency: quote.to,
      provider: stringToProvider(providerStr), // Use provider from quote or selected provider
    });

    // Guardar el quote en una variable
    savedQuote.value = quoteResponse;

    // Format rate from quote response (use rate if available, otherwise balam_rate)
    const rateValue = quoteResponse.rate || quoteResponse.balam_rate;
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

    if (import.meta.env.DEV) {
    }
  } catch (error: any) {
    showDialog(
      'Error al obtener cotización',
      error.response?.data?.error?.message || error.message || 'Error al obtener la cotización',
      'error',
    );
  }
};

// Helper function to get recipient display name
const getRecipientDisplayName = (recipientId: string): string => {
  const recipient =
    localRecipients.value.find((r) => r.id === recipientId) || props.recipients.find((r) => r.id === recipientId);
  if (!recipient) return 'Destinatario no encontrado';

  const parts: string[] = [];
  if (recipient.company_name) parts.push(recipient.company_name);
  if (recipient.first_name) parts.push(recipient.first_name);
  if (recipient.middle_name) parts.push(recipient.middle_name);
  if (recipient.last_name) parts.push(recipient.last_name);

  let displayName = parts.join(' ').trim();
  if (!displayName) displayName = 'Destinatario';

  if (recipient.account_type) {
    displayName += ` (${recipient.account_type})`;
  }

  return displayName;
};

const handleMonetize = async () => {
  if (!canMonetize.value) return;
  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);
  if (!selectedQuote) return;

  // For Cobre and Supra, get quote from API if we don't have one
  const providerLower = (selectedProvider.value || '').toLowerCase();
  if ((providerLower === 'cobre' || providerLower === 'supra') && !savedQuote.value) {
    try {
      isProcessing.value = true;
      const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(cleanAmount);
      // Cobre and Supra use USD
      const baseCurrency = 'USD';
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

  // Validate that we have a saved quote (for non-Cobre/Supra providers)
  if (providerLower !== 'cobre' && providerLower !== 'supra' && !savedQuote.value) {
    showDialog('Error', 'Por favor, primero cotiza el monto antes de monetizar', 'error');
    return;
  }

  // Validate recipient is selected
  if (!selectedRecipient.value) {
    showDialog('Error', 'Por favor, selecciona un destinatario', 'error');
    return;
  }

  // Parse amount from input (remove dots and replace comma with dot)
  const cleanAmount = selectedQuote.amount.replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(cleanAmount);

  if (isNaN(amount) || amount <= 0) {
    showDialog('Error', 'El monto ingresado no es válido', 'error');
    return;
  }

  // Get recipient name
  const recipientName = getRecipientDisplayName(selectedRecipient.value);

  // Format rate from saved quote
  const rate = savedQuote.value.balam_rate.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format amounts
  const fromAmount = savedQuote.value.base_amount.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const toAmount = savedQuote.value.quote_amount.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Build confirmation message
  const confirmationMessage = `Por favor, confirma los siguientes detalles del pago:\n\n💰 Monto: ${fromAmount} ${selectedQuote.from} → ${toAmount} ${selectedQuote.to}\n📊 Tasa: ${rate}\n👤 Destinatario: ${recipientName}\n\n¿Deseas continuar con el pago?`;

  // Prepare payout data for later execution
  // For Cobre (USD), use USDC token; for others, use the same currency
  const token =
    selectedQuote.from === 'USD'
      ? 'USDC'
      : selectedQuote.from === 'USDC'
        ? 'USDC'
        : selectedQuote.from === 'USDT'
          ? 'USDT'
          : 'USDC';
  const walletId = WALLET_IDS.PAY; // B2B uses pay wallet
  const reference = `payout-${Date.now()}`;

  // Get current user ID from auth store
  const currentUserId = useStore($userId);

  // Determine user_id based on provider
  let userId: string | undefined;
  if (selectedProvider.value.toLowerCase() === 'kira') {
    // For Kira, use Kira user_id from environment variables
    userId = USER_IDS.PAY;
  } else if (currentUserId.value) {
    // For other providers (Cobre, Supra), use user_id from database (obtained from login)
    userId = currentUserId.value;
  }
  // If no user_id available, Azkaban will obtain it from database

  pendingPayoutData.value = {
    recipient_id: selectedRecipient.value,
    wallet_id: walletId,
    reference: reference,
    base_currency: 'USD',
    quote_currency: selectedQuote.to,
    amount: savedQuote.value.base_amount,
    quote_id: savedQuote.value.quote_id,
    quote: savedQuote.value,
    token: token,
    provider: stringToProvider(selectedProvider.value),
    user_id: userId, // Optional: Kira uses env var, others will be set by Azkaban
  };

  // Show confirmation dialog
  showDialog('Confirmar Pago', confirmationMessage, 'info', true, 'Confirmar Pago', 'Cancelar');
};

const executePayout = async (payoutData: any) => {
  try {
    isProcessing.value = true;
    dialog.value.isLoading = true;

    if (import.meta.env.DEV) {
    }

    // Call createPayout API
    const response = await createPayout('pay', payoutData);

    if (import.meta.env.DEV) {
    }

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

    // Reset form
    selectedRecipient.value = '';
    const updatedQuotes = props.quotes.map((q) => {
      if (q.provider.toLowerCase() === selectedProvider.value) {
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
      errorMessage =
        error.response.data.error?.message ||
        error.response.data.detail ||
        error.response.data.message ||
        JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }

    showDialog('Error al Generar el Pago', errorMessage, 'error', false, 'Confirmar', 'Cerrar', false);
  } finally {
    isProcessing.value = false;
  }
};
</script>
