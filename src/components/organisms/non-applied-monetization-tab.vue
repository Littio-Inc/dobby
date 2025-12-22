<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-neutral-80">Registro Manual - Proveedor no API</h1>
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

    <!-- Form Section -->
    <div class="bg-white rounded-lg border border-neutral-20 p-8">
      <form
        class="space-y-8"
        @submit.prevent="() => handleSubmit(false)"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Proveedor -->
            <div>
              <label
                for="provider"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Proveedor <span class="text-carmine">*</span>
              </label>
              <div class="relative">
                <select
                  id="provider"
                  v-model="formData.provider"
                  required
                  :class="[
                    'w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 bg-white appearance-none cursor-pointer',
                    fieldErrors.provider
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @change="fieldErrors.provider = false"
                >
                  <option
                    value=""
                    disabled
                  >
                    Seleccionar proveedor
                  </option>
                  <option value="bancolombia">Bancolombia</option>
                  <option value="bbva">BBVA</option>
                  <option value="zulu">Zulu</option>
                  <option value="davivienda">Davivienda</option>
                  <option value="banco-de-bogota">Banco de Bogotá</option>
                  <option value="nequi">Nequi</option>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <!-- Fecha de creación -->
            <div>
              <label
                for="creation-date"
                :class="[
                  'block text-sm font-medium mb-2',
                  fieldErrors.creationDate ? 'text-carmine' : 'text-neutral-80',
                ]"
              >
                Fecha de creación <span class="text-carmine">*</span>
              </label>
              <div class="relative">
                <input
                  id="creation-date"
                  v-model="formData.creationDate"
                  type="datetime-local"
                  required
                  :max="maxDateTime"
                  :class="[
                    'w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 datetime-input',
                    fieldErrors.creationDate
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @change="validateCreationDate"
                />
                <svg
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-60 pointer-events-none"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <!-- Tasa -->
            <div>
              <label
                for="rate"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Tasa <span class="text-carmine">*</span>
              </label>
              <input
                id="rate"
                v-model="formData.rate"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Ej: 4005.50"
                :class="[
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                  fieldErrors.rate
                    ? 'border-carmine focus:ring-carmine focus:border-carmine'
                    : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                ]"
                @input="
                  calculateFinalAmount();
                  fieldErrors.rate = false;
                "
              />
            </div>

            <!-- Moneda Inicial -->
            <div>
              <label
                :class="[
                  'block text-sm font-medium mb-2',
                  fieldErrors.initialCurrency ? 'text-carmine' : 'text-neutral-80',
                ]"
              >
                Moneda Inicial <span class="text-carmine">*</span>
              </label>
              <div
                :class="[
                  'flex flex-wrap gap-2 p-2 rounded-lg',
                  fieldErrors.initialCurrency ? 'border-2 border-carmine border-dashed' : '',
                ]"
              >
                <button
                  v-for="currency in currencies"
                  :key="currency"
                  type="button"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    formData.initialCurrency === currency
                      ? getCurrencyColor(currency) + ' text-white'
                      : 'bg-white border border-neutral-40 text-neutral-80 hover:bg-neutral-20',
                  ]"
                  @click="
                    formData.initialCurrency = currency;
                    calculateFinalAmount();
                    fieldErrors.initialCurrency = false;
                  "
                >
                  {{ currency }}
                </button>
              </div>
            </div>

            <!-- Moneda Final -->
            <div>
              <label
                :class="[
                  'block text-sm font-medium mb-2',
                  fieldErrors.finalCurrency ? 'text-carmine' : 'text-neutral-80',
                ]"
              >
                Moneda Final <span class="text-carmine">*</span>
              </label>
              <div
                :class="[
                  'flex flex-wrap gap-2 p-2 rounded-lg',
                  fieldErrors.finalCurrency ? 'border-2 border-carmine border-dashed' : '',
                ]"
              >
                <button
                  v-for="currency in currencies"
                  :key="currency"
                  type="button"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    formData.finalCurrency === currency
                      ? getCurrencyColor(currency) + ' text-white'
                      : 'bg-white border border-neutral-40 text-neutral-80 hover:bg-neutral-20',
                  ]"
                  @click="
                    formData.finalCurrency = currency;
                    calculateFinalAmount();
                    fieldErrors.finalCurrency = false;
                  "
                >
                  {{ currency }}
                </button>
              </div>
            </div>

            <!-- Monto Inicial -->
            <div>
              <label
                for="initial-amount"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Monto Inicial <span class="text-carmine">*</span>
              </label>
              <input
                id="initial-amount"
                v-model="formData.initialAmount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Ej: 1000.00"
                :class="[
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                  fieldErrors.initialAmount
                    ? 'border-carmine focus:ring-carmine focus:border-carmine'
                    : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                ]"
                @input="
                  calculateFinalAmount();
                  fieldErrors.initialAmount = false;
                "
              />
            </div>

            <!-- Monto Final (calculado) -->
            <div>
              <label
                for="final-amount"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Monto Final (calculado)
              </label>
              <input
                id="final-amount"
                :value="calculatedFinalAmount"
                type="text"
                readonly
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg bg-neutral-20 text-neutral-80 cursor-not-allowed"
              />
            </div>

            <!-- Tipo de operación -->
            <div>
              <label
                for="operation-type"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Tipo de operación <span class="text-carmine">*</span>
              </label>
              <div class="relative">
                <select
                  id="operation-type"
                  v-model="formData.operationType"
                  required
                  :class="[
                    'w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 bg-white appearance-none cursor-pointer',
                    fieldErrors.operationType
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @change="fieldErrors.operationType = false"
                >
                  <option
                    value=""
                    disabled
                  >
                    Seleccionar tipo
                  </option>
                  <option value="swap_in">SWAP IN</option>
                  <option value="swap_out">SWAP OUT</option>
                  <option value="payment">Payment</option>
                  <option value="withdraw">Withdraw</option>
                  <option value="transfer_in">Transfer In</option>
                  <option value="transfer_out">Transfer Out</option>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <!-- Estado -->
            <div>
              <label
                :class="['block text-sm font-medium mb-2', fieldErrors.status ? 'text-carmine' : 'text-neutral-80']"
              >
                Estado <span class="text-carmine">*</span>
              </label>
              <div
                :class="[
                  'flex flex-wrap gap-2 p-2 rounded-lg',
                  fieldErrors.status ? 'border-2 border-carmine border-dashed' : '',
                ]"
              >
                <button
                  v-for="status in statuses"
                  :key="status.value"
                  type="button"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    formData.status === status.value
                      ? getStatusColor(status.value) + ' text-white'
                      : 'bg-white border border-neutral-40 text-neutral-80 hover:bg-neutral-20',
                  ]"
                  @click="
                    formData.status = status.value;
                    fieldErrors.status = false;
                  "
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Transaction ID -->
            <div>
              <label
                for="transaction-id"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Transaction ID <span class="text-carmine">*</span>
              </label>
              <input
                id="transaction-id"
                v-model="formData.transactionId"
                type="text"
                required
                placeholder="ID único de la transacción"
                :class="[
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                  fieldErrors.transactionId
                    ? 'border-carmine focus:ring-carmine focus:border-carmine'
                    : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                ]"
                @input="fieldErrors.transactionId = false"
              />
            </div>

            <!-- Transaction Hash -->
            <div>
              <label
                for="transaction-hash"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Transaction Hash
              </label>
              <input
                id="transaction-hash"
                v-model="formData.transactionHash"
                type="text"
                placeholder="Hash de la transacción"
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60"
              />
            </div>

            <!-- Notas internas -->
            <div>
              <label
                for="internal-notes"
                class="block text-sm font-medium text-neutral-80 mb-2"
              >
                Notas internas
              </label>
              <textarea
                id="internal-notes"
                v-model="formData.internalNotes"
                rows="4"
                placeholder="Notas o comentarios internos..."
                class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky text-neutral-80 placeholder:text-neutral-60 resize-y"
              />
            </div>

            <!-- Cuenta de Destino Section -->
            <div class="space-y-4 border border-neutral-40 rounded-lg p-4">
              <h3 class="text-base font-semibold text-neutral-80">Cuenta de Destino</h3>

              <!-- Banco/Proveedor destino -->
              <div>
                <label
                  for="destination-bank"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Banco/Proveedor destino <span class="text-carmine">*</span>
                </label>
                <input
                  id="destination-bank"
                  v-model="formData.destinationBank"
                  type="text"
                  required
                  placeholder="Ej: Bancolombia"
                  :class="[
                    'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                    fieldErrors.destinationBank
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @input="fieldErrors.destinationBank = false"
                />
              </div>

              <!-- Titular de cuenta -->
              <div>
                <label
                  for="account-holder"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Titular de cuenta <span class="text-carmine">*</span>
                </label>
                <input
                  id="account-holder"
                  v-model="formData.accountHolder"
                  type="text"
                  required
                  placeholder="Nombre completo"
                  :class="[
                    'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                    fieldErrors.accountHolder
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @input="fieldErrors.accountHolder = false"
                />
              </div>

              <!-- Tipo de cuenta -->
              <div>
                <label
                  for="account-type"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Tipo de cuenta <span class="text-carmine">*</span>
                </label>
                <div class="relative">
                  <select
                    id="account-type"
                    v-model="formData.accountType"
                    required
                    :class="[
                      'w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 bg-white appearance-none cursor-pointer',
                      fieldErrors.accountType
                        ? 'border-carmine focus:ring-carmine focus:border-carmine'
                        : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                    ]"
                    @change="fieldErrors.accountType = false"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Seleccionar tipo
                    </option>
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                    <option value="otro">Otro</option>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <!-- Número de cuenta -->
              <div>
                <label
                  for="account-number"
                  class="block text-sm font-medium text-neutral-80 mb-2"
                >
                  Número de cuenta <span class="text-carmine">*</span>
                </label>
                <input
                  id="account-number"
                  v-model="formData.accountNumber"
                  type="text"
                  required
                  placeholder="1234567890"
                  :class="[
                    'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-neutral-80 placeholder:text-neutral-60',
                    fieldErrors.accountNumber
                      ? 'border-carmine focus:ring-carmine focus:border-carmine'
                      : 'border-neutral-40 focus:ring-littio-secondary-sky focus:border-littio-secondary-sky',
                  ]"
                  @input="fieldErrors.accountNumber = false"
                />
              </div>
            </div>

            <!-- Adjuntar comprobante -->
            <div v-if="showFileUpload">
              <label class="block text-sm font-medium text-neutral-80 mb-2"> Adjuntar comprobante (PDF/JPG/PNG) </label>
              <div
                class="border-2 border-dashed border-neutral-40 rounded-lg p-8 text-center cursor-pointer hover:border-littio-secondary-sky transition-colors"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <svg
                  class="w-12 h-12 mx-auto text-neutral-60 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p class="text-neutral-60">
                  {{ selectedFile ? selectedFile.name : 'Click para subir archivo' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center pt-6 border-t border-neutral-20">
          <button
            type="button"
            class="text-neutral-60 hover:text-neutral-80 font-medium transition-colors"
            @click="handleClear"
          >
            Limpiar formulario
          </button>
          <div class="flex gap-4">
            <button
              type="button"
              class="px-6 py-2.5 border border-neutral-40 rounded-lg text-neutral-80 font-medium hover:bg-neutral-20 transition-colors"
              @click="handleValidate"
            >
              Validar
            </button>
            <button
              type="button"
              class="px-6 py-2.5 bg-neutral-40 text-neutral-80 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              @click="handleSaveAndDuplicate"
            >
              Guardar y duplicar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 bg-littio-secondary-sky text-white rounded-lg font-medium hover:bg-littio-secondary-sky/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
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
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const showFileUpload = ref(false);

interface FormData {
  provider: string;
  creationDate: string;
  rate: string;
  initialCurrency: string;
  finalCurrency: string;
  initialAmount: string;
  operationType: string;
  status: string;
  transactionId: string;
  transactionHash: string;
  internalNotes: string;
  destinationBank: string;
  accountHolder: string;
  accountType: string;
  accountNumber: string;
}

const currencies = ['USD', 'COP', 'EUR', 'MXN', 'BRL', 'ARS'];

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
];

const formData = ref<FormData>({
  provider: '',
  creationDate: '',
  rate: '',
  initialCurrency: '',
  finalCurrency: '',
  initialAmount: '',
  operationType: '',
  status: '',
  transactionId: '',
  transactionHash: '',
  internalNotes: '',
  destinationBank: '',
  accountHolder: '',
  accountType: '',
  accountNumber: '',
});

const isSubmitting = ref(false);
const error = ref('');
const success = ref('');
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const fieldErrors = ref<Record<string, boolean>>({});

// Calcular monto final automáticamente
const calculatedFinalAmount = computed(() => {
  const rate = parseFloat(formData.value.rate);
  const initialAmount = parseFloat(formData.value.initialAmount);

  if (!rate || !initialAmount || isNaN(rate) || isNaN(initialAmount)) {
    return '';
  }

  const finalAmount = rate * initialAmount;
  return finalAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const calculateFinalAmount = () => {};

// Fecha/hora máxima permitida (fecha actual)
const maxDateTime = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
});

// Validar que la fecha de creación no sea futura
const validateCreationDate = () => {
  if (!formData.value.creationDate) {
    fieldErrors.value.creationDate = false;
    return;
  }

  const selectedDate = new Date(formData.value.creationDate);
  const now = new Date();

  if (selectedDate > now) {
    fieldErrors.value.creationDate = true;
    error.value = 'La fecha de creación no puede ser futura. Por favor, seleccione una fecha y hora válida.';
  } else {
    fieldErrors.value.creationDate = false;
    // Limpiar el error si se corrige
    if (error.value.includes('fecha de creación')) {
      error.value = '';
    }
  }
};

const getStatusColor = (statusValue: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    canceled: 'bg-gray-500',
  };
  return colorMap[statusValue] || 'bg-littio-secondary-sky';
};

