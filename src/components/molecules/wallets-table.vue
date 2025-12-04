<template>
  <div class="bg-white rounded-lg border border-neutral-20 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-neutral-10 border-b border-neutral-20">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">Tipo</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
              Blockchain
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
              Proveedor
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-60 uppercase tracking-wider">
              Balance{{ selectedToken ? ` ${selectedToken}` : '' }}
            </th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-60 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-20">
          <tr
            v-if="wallets.length === 0"
            class="hover:bg-neutral-10"
          >
            <td
              colspan="6"
              class="px-6 py-8 text-center text-neutral-60"
            >
              No se encontraron wallets
            </td>
          </tr>
          <tr
            v-for="wallet in wallets"
            :key="wallet.id"
            class="hover:bg-neutral-10 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div>
                  <p class="text-sm font-medium text-neutral-80">
                    {{ wallet.name }}
                  </p>
                  <div class="flex items-center gap-1 mt-1">
                    <p class="text-xs text-neutral-60">
                      {{ wallet.id }}
                    </p>
                    <button
                      class="text-neutral-60 hover:text-neutral-80 transition-colors"
                      @click="$emit('copyId', wallet.id)"
                      title="Copiar ID"
                    >
                      <DocumentDuplicateIcon class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold', wallet.typeBadgeColor]">
                {{ wallet.type }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-neutral-80">
                {{ wallet.blockchain }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-neutral-80">
                {{ wallet.provider || '-' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-neutral-80">
                {{ wallet.formattedBalance }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div
                class="relative"
                data-wallet-menu
              >
                <button
                  class="p-1.5 text-neutral-60 hover:text-neutral-80 hover:bg-neutral-20 rounded transition-colors"
                  @click.stop="toggleMenu(wallet.id)"
                  title="Más opciones"
                >
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </button>
                
                <!-- Dropdown Menu -->
                <div
                  v-if="openMenuId === wallet.id"
                  class="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-neutral-20 shadow-lg z-10"
                  @click.stop
                >
                  <button
                    class="w-full px-4 py-3 text-left text-sm text-neutral-80 hover:bg-neutral-10 flex items-center gap-3 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    @click="handleMoveFunds(wallet.id)"
                  >
                    <ArrowsRightLeftIcon class="h-5 w-5 text-neutral-60" />
                    <span>Mover fondos</span>
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { DocumentDuplicateIcon, EllipsisVerticalIcon, ArrowsRightLeftIcon } from '@heroicons/vue/24/outline';

interface WalletRow {
  id: string;
  name: string;
  type: string;
  typeBadgeColor: string;
  blockchain: string;
  provider: string | null;
  formattedBalance: string;
}

defineProps<{
  wallets: WalletRow[];
  selectedToken: string | null;
}>();

const emit = defineEmits<{
  copyId: [id: string];
  actions: [id: string];
  moveFunds: [id: string];
}>();

const openMenuId = ref<string | null>(null);

const toggleMenu = (walletId: string) => {
  if (openMenuId.value === walletId) {
    openMenuId.value = null;
  } else {
    openMenuId.value = walletId;
  }
};

const handleMoveFunds = (walletId: string) => {
  emit('moveFunds', walletId);
  openMenuId.value = null; // Cerrar el menú después de hacer clic
};

const closeMenuOnClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('[data-wallet-menu]')) {
    openMenuId.value = null;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside);
});
</script>
