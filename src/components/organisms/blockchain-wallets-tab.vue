<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-neutral-80">Blockchain Wallets</h2>
        <p class="text-sm text-neutral-60">Gestiona las wallets blockchain del sistema</p>
      </div>
      <button
        class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-2"
        @click="openCreateModal"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Crear Wallet</span>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-neutral-20 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-5 border-b border-neutral-20">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Provider</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Wallet ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Provider ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Network</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Owner</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-20">
            <tr
              v-for="wallet in wallets"
              :key="wallet.wallet_id"
              class="hover:bg-neutral-5"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.provider }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80 font-mono text-xs">
                {{ wallet.wallet_id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.provider_id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.network }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.category }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ wallet.owner }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    wallet.enabled ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800',
                  ]"
                >
                  {{ wallet.enabled ? 'Habilitada' : 'Deshabilitada' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    class="text-littio-secondary-sky hover:text-littio-secondary-sky/80"
                    @click="openEditModal(wallet)"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    class="text-carmine hover:text-carmine/80"
                    @click="openDeleteModal(wallet)"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="wallets.length === 0">
              <td
                colspan="9"
                class="px-6 py-8 text-center text-neutral-60"
              >
                No hay wallets registradas
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <BlockchainWalletFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :wallet="selectedWallet"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal -->
    <DialogModal
      :is-open="isDeleteModalOpen"
      title="Eliminar Wallet"
      :message="`¿Estás seguro de que deseas eliminar la wallet ${selectedWallet?.name}?`"
      type="error"
      :show-confirm="true"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :is-loading="isDeleting"
      @close="closeDeleteModal"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import DialogModal from '../atoms/dialog-modal.vue';
import BlockchainWalletFormModal from '../molecules/blockchain-wallet-form-modal.vue';

interface BlockchainWallet {
  name: string;
  provider: string;
  wallet_id: string;
  provider_id: number;
  network: string;
  enabled: boolean;
  category: string;
  owner: string;
}

const wallets = ref<BlockchainWallet[]>([]);
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedWallet = ref<BlockchainWallet | null>(null);

// TODO: Integrar con API cuando esté disponible
const loadWallets = async () => {
  // Placeholder data basado en los ejemplos proporcionados
  wallets.value = [
    {
      name: 'Littio-ACH-USA',
      provider: 'FIREBLOCKS',
      wallet_id: '0x63216133EC2C76a0A5a1a0Aebb32d43CbE83Fe92',
      provider_id: 4,
      network: 'POLYGON',
      enabled: true,
      category: 'Liquidez',
      owner: 'LITTIO',
    },
    {
      name: 'Littio-Blockchain-Retiros',
      provider: 'FIREBLOCKS',
      wallet_id: '0x958be847d9E7E93B897CfCc6A9E7065C273490a9',
      provider_id: 3,
      network: 'POLYGON',
      enabled: true,
      category: 'Treasury',
      owner: 'LITTIO',
    },
    {
      name: 'Littio-Test',
      provider: 'FIREBLOCKS',
      wallet_id: '0x3390885691531951317BB47afE6F304B19bb6140',
      provider_id: 5,
      network: 'POLYGON',
      enabled: true,
      category: 'Manual retiros',
      owner: 'LITTIO',
    },
  ];
};

const openCreateModal = () => {
  selectedWallet.value = null;
  isModalOpen.value = true;
};

const openEditModal = (wallet: BlockchainWallet) => {
  selectedWallet.value = { ...wallet };
  isModalOpen.value = true;
};

const openDeleteModal = (wallet: BlockchainWallet) => {
  selectedWallet.value = wallet;
  isDeleteModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedWallet.value = null;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  selectedWallet.value = null;
};

const handleSave = async (data: BlockchainWallet) => {
  // TODO: Integrar con API cuando esté disponible
  console.log('Saving wallet:', data);
  closeModal();
  await loadWallets();
};

const handleDelete = async () => {
  if (!selectedWallet.value) return;

  isDeleting.value = true;
  try {
    // TODO: Integrar con API cuando esté disponible
    console.log('Deleting wallet:', selectedWallet.value.wallet_id);
    await loadWallets();
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting wallet:', error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadWallets();
});
</script>
