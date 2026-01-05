<template>
  <aside
    class="bg-littio-primary-billionaire text-white h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300"
    :class="isCollapsed ? 'w-16' : 'w-64'"
  >
    <div
      class="border-b border-neutral-80"
      :class="isCollapsed ? 'p-4' : 'p-6'"
    >
      <div
        class="flex items-center gap-3"
        :class="isCollapsed ? 'justify-center' : ''"
      >
        <img
          :src="logoUrl"
          alt="Littio Logo"
          class="h-10 w-auto flex-shrink-0"
        />
        <h1
          class="text-2xl font-bold whitespace-nowrap transition-opacity duration-300"
          :class="isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
        >
          Littio
        </h1>
      </div>
    </div>

    <nav
      class="flex-1 overflow-y-auto"
      :class="isCollapsed ? 'p-2' : 'p-4'"
    >
      <ul class="space-y-2">
        <li
          v-for="item in menuItems"
          :key="item.id"
        >
          <a
            :href="item.path"
            class="block py-2 rounded hover:bg-neutral-100 transition-colors flex items-center gap-2 cursor-pointer"
            :class="[isCollapsed ? 'px-2 justify-center' : 'px-4', { 'bg-neutral-100': currentPath === item.path }]"
            @click.prevent="handleNavigation(item.path)"
            :title="isCollapsed ? item.name : ''"
          >
            <component
              :is="item.icon"
              class="w-5 h-5 flex-shrink-0"
            />
            <span
              class="whitespace-nowrap transition-opacity duration-300"
              :class="isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
            >
              {{ item.name }}
            </span>
          </a>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { $isAdmin, $userRole } from '../../stores/auth-store';
import { $sidebarCollapsed } from '../../stores/sidebar-store';
import { goTo, Route } from '../../routes/routes';
import {
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline';

const logoUrl = new URL('../../assets/logo.png', import.meta.url).href;

const currentPath = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
});
const isAdmin = useStore($isAdmin);
const userRole = useStore($userRole);
const isCollapsed = useStore($sidebarCollapsed);

// Debug logging
onMounted(() => {
  console.log('[NavigationSidebar] User role:', userRole.value);
  console.log('[NavigationSidebar] Is admin:', isAdmin.value);
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
      name: 'Movimientos Internos',
      path: '/back-office-movements/index.html',
      icon: DocumentTextIcon,
    },
  ];

  items.push({ id: 'configuration', name: 'Configuración', path: '/configuration/index.html', icon: Cog6ToothIcon });
  if (isAdmin.value) {
    items.push({ id: 'users', name: 'Usuarios', path: '/admin/users/index.html', icon: UserGroupIcon });
  } else {
    console.log('[NavigationSidebar] User is not admin, not showing admin menu items');
  }

  return items;
});

// currentPath computed property for template

const handleNavigation = (path: string) => {
  goTo(path as Route);
};
</script>