const getCurrencyColor = (currency: string): string => {
  const colorMap: Record<string, string> = {
    USD: 'bg-green-500',
    COP: 'bg-blue-500',
    EUR: 'bg-violet-500',
    MXN: 'bg-orange-500',
    BRL: 'bg-yellow-500',
    ARS: 'bg-sky-500',
  };
  return colorMap[currency] || 'bg-littio-secondary-sky';
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      error.value = 'Por favor, seleccione un archivo PDF, JPG o PNG válido.';
      return;
    }
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'El archivo no puede ser mayor a 10MB.';
      return;
    }
    selectedFile.value = file;
    error.value = '';
  }
};

const handleClear = () => {
  formData.value = {
    provider: '',
    creationDate: '',
    rate: '',
    initialCurrency: '',
    finalCurrency: '',
    initialAmount: '',
    operationType: '',
    status: '',
    transactionId: '',
    transactionHash: '',
    internalNotes: '',
    destinationBank: '',
    accountHolder: '',
    accountType: '',
    accountNumber: '',
  };
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  error.value = '';
  success.value = '';
  fieldErrors.value = {};
};

const handleValidate = () => {
  error.value = '';
  success.value = '';
  // Limpiar errores previos
  fieldErrors.value = {};

  let hasErrors = false;

  // Validar todos los campos y marcar los que tienen errores
  if (!formData.value.provider) {
    fieldErrors.value.provider = true;
    hasErrors = true;
  }
  if (!formData.value.creationDate) {
    fieldErrors.value.creationDate = true;
    hasErrors = true;
  } else {
    const selectedDate = new Date(formData.value.creationDate);
    const now = new Date();
    if (selectedDate > now) {
      fieldErrors.value.creationDate = true;
      hasErrors = true;
      error.value = 'La fecha de creación no puede ser futura. Por favor, seleccione una fecha y hora válida.';
    }
  }
  if (!formData.value.rate || parseFloat(formData.value.rate) <= 0) {
    fieldErrors.value.rate = true;
    hasErrors = true;
  }
  if (!formData.value.initialCurrency) {
    fieldErrors.value.initialCurrency = true;
    hasErrors = true;
  }
  if (!formData.value.finalCurrency) {
    fieldErrors.value.finalCurrency = true;
    hasErrors = true;
  }
  if (!formData.value.initialAmount || parseFloat(formData.value.initialAmount) <= 0) {
    fieldErrors.value.initialAmount = true;
    hasErrors = true;
  }
  if (!formData.value.operationType) {
    fieldErrors.value.operationType = true;
    hasErrors = true;
  }
  if (!formData.value.status) {
    fieldErrors.value.status = true;
    hasErrors = true;
  }
  if (!formData.value.transactionId) {
    fieldErrors.value.transactionId = true;
    hasErrors = true;
  }
  if (!formData.value.destinationBank) {
    fieldErrors.value.destinationBank = true;
    hasErrors = true;
  }
  if (!formData.value.accountHolder) {
    fieldErrors.value.accountHolder = true;
    hasErrors = true;
  }
  if (!formData.value.accountType) {
    fieldErrors.value.accountType = true;
    hasErrors = true;
  }
  if (!formData.value.accountNumber) {
    fieldErrors.value.accountNumber = true;
    hasErrors = true;
  }

  if (hasErrors) {
    error.value = 'Por favor, complete todos los campos requeridos marcados en rojo.';
    // Hacer scroll al primer campo con error
    const firstErrorField = document.querySelector('.border-carmine');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    success.value = 'Formulario validado correctamente.';
    setTimeout(() => {
      success.value = '';
    }, 3000);
  }
};

