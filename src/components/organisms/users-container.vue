<template>
  <!-- Users Container Component - Updated -->
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Gestión de Usuarios.</h1>
      <p class="text-neutral-60">Administra el estado de los usuarios del sistema</p>
    </div>

    <LoadingSpinner
      v-if="isLoading"
      class="p-6"
      message="Cargando usuarios..."
    />

    <div
      v-else
      class="bg-white rounded-lg border border-neutral-20 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-5 border-b border-neutral-20">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Tipo de Usuario
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Último Acceso.
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-20">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-neutral-5"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    v-if="user.picture"
                    class="w-10 h-10 rounded-full bg-cover bg-center mr-3"
                    :style="{ backgroundImage: `url(${user.picture})` }"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-littio-primary-lime flex items-center justify-center mr-3"
                  >
                    <span class="text-littio-primary-billionaire font-bold text-sm">
                      {{ getUserInitials(user.name || user.email) }}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-90">
                      {{ user.name || 'Sin nombre' }}
                    </div>
                    <div class="text-xs text-neutral-60">ID: {{ user.id.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-neutral-90">
                  {{ user.email }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  :value="user.role"
                  :disabled="isUpdating[user.id]"
                  class="px-3 py-1.5 text-sm border border-neutral-30 rounded-md bg-white text-neutral-90 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent disabled:bg-neutral-10 disabled:cursor-not-allowed"
                  @change="handleRoleChange(user.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="user.is_active"
                    :disabled="isUpdating[user.id]"
                    class="sr-only peer"
                    @change="handleToggleUser(user.id, $event)"
                  />
                  <div
                    class="w-11 h-6 bg-neutral-40 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-littio-secondary-sky/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-littio-primary-lime"
                  />
                </label>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-60">
                {{ formatDate(user.last_login) }}
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td
                colspan="5"
                class="px-6 py-8 text-center text-neutral-60"
              >
                No hay usuarios registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="error"
      class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <p class="text-sm text-red-800">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { azkabanApi } from '../../stores/common/api-client';
import LoadingSpinner from '../atoms/loading-spinner.vue';
import { $user, $isAuthenticated, initializeAuth, $isLoading as $authLoading } from '../../stores/auth-store';

interface User {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_login: string | null;
}

const users = ref<User[]>([]);
const isLoading = ref(true);
const error = ref('');
const isUpdating = ref<Record<string, boolean>>({});

// Use stores for reactive auth state
const isAuthenticated = useStore($isAuthenticated);
const authLoading = useStore($authLoading);
const currentUser = useStore($user);

// Define loadUsers function
async function loadUsers() {
  isLoading.value = true;
  error.value = '';

  // Verify user is authenticated before making request
  const user = currentUser.value;
  if (!user) {
    const authError = new Error('Usuario no autenticado');
    error.value = authError.message;
    isLoading.value = false;
    throw authError; // Re-throw to allow watcher to handle retry logic
  }

  try {
    const response = await azkabanApi.get('/v1/users');
    // Ensure all users have a role field, default to 'user' if missing
    users.value = (response.data.users || []).map((u: User) => ({
      ...u,
      role: u.role || 'user',
    }));
    // Clear any previous errors on success
    error.value = '';
  } catch (err: any) {
    const errorMessage = err.response?.data?.detail || err.message || 'Error al cargar usuarios';
    error.value = errorMessage;
    // Re-throw to allow watcher to handle retry logic
    throw err;
  } finally {
    isLoading.value = false;
  }
}

const handleToggleUser = async (userId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const newStatus = target.checked;

  try {
    isUpdating.value[userId] = true;
    error.value = '';
    await azkabanApi.patch(`/v1/users/${userId}/status`, {
      is_active: newStatus,
    });
    // Update local state
    const user = users.value.find((u) => u.id === userId);
    if (user) {
      user.is_active = newStatus;
    }
  } catch (err: any) {
    console.error('Error updating user status:', err);
    error.value = err.response?.data?.detail || 'Error al actualizar el estado del usuario';
    // Revert checkbox
    target.checked = !newStatus;
  } finally {
    isUpdating.value[userId] = false;
  }
};

const handleRoleChange = async (userId: string, newRole: string) => {
  try {
    isUpdating.value[userId] = true;
    error.value = '';
    await azkabanApi.patch(`/v1/users/${userId}/role`, {
      role: newRole,
    });
    // Update local state
    const user = users.value.find((u) => u.id === userId);
    if (user) {
      user.role = newRole;
    }
  } catch (err: any) {
    console.error('Error updating user role:', err);
    error.value = err.response?.data?.detail || 'Error al actualizar el tipo de usuario';
    // Reload users to revert the change
    await loadUsers();
  } finally {
    isUpdating.value[userId] = false;
  }
};

const getUserInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Nunca';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
};

// Track if users have been loaded to stop the watcher
const usersLoaded = ref(false);

// Watch for auth state changes and load users when ready
// Note: immediate: false ensures watcher only runs after stores are updated
const stopWatcher = watch(
  [isAuthenticated, currentUser, authLoading],
  async ([authenticated, user, loading]) => {
    // Wait for auth initialization to complete
    if (loading) {
      return; // Still loading, wait
    }

    // If authenticated and user exists, try to load users
    if (authenticated && user && !usersLoaded.value) {
      try {
        await loadUsers();
        // Only mark as loaded and stop watcher after successful load
        usersLoaded.value = true;
        stopWatcher(); // Stop the watcher after successful load
      } catch (err) {
        // If loadUsers fails, keep watcher active so it can retry
        // The error is already set in loadUsers()
        console.error('Failed to load users, watcher will retry on next auth state change:', err);
        // Don't set usersLoaded = true, don't stop watcher
        // This allows the watcher to retry if auth state changes again
      }
    } else if (!authenticated && !usersLoaded.value) {
      // Only show error if auth is confirmed not loading and user is not authenticated
      error.value = 'No estás autenticado. Por favor, inicia sesión.';
      isLoading.value = false;
      // Don't stop watcher, allow retry if auth state changes
    }
  },
  { immediate: false }, // Changed: only run after stores are updated
);

// Initialize component
onMounted(async () => {
  try {
    await initializeAuth();
  } catch {
    error.value = 'Error inicializando autenticación';
    isLoading.value = false;
  }
});
</script>
