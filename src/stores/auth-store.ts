import { atom, computed } from 'nanostores';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '../utils/firebase-config';

// Helper functions for localStorage persistence
const STORAGE_KEY_OTP_VERIFIED = 'azkaban_otp_verified';
const STORAGE_KEY_OTP_USER_UID = 'azkaban_otp_user_uid';
const STORAGE_KEY_OTP_SESSION_ID = 'azkaban_otp_session_id';

const getStoredOtpVerified = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OTP_VERIFIED);
    return stored === 'true';
  } catch {
    return false;
  }
};

const getStoredOtpUserUid = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_OTP_USER_UID);
  } catch {
    return null;
  }
};

const getStoredOtpSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_OTP_SESSION_ID);
  } catch {
    return null;
  }
};

const setStoredOtpVerified = (verified: boolean, userUid: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (verified && userUid) {
      localStorage.setItem(STORAGE_KEY_OTP_VERIFIED, 'true');
      localStorage.setItem(STORAGE_KEY_OTP_USER_UID, userUid);
    } else {
      localStorage.removeItem(STORAGE_KEY_OTP_VERIFIED);
      localStorage.removeItem(STORAGE_KEY_OTP_USER_UID);
    }
  } catch (e) {
    console.error('[Auth] Error saving OTP state to localStorage:', e);
  }
};

// setStoredOtpSessionId removed - not currently used

const clearStoredOtp = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_OTP_VERIFIED);
    localStorage.removeItem(STORAGE_KEY_OTP_USER_UID);
    localStorage.removeItem(STORAGE_KEY_OTP_SESSION_ID);
  } catch (e) {
    console.error('[Auth] Error clearing OTP state from localStorage:', e);
  }
};

// Initialize atoms with persisted values
const initialOtpVerified = getStoredOtpVerified();
const initialOtpSessionId = getStoredOtpSessionId();
getStoredOtpUserUid(); // Initialize but don't store in variable

export const $isAuthenticated = atom<boolean>(false);
export const $isLoading = atom<boolean>(true);
export const $user = atom<User | null>(null);
export const $userRole = atom<string | null>(null);
export const $isAdmin = computed($userRole, (role) => role === 'admin');
export const $error = atom<string>('');
export const $idToken = atom<string | null>(null);
export const $otpVerified = atom<boolean>(initialOtpVerified);
export const $otpSessionId = atom<string | null>(initialOtpSessionId);
export const $userId = atom<string | null>(null); // User ID from database

// Track if auth has been initialized to avoid multiple listeners
let authInitialized = false;

