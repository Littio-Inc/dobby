<template>
  <div class="h-min">
    <LoadingSpinner
      v-if="isLoading"
      class="p-6"
      message="Verificando autenticación..."
    />
    <FirebaseLoginButton
      v-else-if="!user"
      :lang="lang"
    />
    <!-- TOTP Setup (first time) -->
    <TOTPSetup
      v-else-if="user && !totpConfigured && !totpVerified && qrCode"
      :qr-code="qrCode"
      :manual-entry-key="manualEntryKey"
      :dev-totp-code="devTotpCode"
      :on-verify="handleVerifyTOTP"
      @cancel="handleCancel"
      @verified="handleTOTPVerified"
    />
    <!-- Loading TOTP setup -->
    <div
      v-else-if="user && !totpConfigured && !totpVerified && !qrCode"
      class="text-center p-6"
    >
      <LoadingSpinner message="Configurando autenticación de dos factores..." />
    </div>
    <!-- TOTP Verification (already configured) -->
    <div
      v-else-if="user && totpConfigured && !totpVerified && qrCode === null"
      class="space-y-4"
    >
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-2">Verificación en dos pasos</h2>
        <p class="text-neutral-60">Ingresa el código de 6 dígitos de Google Authenticator</p>
        <div
          v-if="devTotpCode"
          class="mt-4 p-4 bg-lite-blue rounded-lg border border-littio-secondary-sky"
        >
          <p class="text-sm text-neutral-60 mb-2">Modo desarrollo - Código TOTP actual:</p>
          <p class="text-2xl font-bold text-littio-primary-billionaire">
            {{ devTotpCode }}
          </p>
          <p class="text-xs text-neutral-60 mt-2">Este código cambia cada 30 segundos</p>
        </div>
        <div
          v-else-if="fixedOtpCode"
          class="mt-4 p-4 bg-lite-blue rounded-lg border border-littio-secondary-sky"
        >
          <p class="text-sm text-neutral-60 mb-2">Modo desarrollo - Código fijo:</p>
          <p class="text-2xl font-bold text-littio-primary-billionaire">
            {{ fixedOtpCode }}
          </p>
          <p class="text-xs text-neutral-60 mt-2">Usa este código para desarrollo</p>
        </div>
      </div>
      <OTPInput
        :email="user.email || ''"
        :dev-otp-code="devTotpCode"
        :on-verify="handleVerifyTOTP"
        :on-resend="() => {}"
        @verified="handleTOTPVerified"
      />
    </div>
    <div
      v-if="error"
      class="text-carmine text-center p-4"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import {
  $isAuthenticated,
  $isLoading,
  $error,
  $user,
  $otpVerified,
  initializeAuth,
  setupTOTP,
  verifyTOTP,
  getTOTPStatus,
} from '../../stores/auth-store';
import { goTo, Route } from '../../routes/routes';
import FirebaseLoginButton from '../molecules/firebase-login-button.vue';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import OTPInput from '../molecules/otp-input.vue';
import TOTPSetup from '../molecules/totp-setup.vue';
import { TOTPService } from '../../utils/totp-service';

defineProps<{
  lang: string;
}>();

console.log('[LoginContainer] Script setup executing...');

const isAuthenticated = useStore($isAuthenticated);
const isLoading = useStore($isLoading);
const error = useStore($error);
const user = useStore($user);
const otpVerified = useStore($otpVerified);

const totpConfigured = ref(false);
const qrCode = ref<string | null>(null);
const manualEntryKey = ref<string | null>(null);
const devTotpCode = ref<string | null>(null);
const fixedOtpCode = ref<string | null>(import.meta.env.DEV ? '123456' : null);
let totpCodeInterval: ReturnType<typeof setInterval> | null = null;

