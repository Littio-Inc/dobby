<template>
  <header class="bg-white border-b border-neutral-20 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold text-neutral-80">
        {{ pageTitle }}
      </h2>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-littio-primary-lime flex items-center justify-center">
          <span class="text-littio-primary-billionaire font-bold text-sm">
            {{ userInitials }}
          </span>
        </div>
        <div class="flex flex-col">
          <p class="text-sm font-medium text-neutral-80">
            {{ userName }}
          </p>
          <p class="text-xs text-neutral-60">
            {{ userEmail }}
          </p>
        </div>
      </div>
      <button
        class="px-4 py-2 bg-carmine text-white rounded hover:bg-carmine/80 transition-colors text-sm"
        @click="handleLogout"
      >
        Cerrar Sesión
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { $user, logout } from '../../stores/auth-store';
import { goTo, Route } from '../../routes/routes';

defineProps<{
  pageTitle?: string;
}>();

const user = useStore($user);

const userInitials = computed(() => {
  const name = user.value?.displayName || user.value?.email || '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const userName = computed(() => {
  return user.value?.displayName || user.value?.email || 'Usuario';
});

const userEmail = computed(() => {
  return user.value?.email || '';
});

const handleLogout = async () => {
  await logout();
  goTo(Route.LOGIN);
};
</script>
