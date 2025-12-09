<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Registro de movimientos – Proveedores no apificados</h1>
      <p class="text-base text-neutral-60">
        Este módulo permite registrar manualmente operaciones realizadas fuera de Littio para garantizar trazabilidad y
        registro contable estructurado.
      </p>
    </div>

    <!-- Success Message -->
    <div
      v-if="success"
      class="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div class="flex items-start gap-3">
        <svg
          class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="flex-1">
          <p class="text-green-800 font-medium">
            {{ success }}
          </p>
          <p
            v-if="transactionId"
            class="text-green-700 text-sm mt-1"
          >
            ID de transacción: <span class="font-mono font-semibold">{{ transactionId }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <div class="bg-white rounded-lg border border-neutral-20 p-6">
      <div class="space-y-6">
        <!-- Section Title -->
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-neutral-80">Nuevo Movimiento</h2>
          <p class="text-sm text-neutral-60">
            Complete todos los campos requeridos para registrar el movimiento manual
          </p>
        </div>

        <!-- Form -->
        <form
          class="space-y-6"
          @submit.prevent="handleSubmit"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-4">
              <!-- Fecha de la operación -->
              <div>
                <label
                  for="operation-date"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Fecha de la operación <span class="text-carmine">*</span>
                </label>
                <div class="relative">
                  <input
                    id="operation-date"
                    v-model="formData.operationDate"
                    type="date"
                    required
                    class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80"
                  />
                </div>
              </div>

              <!-- Cuenta origen -->
              <div>
                <label
                  for="origin-account"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Cuenta origen <span class="text-carmine">*</span>
                </label>
                <input
                  id="origin-account"
                  v-model="formData.originAccount"
                  type="text"
                  required
                  placeholder="Ej: Bancolo - Cuenta operacional 1"
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60"
                />
              </div>

              <!-- Tipo de movimiento -->
              <div>
                <label
                  for="movement-type"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Tipo de movimiento <span class="text-carmine">*</span>
                </label>
                <select
                  id="movement-type"
                  v-model="formData.movementType"
                  required
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
                >
                  <option
                    value=""
                    disabled
                  >
                    Seleccione tipo
                  </option>
                  <option value="transfer_in">Transfer In</option>
                  <option value="transfer_out">Transfer Out</option>
                  <option value="payment">Payment</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>

              <div>
                <label
                  for="currency"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Moneda <span class="text-carmine">*</span>
                </label>
                <select
                  id="currency"
                  v-model="formData.currency"
                  required
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 bg-white"
                >
                  <option
                    value=""
                    disabled
                  >
                    Seleccione moneda
                  </option>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>

              <!-- Notas / Comentarios -->
              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Notas / Comentarios
                </label>
                <div class="relative">
                  <textarea
                    id="notes"
                    v-model="formData.notes"
                    rows="4"
                    maxlength="250"
                    placeholder="Comentarios adicionales sobre esta operación..."
                    class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60 resize-none"
                  />
                  <div class="absolute bottom-2 right-2 text-xs text-neutral-60">{{ formData.notes.length }}/250</div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-4">
              <!-- Proveedor -->
              <div>
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
                >
                  <option
                    value=""
                    disabled
                  >
                    Seleccione proveedor
                  </option>
                  <option value="BCOLO3036">Bancolombia 3036</option>
                  <option value="BCOLO4708">Bancolombia 4708</option>
                  <option value="BBVA">BBVA</option>
                </select>
              </div>

              <!-- Cuenta destino -->
              <div>
                <label
                  for="destination-account"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Cuenta destino <span class="text-carmine">*</span>
                </label>
                <input
                  id="destination-account"
                  v-model="formData.destinationAccount"
                  type="text"
                  required
                  placeholder="Ej: Littio – Cuenta tesorería COP"
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60"
                />
              </div>

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

              <!-- ID de transacción externa -->
              <div>
                <label
                  for="external-transaction-id"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  ID de transacción externa <span class="text-carmine">*</span>
                </label>
                <input
                  id="external-transaction-id"
                  v-model="formData.externalTransactionId"
                  type="text"
                  required
                  placeholder="ID de referencia del banco/proveedor"
                  class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-4 pt-4 border-t border-neutral-20">
            <button
              type="button"
              class="px-6 py-2.5 border border-neutral-40 rounded-lg text-neutral-80 font-medium hover:bg-neutral-20 transition-colors flex items-center gap-2"
              @click="handleClear"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Limpiar formulario
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 bg-littio-secondary-sky text-white rounded-lg font-medium hover:bg-littio-secondary-sky/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg
                v-if="!isSubmitting"
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
              <svg
                v-else
                class="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ isSubmitting ? 'Registrando...' : 'Registrar movimiento' }}
            </button>
          </div>
        </form>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mt-6 bg-carmine-light border border-carmine rounded-lg p-4"
        >
          <p class="text-carmine font-medium">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AzkabanService } from '../../services/api/azkaban';

