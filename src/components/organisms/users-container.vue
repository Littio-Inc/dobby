<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Último Acceso
              </th>
              <th class="px-6 py-3 text-center text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Acciones
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
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ user.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-60">
                {{ formatDate(user.last_login) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
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

// Initialize auth and wait for user to be authenticated
onMounted(async () => {
  console.log('[UsersContainer] Mounted, checking auth state...');
  try {
    await initializeAuth();
    console.log('[UsersContainer] Auth initialized, user:', currentUser.value?.email);
  } catch (err) {
    console.error('[UsersContainer] Error initializing auth:', err);
    error.value = 'Error inicializando autenticación';
    isLoading.value = false;
  }
});

// Watch for authentication state and load users when ready
watch(
  [isAuthenticated, authLoading, currentUser],
  async ([isAuth, authLoad, user]) => {
    console.log('[UsersContainer] Auth state changed:', { isAuth, authLoad, hasUser: !!user });

    // Wait for auth to finish loading
    if (authLoad) {
      console.log('[UsersContainer] Auth still loading, waiting...');
      return;
    }

    if (isAuth && user) {
      console.log('[UsersContainer] User authenticated, loading users...');
      await loadUsers();
    } else if (!authLoad && !isAuth) {
      console.warn('[UsersContainer] User not authenticated');
      error.value = 'No estás autenticado. Por favor, inicia sesión.';
      isLoading.value = false;
    }
  },
  { immediate: true },
);

const loadUsers = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    // Verify user is authenticated before making request
    const user = currentUser.value;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('[UsersContainer] Loading users for user:', user.email);
    const response = await azkabanApi.get('/v1/users');
    console.log('[UsersContainer] Users loaded:', response.data);
    users.value = response.data.users || [];
  } catch (err: any) {
    console.error('[UsersContainer] Error loading users:', err);
    const errorMessage = err.response?.data?.detail || err.message || 'Error al cargar usuarios';
    error.value = errorMessage;
    console.error('[UsersContainer] Error details:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
    });
  } finally {
    isLoading.value = false;
  }
};

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

onMounted(() => {
  loadUsers();
});
</script>