// Initialize Firebase and listen to auth changes
export const initializeAuth = () => {
  // Only initialize once
  if (authInitialized) {
    console.log('[Auth] Already initialized, skipping');
    return;
  }

  console.log('[Auth] Initializing Firebase auth...');

  try {
    const auth = getFirebaseAuth();
    console.log('[Auth] Firebase auth obtained successfully');
    authInitialized = true;

    // Set loading to true while checking auth state
    $isLoading.set(true);
    console.log('[Auth] Loading state set to true, waiting for auth state...');

    // onAuthStateChanged fires immediately with current user (or null)
    // This ensures we get the auth state right away
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        console.log('[Auth] Auth state changed:', user ? `User: ${user.email}` : 'No user');
        try {
          if (user) {
            // Verify that email is from correct domain
            if (user.email && user.email.endsWith('@littio.co')) {
              // Get current state BEFORE updating user
              const currentUserId = $user.get()?.uid;
              const isOtpVerified = $otpVerified.get();
              // Check if OTP session exists and user is authenticated (for logging)
              const hasOtpSession = $otpSessionId.get() !== null;
              const isAuth = $isAuthenticated.get();
              // These variables are used for debugging/logging purposes
              void hasOtpSession;
              void isAuth;

              // Check if user actually changed
              const userChanged = currentUserId && currentUserId !== user.uid;

              // Update user
              $user.set(user);

              // Get ID Token
              try {
                const token = await user.getIdToken();
                $idToken.set(token);

                // Sync user to database
                try {
                  const { azkabanApi } = await import('./common/api-client');
                  // Ensure we have a fresh token before syncing
                  const freshToken = await user.getIdToken(true); // Force refresh
                  $idToken.set(freshToken);

                  const syncResponse = await azkabanApi.post('/v1/users/sync');
                  console.log('[Auth] User synced to database:', syncResponse.data);

                  // Store user_id from database if available
                  if (syncResponse.data && syncResponse.data.id) {
                    $userId.set(syncResponse.data.id);
                    console.log('[Auth] User ID from sync:', syncResponse.data.id);
                  }

                  // The sync response includes the role, use it directly
                  if (syncResponse.data && syncResponse.data.role) {
                    $userRole.set(syncResponse.data.role);
                    console.log('[Auth] User role from sync:', syncResponse.data.role);
                  } else {
                    // Fallback: Get user info from database to get role
                    try {
                      const userInfoResponse = await azkabanApi.get('/v1/users/me');
                      const userInfo = userInfoResponse.data;
                      console.log('[Auth] User info from /me:', userInfo);
                      if (userInfo.role) {
                        $userRole.set(userInfo.role);
                        console.log('[Auth] User role from /me:', userInfo.role);
                      }
                    } catch (userInfoError: any) {
                      console.error('[Auth] Error getting user info:', userInfoError);
                      // Don't block if this fails
                    }
                  }
                } catch (syncError: any) {
                  console.error('[Auth] Error syncing user to database:', syncError);
                  // Don't block authentication if sync fails
                }
              } catch (tokenError: any) {
                console.error('Error getting ID token:', tokenError);
                // Continue even if token fails
              }

              // Handle OTP verification state
              // IMPORTANT: Check persisted OTP state from localStorage
              // Restore OTP state if user matches stored user UID
              const storedOtpUserUid = getStoredOtpUserUid();
              const storedOtpVerified = getStoredOtpVerified();
              const storedOtpSessionId = getStoredOtpSessionId();

              // If we have stored OTP state and user matches, restore it
              if (storedOtpUserUid === user.uid && storedOtpVerified && !isOtpVerified) {
                console.log('[Auth] Restoring OTP verification state from localStorage');
                $otpVerified.set(true);
                if (storedOtpSessionId) {
                  $otpSessionId.set(storedOtpSessionId);
                }
              }

              // Get updated OTP state after potential restoration
              const finalOtpVerified = $otpVerified.get();

              // IMPORTANT: Only reset OTP if user actually changed
              // If OTP is already verified, NEVER reset it (even on first page load)
              if (userChanged) {
                // User changed, reset OTP
                console.log('[Auth] User changed, resetting OTP');
                $otpVerified.set(false);
                $otpSessionId.set(null);
                $isAuthenticated.set(false);
                clearStoredOtp();
              } else if (currentUserId === user.uid) {
                // Same user - preserve OTP state
                if (finalOtpVerified) {
                  // OTP already verified, keep everything verified
                  console.log('[Auth] Same user with verified OTP, keeping verification');
                  $isAuthenticated.set(true);
                  // Persist state
                  setStoredOtpVerified(true, user.uid);
                  // Don't reset anything - preserve OTP state
                } else {
                  // Same user but OTP not verified yet
                  console.log('[Auth] Same user but OTP not verified yet');
                  $isAuthenticated.set(false);
                  // Don't reset OTP state here - it may be in progress
                }
              } else if (!currentUserId) {
                // First time setting user in this session
                // BUT: If OTP is already verified (from localStorage), don't reset it!
                // This happens when navigating to dashboard after OTP verification
                if (finalOtpVerified) {
                  // OTP already verified, keep it verified
                  console.log('[Auth] First time setting user but OTP already verified, keeping verification');
                  $isAuthenticated.set(true);
                  // Persist state
                  setStoredOtpVerified(true, user.uid);
                  // Don't reset anything - preserve OTP state
                } else {
                  // First time setting user and OTP not verified, reset OTP
                  console.log('[Auth] First time setting user, resetting OTP');
                  $otpVerified.set(false);
                  $isAuthenticated.set(false);
                  clearStoredOtp();
                  // Don't reset session_id here - it will be set when OTP is requested
                }
              }
            } else {
              // Email not authorized
              await signOut(auth);
              $error.set('Solo se permiten emails @littio.co');
              $isAuthenticated.set(false);
              $user.set(null);
              $idToken.set(null);
              $userId.set(null);
              $otpVerified.set(false);
              $otpSessionId.set(null);
              clearStoredOtp();
            }
          } else {
            // No user - not authenticated
            $isAuthenticated.set(false);
            $user.set(null);
            $idToken.set(null);
            // Only clear OTP if user explicitly logged out (not on initial load)
            // Check if we had a stored OTP state - if yes, user might have logged out
            if (getStoredOtpVerified()) {
              console.log('[Auth] No user but OTP was stored, clearing OTP state');
              $otpVerified.set(false);
              $otpSessionId.set(null);
              clearStoredOtp();
            }
          }
        } catch (error: any) {
          console.error('Auth state change error:', error);
          $error.set(error.message || 'Error verificando autenticación');
          $isAuthenticated.set(false);
          $user.set(null);
          $idToken.set(null);
          $userId.set(null);
        } finally {
          // Always set loading to false after checking
          $isLoading.set(false);
          console.log('[Auth] Loading state set to false');
        }
      },
      (error) => {
        // Error callback for onAuthStateChanged
        console.error('[Auth] onAuthStateChanged error:', error);
        $error.set('Error verificando estado de autenticación');
        $isLoading.set(false);
        $isAuthenticated.set(false);
        $user.set(null);
        $idToken.set(null);
        $userId.set(null);
      },
    );

    // Store unsubscribe function for cleanup if needed
    if (typeof window !== 'undefined') {
      (window as any).__AZKABAN_AUTH_UNSUBSCRIBE__ = unsubscribe;
    }

    // Fallback: If onAuthStateChanged doesn't fire within 2 seconds, set loading to false
    // This prevents infinite loading if Firebase has issues
    setTimeout(() => {
      if ($isLoading.get()) {
        console.warn("[Auth] onAuthStateChanged didn't fire within 2 seconds, forcing loading to false");
        $isLoading.set(false);
      }
    }, 2000);
  } catch (error: any) {
    console.error('[Auth] Firebase initialization error:', error);
    $error.set('Error inicializando Firebase. Verifica la configuración.');
    $isLoading.set(false);
    $isAuthenticated.set(false);
  }
};

