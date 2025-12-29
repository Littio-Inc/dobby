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
import { onMounted, onUnmounted, watch, ref } from 'vue';
import { useStore } from '@nanostores/vue';
import { $isAuthenticated, $isLoading, $otpVerified, initializeAuth } from '../../stores/auth-store';
import { goTo, Route } from '../../routes/routes';

const isAuthenticated = useStore($isAuthenticated);
const isLoading = useStore($isLoading);
const otpVerified = useStore($otpVerified);

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;
const isRedirecting = ref(false);
const hasCheckedOnce = ref(false);

const redirectToLogin = () => {
  // Prevent multiple redirects
  if (isRedirecting.value) {
    console.log('[AuthGuard] Already redirecting, skipping');
    return;
  }

  // Check if we're already on the login page
  if (window.location.pathname.includes('/login')) {
    console.log('[AuthGuard] Already on login page, skipping redirect');
    return;
  }

  isRedirecting.value = true;
  console.log('[AuthGuard] Redirecting to login');
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

  // Set a timeout to redirect if still loading after 5 seconds
  // This prevents infinite loading if Firebase has issues
  timeoutId = setTimeout(() => {
    if (isLoading.value && !hasCheckedOnce.value) {
      console.warn('[AuthGuard] Auth check taking too long, redirecting to login');
      redirectToLogin();
    }
  }, 5000);
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  if (redirectTimeoutId) {
    clearTimeout(redirectTimeoutId);
  }
});

// Watch for when loading finishes and user is not authenticated or OTP not verified
watch(
  [isLoading, isAuthenticated, otpVerified],
  ([loading, authenticated, verified]) => {
    console.log('[AuthGuard] State changed:', { loading, authenticated, verified });

    // Clear any pending redirect timeout
    if (redirectTimeoutId) {
      clearTimeout(redirectTimeoutId);
      redirectTimeoutId = null;
    }

    // Only check after loading is complete
    if (!loading) {
      hasCheckedOnce.value = true;

      // Give Firebase and localStorage time to fully stabilize
      // This is especially important in local development where state restoration might be slower
      redirectTimeoutId = setTimeout(() => {
        const currentAuth = isAuthenticated.value;
        const currentOtp = otpVerified.value;
        const currentLoading = isLoading.value;
        const currentPath = window.location.pathname;

        console.log('[AuthGuard] Final state check:', {
          currentAuth,
          currentOtp,
          currentLoading,
          pathname: currentPath,
          isRedirecting: isRedirecting.value,
        });

        // Skip if already redirecting
        if (isRedirecting.value) {
          console.log('[AuthGuard] Already redirecting, skipping check');
          return;
        }

        // Skip if already on login page
        if (currentPath.includes('/login')) {
          console.log('[AuthGuard] Already on login page, no redirect needed');
          return;
        }

        // Only redirect if we're sure the user is not authenticated
        // Don't redirect if we're still loading
        if (!currentLoading) {
          if (!currentAuth || !currentOtp) {
            console.log('[AuthGuard] Redirecting to login - not authenticated or OTP not verified', {
              authenticated: currentAuth,
              otpVerified: currentOtp,
            });
            redirectToLogin();
          } else {
            console.log('[AuthGuard] User authenticated and OTP verified, allowing access');
            isRedirecting.value = false; // Reset redirect flag if user is authenticated
          }
        } else {
          console.log('[AuthGuard] Still loading, waiting...');
        }
      }, 2000); // Increased delay for local development stability
    }
  },
  { immediate: false }, // Changed to false to avoid immediate execution before state is ready
);
</script>
