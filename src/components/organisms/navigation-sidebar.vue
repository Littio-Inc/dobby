<template>
  <aside class="w-64 bg-littio-primary-billionaire text-white h-screen flex flex-col fixed left-0 top-0 z-10">
    <div class="p-6 border-b border-neutral-80">
      <div class="flex items-center gap-3">
        <img
          :src="logoUrl"
          alt="Littio Logo"
          class="h-10 w-auto"
        />
        <h1 class="text-2xl font-bold">Littio Ledger</h1>
      </div>
    </div>

    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-2">
        <li
          v-for="item in menuItems"
          :key="item.id"
        >
          <a
            :href="item.path"
            class="block px-4 py-2 rounded hover:bg-neutral-100 transition-colors flex items-center gap-2 cursor-pointer"
            :class="{ 'bg-neutral-100': currentPath === item.path }"
            @click.prevent="handleNavigation(item.path)"
          >
            <component
              :is="item.icon"
              class="w-5 h-5"
            />
            <span>{{ item.name }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-neutral-80">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-littio-primary-lime flex items-center justify-center">
          <span class="text-littio-primary-billionaire font-bold">
            {{ userInitials }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">
            {{ userName }}
          </p>
          <p class="text-xs text-neutral-60 truncate">
            {{ userEmail }}
          </p>
        </div>
      </div>
      <button
        class="w-full px-4 py-2 bg-carmine hover:bg-carmine/80 rounded transition-colors"
        @click="handleLogout"
      >
        Cerrar Sesión
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { $user, $isAdmin, $userRole, logout } from '../../stores/auth-store';
import { goTo, Route } from '../../routes/routes';
import { HomeIcon, CurrencyDollarIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';

const logoUrl = new URL('../../assets/logo.png', import.meta.url).href;

const currentPath = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
});
const user = useStore($user);
const isAdmin = useStore($isAdmin);
const userRole = useStore($userRole);

// Debug logging
onMounted(() => {
  console.log('[NavigationSidebar] User:', user.value?.email);
  console.log('[NavigationSidebar] User role:', userRole.value);
  console.log('[NavigationSidebar] Is admin:', isAdmin.value);
});

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

const menuItems = computed(() => {
  console.log('[NavigationSidebar] Computing menu items, isAdmin:', isAdmin.value, 'role:', userRole.value);
  const items = [
    { id: 'home', name: 'Inicio', path: '/', icon: HomeIcon },
    {
      id: 'monetization',
      name: 'Monetización',
      path: '/monetization/index.html',
      icon: CurrencyDollarIcon,
    },
    {
      id: 'back-office-movements',
      name: 'Movimientos Back Office',
      path: '/back-office-movements/index.html',
      icon: DocumentTextIcon,
    },
  ];

  // Only show Users menu item if user is admin
  if (isAdmin.value) {
    console.log('[NavigationSidebar] Adding Users menu item for admin');
    items.push({ id: 'users', name: 'Usuarios', path: '/admin/users/index.html', icon: UserGroupIcon });
  } else {
    console.log('[NavigationSidebar] User is not admin, not showing Users menu');
  }

  return items;
});

// currentPath computed property for template

const handleNavigation = (path: string) => {
  goTo(path as Route);
};

const handleLogout = async () => {
  await logout();
  goTo(Route.LOGIN);
};
</script>
