<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-2">Configurar Autenticación de Dos Factores</h2>
      <p class="text-neutral-60">Escanea el código QR con Google Authenticator o ingresa la clave manualmente</p>
    </div>

    <!-- QR Code -->
    <div
      v-if="qrCode"
      class="flex justify-center"
    >
      <img
        :src="qrCode"
        alt="TOTP QR Code"
        class="border-2 border-neutral-20 rounded-lg p-4 bg-white"
      />
    </div>

    <!-- Manual Entry Key -->
    <div
      v-if="manualEntryKey"
      class="bg-lite-blue rounded-lg border border-littio-secondary-sky p-4"
    >
      <p class="text-sm text-neutral-60 mb-2">Clave manual (si no puedes escanear el QR):</p>
      <p class="text-lg font-mono font-bold text-littio-primary-billionaire break-all">
        {{ manualEntryKey }}
      </p>
    </div>

    <!-- Current TOTP Code (Dev only) -->
    <div
      v-if="devTotpCode"
      class="bg-lite-blue rounded-lg border border-littio-secondary-sky p-4"
    >
      <p class="text-sm text-neutral-60 mb-2">Modo desarrollo - Código TOTP actual:</p>
      <p class="text-2xl font-bold text-littio-primary-billionaire">
        {{ devTotpCode }}
      </p>
      <p class="text-xs text-neutral-60 mt-2">Este código cambia cada 30 segundos</p>
    </div>

    <!-- Instructions -->
    <div class="bg-neutral-5 rounded-lg p-4">
      <h3 class="font-semibold mb-2">Instrucciones:</h3>
      <ol class="list-decimal list-inside space-y-1 text-sm text-neutral-60">
        <li>Descarga Google Authenticator en tu teléfono</li>
        <li>Escanea el código QR o ingresa la clave manualmente</li>
        <li>Ingresa el código de 6 dígitos que aparece en la app</li>
        <li>Haz clic en "Verificar" para completar la configuración</li>
      </ol>
    </div>

    <!-- TOTP Input -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-neutral-80">
        Ingresa el código de 6 dígitos de Google Authenticator:
      </label>
      <div class="flex gap-2 justify-center">
        <input
          v-for="(digit, index) in digits"
          :key="index"
          :ref="
            (el) => {
              if (el) inputs[index] = el as HTMLInputElement;
            }
          "
          v-model="digits[index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="w-12 h-12 text-center text-xl font-bold border-2 border-neutral-20 rounded focus:border-littio-secondary-sky focus:outline-none"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste"
        />
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="text-carmine text-center text-sm"
    >
      {{ error }}
    </div>

    <!-- Actions -->
    <div class="flex justify-center gap-4">
      <button
        :disabled="!isComplete || isVerifying"
        class="px-8 py-3 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/80 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleVerify"
      >
        {{ isVerifying ? 'Verificando...' : 'Verificar y Activar' }}
      </button>
      <button
        class="px-8 py-3 bg-neutral-20 text-neutral-80 rounded hover:bg-neutral-30"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const { onVerify } = defineProps<{
  qrCode: string | null;
  manualEntryKey: string | null;
  devTotpCode?: string | null;
  onVerify: (code: string) => Promise<void>;
}>();

const emit = defineEmits<{
  cancel: [];
  verified: [];
}>();

const digits = ref<string[]>(['', '', '', '', '', '']);
const inputs = ref<(HTMLInputElement | null)[]>([]);
const error = ref('');
const isVerifying = ref(false);

const isComplete = computed(() => {
  return digits.value.every((digit) => digit !== '');
});

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value.replace(/\D/g, ''); // Only digits

  if (value) {
    digits.value[index] = value;
    error.value = '';

    // Move to next input
    if (index < 5 && inputs.value[index + 1]) {
      inputs.value[index + 1]?.focus();
    }
  } else {
    digits.value[index] = '';
  }
};

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
};

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const pasted = event.clipboardData?.getData('text') || '';
  const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6);

  for (let i = 0; i < 6; i++) {
    digits.value[i] = digitsOnly[i] || '';
  }

  // Focus last filled input
  const lastIndex = Math.min(digitsOnly.length - 1, 5);
  if (inputs.value[lastIndex]) {
    inputs.value[lastIndex]?.focus();
  }
};

const handleVerify = async () => {
  if (!isComplete.value) return;

  isVerifying.value = true;
  error.value = '';

  try {
    const code = digits.value.join('');
    await onVerify(code);
    emit('verified');
  } catch (err: any) {
    // Extract clear error message
    let errorMessage = 'Código TOTP inválido. Verifica que el código sea correcto y que no haya expirado.';
    if (err.response?.data?.detail) {
      errorMessage = err.response.data.detail;
    } else if (err.message && !err.message.includes('status code')) {
      errorMessage = err.message;
    }
    error.value = errorMessage;
    // Clear inputs on error
    digits.value = ['', '', '', '', '', ''];
    inputs.value[0]?.focus();
  } finally {
    isVerifying.value = false;
  }
};

onMounted(() => {
  // Focus first input
  inputs.value[0]?.focus();
});
</script>