export const login = async () => {
  try {
    $error.set('');
    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, googleProvider);

    // Verify domain
    if (result.user.email && !result.user.email.endsWith('@littio.co')) {
      await signOut(auth);
      $error.set('Solo se permiten emails @littio.co');
      return;
    }

    // After Google login, reset OTP verification
    $otpVerified.set(false);
    $otpSessionId.set(null);
    clearStoredOtp();

    // Token already obtained in onAuthStateChanged
  } catch (error: any) {
    $error.set(error.message || 'Error al iniciar sesión');
    console.error('Login error:', error);
  }
};

// DEPRECATED: requestOTP y verifyOTP fueron eliminados
// Ahora se usa setupTOTP y verifyTOTP en su lugar

export const setupTOTP = async (): Promise<{ qr_code: string; secret: string | null; manual_entry_key: string }> => {
  try {
    $error.set('');
    const token = await getIdToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const { azkabanApi } = await import('./common/api-client');
    const response = await azkabanApi.post('/v1/auth/setup-totp');

    console.log('[AuthStore] TOTP setup response:', response.data);
    return response.data;
  } catch (error: any) {
    $error.set(error.response?.data?.detail || 'Error configurando MFA');
    throw error;
  }
};

export const verifyTOTP = async (totpCode: string): Promise<void> => {
  try {
    $error.set('');
    console.log('[AuthStore] Verifying TOTP code:', totpCode);

    const { azkabanApi } = await import('./common/api-client');
    const response = await azkabanApi.post('/v1/auth/verify-totp', {
      totp_code: totpCode,
    });
    console.log('[AuthStore] TOTP verify response:', response.data);

    // Set TOTP as verified and persist to localStorage
    $otpVerified.set(true);
    $isAuthenticated.set(true);

    // Persist TOTP verification state
    const user = $user.get();
    if (user?.uid) {
      setStoredOtpVerified(true, user.uid);
      console.log('[AuthStore] TOTP verification state persisted to localStorage');
    }
  } catch (error: any) {
    // Extract clear error message
    let errorMessage = 'Código TOTP inválido. Verifica que el código sea correcto y que no haya expirado.';
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.status === 404) {
      errorMessage = 'TOTP no está configurado. Por favor, configura TOTP primero.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Código TOTP inválido. Asegúrate de usar el código más reciente de Google Authenticator.';
    }
    $error.set(errorMessage);
    throw error;
  }
};

export const getTOTPStatus = async (): Promise<{ is_configured: boolean; is_verified: boolean }> => {
  try {
    $error.set('');
    const token = await getIdToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const { azkabanApi } = await import('./common/api-client');
    const response = await azkabanApi.get('/v1/auth/totp-status');
    console.log('[AuthStore] TOTP status response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[AuthStore] Error getting TOTP status:', error);
    // If 404 or 401, TOTP is not configured
    if (error.response?.status === 404 || error.response?.status === 401) {
      return { is_configured: false, is_verified: false };
    }
    // For other errors, assume not configured
    return { is_configured: false, is_verified: false };
  }
};

export const logout = async () => {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
    $isAuthenticated.set(false);
    $user.set(null);
    $idToken.set(null);
    $userId.set(null);
    $otpVerified.set(false);
    $otpSessionId.set(null);
    clearStoredOtp();
  } catch (error: any) {
    $error.set(error.message || 'Error al cerrar sesión');
    console.error('Logout error:', error);
  }
};

export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  const user = $user.get();
  if (!user) {
    console.warn('[AuthStore] getIdToken: No user available');
    return null;
  }

  try {
    // Always get a fresh token to ensure it's valid
    const token = await user.getIdToken(forceRefresh);
    $idToken.set(token);
    console.log('[AuthStore] getIdToken: Token obtained, length:', token.length);
    return token;
  } catch (error: any) {
    console.error('[AuthStore] getIdToken error:', error);
    return null;
  }
};

// Expose auth context for microfrontends
if (typeof window !== 'undefined') {
  (window as any).__AZKABAN_AUTH__ = {
    getToken: getIdToken,
    getUser: () => $user.get(),
    onAuthChange: (callback: (user: User | null) => void) => {
      $user.subscribe(callback);
    },
  };
}
