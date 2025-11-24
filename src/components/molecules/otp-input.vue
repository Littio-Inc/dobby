<template>
  <div class="space-y-4">
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-2">Verificación en dos pasos</h2>
      <p class="text-neutral-60">Ingresa el código de 6 dígitos de Google Authenticator</p>
      <div
        v-if="devOtpCode"
        class="mt-4 p-4 bg-lite-blue rounded-lg border border-littio-secondary-sky"
      >
        <p class="text-sm text-neutral-60 mb-2">Modo desarrollo - Código TOTP actual:</p>
        <p class="text-2xl font-bold text-littio-primary-billionaire">
          {{ devOtpCode }}
        </p>
        <p class="text-xs text-neutral-60 mt-2">Este código cambia cada 30 segundos</p>
      </div>
    </div>

    <div class="flex justify-center gap-2">
      <input
        v-for="(digit, index) in digits"
        :key="index"
        :ref="(el) => (inputs[index] = el as HTMLInputElement)"
        v-model="digits[index]"
        type="text"
        maxlength="1"
        class="w-12 h-12 text-center text-xl font-bold border-2 border-neutral-40 rounded focus:border-littio-secondary-sky focus:outline-none"
        :class="{ 'border-carmine': error }"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @paste="handlePaste"
      />
    </div>

    <div
      v-if="error"
      class="text-center"
    >
      <p class="text-carmine text-sm">
        {{ error }}
      </p>
    </div>

    <!-- Removed resend button for TOTP (codes are generated automatically) -->

    <div class="flex justify-center">
      <button
        :disabled="!isComplete || isVerifying"
        class="px-8 py-3 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/80 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleVerify"
      >
        {{ isVerifying ? 'Verificando...' : 'Verificar código' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  email: string;
  devOtpCode?: string | null;
  onVerify: (otp: string) => Promise<void>;
  onResend?: () => Promise<void>; // Optional - not used for TOTP
}>();

const emit = defineEmits<{
  verified: [];
}>();

const digits = ref<string[]>(['', '', '', '', '', '']);
const inputs = ref<(HTMLInputElement | null)[]>([]);
const error = ref('');
const isVerifying = ref(false);
// Removed isResending, countdown, and countdownInterval - not needed for TOTP

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
    const otp = digits.value.join('');
    await props.onVerify(otp);
    emit('verified');
  } catch (err: any) {
    // Extract error message from response or use default
    let errorMessage = 'Código TOTP inválido. Intenta nuevamente.';
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

// TOTP doesn't need resend functionality - codes are generated automatically
// Removed handleResend and startCountdown for TOTP

onMounted(() => {
  // Focus first input
  inputs.value[0]?.focus();
});

onUnmounted(() => {
  // Cleanup not needed for TOTP
});
</script>
