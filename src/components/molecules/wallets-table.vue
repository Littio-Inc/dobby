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
              <button
                class="p-1.5 text-neutral-60 hover:text-neutral-80 hover:bg-neutral-20 rounded transition-colors"
                @click="$emit('actions', wallet.id)"
                title="Más opciones"
              >
                <EllipsisVerticalIcon class="h-5 w-5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DocumentDuplicateIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline';

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

defineEmits<{
  copyId: [id: string];
  actions: [id: string];
}>();
</script>
