<template>
  <Teleport to="body">
    <Transition
      name="modal"
      appear
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" />

        <!-- Modal -->
        <div
          class="relative bg-white rounded-lg border border-neutral-20 shadow-md max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-20">
            <h3 class="text-lg font-semibold text-neutral-80">
              {{ isEditMode ? 'Editar Blockchain Wallet' : 'Crear Blockchain Wallet' }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 overflow-y-auto flex-1">
            <form
              class="space-y-4"
              @submit.prevent="handleSubmit"
            >
              <!-- Name (Dropdown - TODO: leer de servicio Diagon) -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Nombre *
                </label>
                <select
                  id="name"
                  v-model="formData.name"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option
                    value=""
                    disabled
                  >
                    Selecciona una wallet
                  </option>
                  <!-- TODO: Cargar dinámicamente desde servicio Diagon -->
                  <option value="Littio-ACH-USA">Littio-ACH-USA</option>
                  <option value="Littio-Blockchain-Retiros">Littio-Blockchain-Retiros</option>
                  <option value="Littio-Test">Littio-Test</option>
                </select>
                <p class="text-xs text-neutral-60 mt-1">Las wallets se cargarán desde el servicio Diagon</p>
              </div>

              <!-- Provider -->
              <div>
                <label
                  for="provider"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Provider *
                </label>
                <select
                  id="provider"
                  v-model="formData.provider"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option value="FIREBLOCKS">FIREBLOCKS</option>
                </select>
              </div>

              <!-- Wallet ID -->
              <div>
                <label
                  for="wallet_id"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Wallet ID *
                </label>
                <input
                  id="wallet_id"
                  v-model="formData.wallet_id"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <!-- Provider ID -->
              <div>
                <label
                  for="provider_id"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Provider ID *
                </label>
                <input
                  id="provider_id"
                  v-model.number="formData.provider_id"
                  type="number"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Network -->
              <div>
                <label
                  for="network"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Network *
                </label>
                <select
                  id="network"
                  v-model="formData.network"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option value="POLYGON">POLYGON</option>
                  <option value="ETHEREUM">ETHEREUM</option>
                  <option value="BITCOIN">BITCOIN</option>
                </select>
              </div>

              <!-- Category -->
              <div>
                <label
                  for="category"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  v-model="formData.category"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option
                    v-for="cat in uniqueCategories"
                    :key="cat"
                    :value="cat"
                  >
                    {{ cat }}
                  </option>
                </select>
              </div>

              <!-- Owner -->
              <div>
                <label
                  for="owner"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Owner *
                </label>
                <input
                  id="owner"
                  v-model="formData.owner"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Enabled -->
              <div class="flex items-center gap-3">
                <input
                  id="enabled"
                  v-model="formData.enabled"
                  type="checkbox"
                  class="w-4 h-4 text-littio-secondary-sky border-neutral-30 rounded focus:ring-littio-secondary-sky"
                />
                <label
                  for="enabled"
                  class="text-sm font-medium text-neutral-80"
                >
                  Habilitada
                </label>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-neutral-20/50 border-t border-neutral-20 flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 text-neutral-70 bg-white border border-neutral-40 rounded-lg hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky transition-colors text-sm font-medium"
              @click="handleClose"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 transition-colors text-sm font-medium"
              @click="handleSubmit"
            >
              {{ isEditMode ? 'Guardar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

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

interface Props {
  isOpen: boolean;
  wallet?: BlockchainWallet | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [data: BlockchainWallet];
}>();

// Lista de categorías únicas (basada en los datos proporcionados)
const uniqueCategories = [
  'Blockchain',
  'Blockchain autom recargas',
  'Blockchain autom retiros',
  'Bridge',
  'Bridge Recargas IBAN',
  'Bridge recargas',
  'Bridge retiros',
  'Compras/ventas OTC',
  'Cybrid recargas',
  'Hot',
  'Inversiones',
  'Koywe',
  'Koywe recargas',
  'Koywe retiros',
  'Liquidez',
  'Liquidez operaciones COPM B2B',
  'Littio-ext-koywe-retiros',
  'Manual recargas',
  'Manual retiros',
  'Manuales recargas',
  'Mesh recargas',
  'Minteo',
  'Open trade',
  'Pruebas tech',
  'Recargas Bridge',
  'Recargas Bridge EUR',
  'Recargas Blockchain',
  'Recargas manual',
  'Recargas Mesh',
  'Retiros Blockchain',
  'Retiros Bridge',
  'Retiros Bridge IBAN',
  'Retiros COPM',
  'Retiros Manuales',
  'Ripio',
  'Single use s',
  'Swap USDC eth',
  'Swap USDC pol',
  'Swap USDT pol',
  'Treasury',
  'Treasury / Liquidez',
  'Treasury / Liquidez EUR',
  'Ventas OTC',
  'Ventas OTC - Kira',
  'Ventas OTC - Pomelo',
  'Working Capital',
  'entrada',
  'salida',
].sort();

const formData = ref<BlockchainWallet>({
  name: '',
  provider: 'FIREBLOCKS',
  wallet_id: '',
  provider_id: 0,
  network: 'POLYGON',
  enabled: true,
  category: '',
  owner: 'LITTIO',
});

const isEditMode = computed(() => !!props.wallet);

watch(
  () => props.wallet,
  (newWallet) => {
    if (newWallet) {
      formData.value = { ...newWallet };
    } else {
      formData.value = {
        name: '',
        provider: 'FIREBLOCKS',
        wallet_id: '',
        provider_id: 0,
        network: 'POLYGON',
        enabled: true,
        category: '',
        owner: 'LITTIO',
      };
    }
  },
  { immediate: true },
);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.wallet) {
      formData.value = { ...props.wallet };
    } else if (isOpen && !props.wallet) {
      formData.value = {
        name: '',
        provider: 'FIREBLOCKS',
        wallet_id: '',
        provider_id: 0,
        network: 'POLYGON',
        enabled: true,
        category: '',
        owner: 'LITTIO',
      };
    }
  },
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = () => {
  const data: BlockchainWallet = { ...formData.value };
  emit('save', data);
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