const handleSaveAndDuplicate = async () => {
  await handleSubmit(true);
};

const handleSubmit = async (duplicate: boolean = false) => {
  if (isSubmitting.value) return;

  // Validar antes de enviar
  handleValidate();
  if (error.value) {
    return;
  }

  isSubmitting.value = true;
  error.value = '';
  success.value = '';

  try {
    // Aquí iría la lógica para enviar los datos al backend
    // Por ahora solo simulamos el guardado
    await new Promise((resolve) => setTimeout(resolve, 1000));

    success.value = 'Monetización registrada exitosamente.';

    if (duplicate) {
      // Mantener los datos y limpiar solo algunos campos
      formData.value.transactionId = '';
      formData.value.transactionHash = '';
      formData.value.internalNotes = '';
      selectedFile.value = null;
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
    } else {
      handleClear();
    }

    setTimeout(() => {
      success.value = '';
    }, 5000);
  } catch (err: any) {
    error.value = err.message || 'Error al guardar la monetización. Por favor, intente nuevamente.';
  } finally {
    isSubmitting.value = false;
  }
};

// Establecer fecha actual por defecto
onMounted(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  formData.value.creationDate = `${year}-${month}-${day}T${hours}:${minutes}`;
});
</script>

<style scoped>
/* Ocultar iconos nativos del navegador para datetime-local */
.datetime-input::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}

.datetime-input::-webkit-inner-spin-button,
.datetime-input::-webkit-outer-spin-button {
  display: none;
  -webkit-appearance: none;
}

.datetime-input {
  -webkit-appearance: none;
  -moz-appearance: textfield;
  appearance: none;
}
</style>
