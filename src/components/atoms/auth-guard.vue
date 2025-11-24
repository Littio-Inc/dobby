<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center h-screen"
  >
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-littio-primary-lime mx-auto mb-4" />
      <p class="text-neutral-60">Verificando autenticación...</p>
    </div>
  </div>
  <div
    v-else-if="!isAuthenticated || !otpVerified"
    class="flex items-center justify-center h-screen"
  >
    <div class="text-center">
      <p class="text-neutral-80 mb-4">Debes iniciar sesión y verificar OTP para acceder</p>
      <button
        class="px-6 py-2 bg-littio-primary-lime text-littio-primary-billionaire rounded hover:bg-littio-primary-lime/80 transition-colors"
        @click="redirectToLogin"
      >
        Ir al Login
      </button>
    </div>
  </div>
  <slot v-else-if="isAuthenticated && otpVerified" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { $isAuthenticated, $isLoading, $otpVerified, initializeAuth } from '../../stores/auth-store';
import { goTo, Route } from '../../routes/routes';

const isAuthenticated = useStore($isAuthenticated);
const isLoading = useStore($isLoading);
const otpVerified = useStore($otpVerified);

let timeoutId: ReturnType<typeof setTimeout> | null = null;

const redirectToLogin = () => {
  goTo(Route.LOGIN);
};

onMounted(() => {
  // Initialize auth if not already done
  try {
    initializeAuth();
  } catch (error) {
    console.error('Error initializing auth:', error);
    // If initialization fails, redirect to login after a short delay
    setTimeout(() => {
      redirectToLogin();
    }, 1000);
    return;
  }

  // Set a timeout to redirect if still loading after 3 seconds
  // This prevents infinite loading if Firebase has issues
  timeoutId = setTimeout(() => {
    if (isLoading.value) {
      console.warn('Auth check taking too long, redirecting to login');
      redirectToLogin();
    } else if (!isAuthenticated.value || !otpVerified.value) {
      console.warn('Not authenticated or OTP not verified, redirecting to login');
      redirectToLogin();
    }
  }, 5000); // Increased timeout to allow Firebase state to fully initialize
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

// Watch for when loading finishes and user is not authenticated or OTP not verified
watch(
  [isLoading, isAuthenticated, otpVerified],
  ([loading, authenticated, verified]) => {
    console.log('[AuthGuard] State changed:', { loading, authenticated, verified });
    if (!loading) {
      // Only redirect if BOTH conditions are false after a delay
      // This allows time for Firebase state to stabilize
      // IMPORTANT: Give more time for OTP state to be preserved from previous session
      setTimeout(() => {
        const currentAuth = isAuthenticated.value;
        const currentOtp = otpVerified.value;
        console.log('[AuthGuard] Checking state after delay:', { currentAuth, currentOtp });

        if (!currentAuth || !currentOtp) {
          console.log('[AuthGuard] Redirecting to login - not authenticated or OTP not verified');
          redirectToLogin();
        } else {
          console.log('[AuthGuard] User authenticated and OTP verified, allowing access');
        }
      }, 1200); // Increased delay to allow Firebase state to fully stabilize and OTP state to be preserved
    }
  },
  { immediate: true },
);
</script>