interface FormData {
  operationDate: string;
  originAccount: string;
  movementType: 'transfer_in' | 'transfer_out' | 'payment' | 'withdrawal' | '';
  currency: string;
  notes: string;
  provider: string;
  destinationAccount: string;
  amount: string;
  externalTransactionId: string;
}

const formData = ref<FormData>({
  operationDate: '',
  originAccount: '',
  movementType: '',
  currency: '',
  notes: '',
  provider: '',
  destinationAccount: '',
  amount: '',
  externalTransactionId: '',
});

const isSubmitting = ref(false);
const error = ref('');
const success = ref('');
const transactionId = ref('');

const clearForm = () => {
  formData.value = {
    operationDate: '',
    originAccount: '',
    movementType: '',
    currency: '',
    notes: '',
    provider: '',
    destinationAccount: '',
    amount: '',
    externalTransactionId: '',
  };
};

const handleClear = () => {
  clearForm();
  error.value = '';
  success.value = '';
  transactionId.value = '';
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  if (!formData.value.movementType) {
    error.value = 'Por favor, seleccione un tipo de movimiento válido.';
    return;
  }

  isSubmitting.value = true;
  error.value = '';
  success.value = '';
  transactionId.value = '';

  try {
    // Parsear amount a número
    const parsedAmount = parseFloat(formData.value.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error.value = 'Por favor, ingrese un monto válido mayor a cero.';
      isSubmitting.value = false;
      return;
    }

    const response = await AzkabanService.createBackofficeTransaction({
      operationDate: formData.value.operationDate,
      movementType: formData.value.movementType as 'transfer_in' | 'transfer_out' | 'payment' | 'withdrawal',
      provider: formData.value.provider,
      amount: parsedAmount,
      currency: formData.value.currency,
      externalTransactionId: formData.value.externalTransactionId,
      destinationAccount: formData.value.destinationAccount,
      originAccount: formData.value.originAccount,
      notes: formData.value.notes,
    });

    success.value = 'Movimiento registrado exitosamente';
    transactionId.value = response.id;
    
    // Limpiar solo el formulario, mantener el mensaje de éxito visible
    clearForm();
    
    // Hacer scroll hacia arriba para mostrar el mensaje de éxito
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err: any) {
    // Logging seguro: solo información no sensible y condicional al entorno
    if (import.meta.env.DEV) {
      console.error('Error al registrar movimiento:', {
        message: err.message,
        status: err.response?.status,
        stack: err.stack,
      });
    } else {
      // En producción, solo loguear mensaje básico sin datos sensibles
      console.error('Error al registrar movimiento:', err.message || 'Error desconocido');
    }

    let errorMessage = 'Error al registrar el movimiento. Por favor, intente nuevamente.';

    if (err.response?.data?.detail) {
      errorMessage = err.response.data.detail;
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message && !err.message.includes('status code')) {
      errorMessage = err.message;
    }

    error.value = errorMessage;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
