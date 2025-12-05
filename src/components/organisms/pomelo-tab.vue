<template>
  <div class="space-y-6">
    <QuotesTable
      :quotes="quotes"
      :usdc-balance="usdcBalance"
      :usdt-balance="usdtBalance"
      :selected-provider="selectedProvider"
      @update:quote="handleQuoteUpdate"
      @quote="handleQuote"
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
import { getQuote, getRecipients, createPayout, USER_IDS, WALLET_IDS, type Recipient } from '../../services';

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

// Recipient interface matches Cassandra API response

const props = defineProps<{
  quotes: Quote[];
  recipients: Recipient[];
  availableProviders: Array<{ value: string; label: string; disabled: boolean }>;
  usdcBalance?: number;
  usdtBalance?: number;
}>();

// Local recipients state (loaded from API)
const localRecipients = ref<Recipient[]>([]);

const emit = defineEmits<{
  monetize: [data: { payout_id: string; status: string }];
  'update:quotes': [quotes: Quote[]];
}>();

const selectedProvider = ref('');
const selectedRecipient = ref('');
const isProcessing = ref(false);
const savedQuote = ref<any>(null);
const isLoadingRecipients = ref(false);

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

  // Must have a saved quote
  if (!savedQuote.value) return false;

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
    const userId = USER_IDS.TRANSFER; // Pomelo uses transfer account
    const response = await getRecipients('transfer', userId);

    localRecipients.value = response.recipients.map((r) => {
      const mapped = {
        id: r.recipient_id, // Use recipient_id as id for dropdown
        recipient_id: r.recipient_id,
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

const handleQuoteUpdate = (index: number, quote: Quote) => {
  // Don't call updateQuote if we already have a calculatedAmount from a quote API
  // This prevents overwriting the calculatedAmount from the API response
  const currentQuote = props.quotes[index];
  if (currentQuote.calculatedAmount && currentQuote.calculatedAmount !== '-') {
    // If we already have a calculated amount (from quote API), just update the quote object
    const updatedQuotes = [...props.quotes];
    updatedQuotes[index] = { ...currentQuote, ...quote };
    emit('update:quotes', updatedQuotes);
  } else {
    // Otherwise, use the updateQuote logic for manual calculation
    Object.assign(props.quotes[index], quote);
    updateQuote(index);
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

  if (quote.from === 'USDC') {
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
    const quoteResponse = await getQuote('transfer', {
      amount,
      base_currency: 'USD', // Siempre enviar USD al backend
      quote_currency: quote.to,
    });

    // Guardar el quote en una variable
    savedQuote.value = quoteResponse;

    // Format balam_rate as number with thousand separators
    const formattedRate = quoteResponse.balam_rate.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Format quote_amount as number with thousand separators
    const formattedAmount = quoteResponse.quote_amount.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear una copia actualizada de las quotes
    const updatedQuotes = [...props.quotes];
    updatedQuotes[index] = {
      ...updatedQuotes[index],
      rate: formattedRate,
      calculatedAmount: formattedAmount,
      spread: updatedQuotes[index].spread || '-',
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
  } catch {
    quote.calculatedAmount = '-';
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

const handleMonetize = () => {
  if (!canMonetize.value) return;
  const selectedQuote = props.quotes.find((q) => q.provider.toLowerCase() === selectedProvider.value);
  if (!selectedQuote) return;

  // Validate that we have a saved quote
  if (!savedQuote.value) {
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
  const token = selectedQuote.from === 'USDC' ? 'USDC' : selectedQuote.from === 'USDT' ? 'USDT' : 'USDC';
  const walletId = WALLET_IDS.TRANSFER;
  const reference = `payout-${Date.now()}`;

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
  };

  // Show confirmation dialog
  showDialog('Confirmar Pago', confirmationMessage, 'info', true, 'Confirmar Pago', 'Cancelar');
};

const executePayout = async (payoutData: any) => {
  try {
    isProcessing.value = true;
    dialog.value.isLoading = true;

    // Call createPayout API
    const response = await createPayout('transfer', payoutData);

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
    const updatedQuotes = [...props.quotes];
    updatedQuotes.forEach((q) => {
      if (q.provider.toLowerCase() === selectedProvider.value) {
        q.amount = '';
        q.calculatedAmount = '-';
        q.rate = '-';
      }
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
