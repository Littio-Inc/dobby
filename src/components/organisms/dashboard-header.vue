<template>
  <header class="bg-white border-b border-neutral-20 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button
        @click="toggleSidebar"
        class="p-2 rounded hover:bg-neutral-20 transition-colors flex items-center justify-center"
        :title="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <svg
          class="w-6 h-6 text-neutral-80"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
          />
          <line
            x1="8"
            y1="3"
            x2="8"
            y2="21"
            stroke="currentColor"
          />
        </svg>
      </button>
      <h2 class="text-xl font-semibold text-neutral-80"></h2>
    </div>
    <div class="flex items-center gap-4 relative">
      <div
        class="relative"
        ref="dropdownRef"
      >
        <button
          @click="toggleDropdown"
          class="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-littio-primary-lime focus:ring-offset-2 rounded-lg p-1"
          :aria-expanded="isDropdownOpen"
          aria-haspopup="true"
        >
          <div class="w-10 h-10 rounded-full bg-littio-primary-lime flex items-center justify-center flex-shrink-0">
            <span class="text-littio-primary-billionaire font-bold text-sm">
              {{ userInitials }}
            </span>
          </div>
          <div class="flex flex-col text-left hidden md:block">
            <p class="text-sm font-medium text-neutral-80">
              {{ userName }}
            </p>
            <p class="text-xs text-neutral-60">
              {{ userEmail }}
            </p>
          </div>
          <ChevronDownIcon
            class="w-5 h-5 text-neutral-60 hidden md:block transition-transform duration-200"
            :class="{ 'rotate-180': isDropdownOpen }"
          />
        </button>

        <!-- Dropdown Menu -->
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="isDropdownOpen"
            class="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            role="menu"
            aria-orientation="vertical"
          >
            <div class="py-1">
              <!-- Menu Items -->
              <button
                disabled
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-40 cursor-not-allowed opacity-50"
                role="menuitem"
                title="Próximamente"
              >
                <UserIcon class="w-5 h-5 text-neutral-40" />
                <span>Perfil</span>
              </button>

              <button
                disabled
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-40 cursor-not-allowed opacity-50"
                role="menuitem"
                title="Próximamente"
              >
                <Cog6ToothIcon class="w-5 h-5 text-neutral-40" />
                <span>Configuración</span>
              </button>

              <div class="border-t border-neutral-20 my-1"></div>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-carmine hover:bg-neutral-20 transition-colors"
                role="menuitem"
              >
                <ArrowRightOnRectangleIcon class="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type Ref } from 'vue';
import { useStore } from '@nanostores/vue';
import { $user, logout } from '../../stores/auth-store';
import { $sidebarCollapsed, toggleSidebar } from '../../stores/sidebar-store';
import { goTo, Route } from '../../routes/routes';
import { ChevronDownIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';

defineProps<{
  pageTitle?: string;
}>();

const user = useStore($user);
const isCollapsed = useStore($sidebarCollapsed);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null) as Ref<HTMLElement | null>;

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

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    closeDropdown();
  }
};

// Perfil y Configuración están deshabilitadas por ahora

const handleLogout = async () => {
  closeDropdown();
  await logout();
  goTo(Route.LOGIN);
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