// Check TOTP status when user logs in
let totpStatusChecked = false;
watch(
  [user, isLoading],
  async ([currentUser, loading]) => {
    if (currentUser && !loading && !totpStatusChecked) {
      totpStatusChecked = true; // Prevent multiple checks
      // Reset TOTP state before checking
      totpConfigured.value = false;
      qrCode.value = null;
      manualEntryKey.value = null;
      devTotpCode.value = null;

      try {
        console.log('[LoginContainer] Checking TOTP status for user:', currentUser.email);
        const status = await getTOTPStatus();
        console.log('[LoginContainer] TOTP status:', status);

        // Set configured status based on API response
        totpConfigured.value = status.is_configured;

        // If not configured, setup TOTP
        if (!status.is_configured) {
          console.log('[LoginContainer] TOTP not configured, setting up...');
          await setupTOTPFlow();
        } else if (status.is_configured && !status.is_verified) {
          // If configured but not verified in this session, show verification
          console.log('[LoginContainer] TOTP configured but not verified, showing verification');
          // TOTP is configured, user just needs to enter code
          // Note: We can't get the secret here for dev code display (security)
          // User must use Google Authenticator app
        }
      } catch (err: any) {
        console.error('[LoginContainer] Error checking TOTP status:', err);
        // If error (404, 401, or any other), assume not configured and try to setup
        console.log('[LoginContainer] TOTP status check failed, assuming not configured');
        totpConfigured.value = false;
        qrCode.value = null;
        manualEntryKey.value = null;
        devTotpCode.value = null;
        try {
          await setupTOTPFlow();
        } catch (setupErr: any) {
          console.error('[LoginContainer] Error setting up TOTP:', setupErr);
          // Don't show error to user, just log it
        }
      }
    } else if (!currentUser) {
      // Reset when user logs out
      console.log('[LoginContainer] User logged out, resetting TOTP state');
      totpStatusChecked = false;
      totpConfigured.value = false;
      qrCode.value = null;
      manualEntryKey.value = null;
      devTotpCode.value = null;
      if (totpCodeInterval) {
        clearInterval(totpCodeInterval);
        totpCodeInterval = null;
      }
    }
  },
  { immediate: true },
);

const setupTOTPFlow = async () => {
  try {
    console.log('[LoginContainer] Setting up TOTP...');
    const response = await setupTOTP();
    console.log('[LoginContainer] TOTP setup successful, QR code received');
    qrCode.value = response.qr_code;
    manualEntryKey.value = response.manual_entry_key;

    // In development, get current TOTP code
    if (response.secret) {
      startTOTPCodeRefresh(response.secret);
    }
  } catch (err: any) {
    console.error('[LoginContainer] Error setting up TOTP:', err);
    console.error('[LoginContainer] Error details:', err.response?.data);
    // Show error to user
    if (err.response?.data?.detail) {
      // Error will be shown via $error store
    }
  }
};

const startTOTPCodeRefresh = (secret?: string) => {
  // Only refresh in development
  if (import.meta.env.DEV && secret) {
    if (totpCodeInterval) {
      clearInterval(totpCodeInterval);
    }

    // Get current code immediately
    TOTPService.getCurrentCode(secret).then((code) => {
      devTotpCode.value = code;
    });

    // Refresh every 5 seconds
    totpCodeInterval = setInterval(() => {
      TOTPService.getCurrentCode(secret).then((code) => {
        devTotpCode.value = code;
      });
    }, 5000);
  }
};

const handleVerifyTOTP = async (code: string) => {
  console.log('[LoginContainer] Verifying TOTP:', code);
  try {
    await verifyTOTP(code);
    console.log('[LoginContainer] TOTP verified successfully');
  } catch (err: any) {
    console.error('[LoginContainer] TOTP verification error:', err);
    throw err;
  }
};

const handleTOTPVerified = () => {
  console.log('[LoginContainer] TOTP verified, redirecting to dashboard');
  if (totpCodeInterval) {
    clearInterval(totpCodeInterval);
  }
  goTo(Route.DASHBOARD);
};

const handleCancel = () => {
  // User cancelled TOTP setup - log them out
  console.log('[LoginContainer] TOTP setup cancelled');
  // Could implement logout here if needed
};

// Watch for authentication changes and redirect
watch(isAuthenticated, (authenticated) => {
  if (authenticated && otpVerified.value) {
    console.log('[LoginContainer] User authenticated and TOTP verified, redirecting to dashboard');
    goTo(Route.DASHBOARD);
  }
});

onMounted(() => {
  try {
    initializeAuth();
  } catch (error) {
    console.error('[LoginContainer] Error initializing auth:', error);
  }
});

// Cleanup interval on unmount
onUnmounted(() => {
  if (totpCodeInterval) {
    clearInterval(totpCodeInterval);
  }
});
</script>
