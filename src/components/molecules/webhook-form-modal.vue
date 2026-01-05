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
              {{ isEditMode ? 'Editar Webhook' : 'Crear Webhook' }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 overflow-y-auto flex-1">
            <form
              class="space-y-4"
              @submit.prevent="handleSubmit"
            >
              <!-- URL -->
              <div>
                <label
                  for="url"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  URL *
                </label>
                <input
                  id="url"
                  v-model="formData.url"
                  type="url"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent font-mono text-sm"
                  placeholder="https://ejemplo.com/webhook"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  for="description"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Descripción *
                </label>
                <input
                  id="description"
                  v-model="formData.description"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                  placeholder="webhook transactions"
                />
              </div>

              <!-- Events (Multi-select) -->
              <div>
                <label class="block text-sm font-medium text-neutral-80 mb-2"> Eventos * </label>
                <div class="border border-neutral-30 rounded-md p-3 max-h-64 overflow-y-auto">
                  <div
                    v-for="event in availableEvents"
                    :key="event"
                    class="flex items-center gap-2 py-1"
                  >
                    <input
                      :id="`event-${event}`"
                      :checked="formData.events.includes(event)"
                      type="checkbox"
                      class="w-4 h-4 text-littio-secondary-sky border-neutral-30 rounded focus:ring-littio-secondary-sky"
                      @change="toggleEvent(event)"
                    />
                    <label
                      :for="`event-${event}`"
                      class="text-sm text-neutral-80 cursor-pointer flex-1"
                    >
                      {{ event }}
                    </label>
                  </div>
                </div>
                <p class="text-xs text-neutral-60 mt-1">
                  Selecciona uno o más eventos. Eventos seleccionados: {{ formData.events.length }}
                </p>
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
                  Habilitado
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
              :disabled="formData.events.length === 0"
              class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

interface Webhook {
  url: string;
  description: string;
  events: string[];
  enabled: boolean;
}

interface Props {
  isOpen: boolean;
  webhook?: Webhook | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [data: Webhook];
}>();

// Lista de eventos disponibles (basada en la imagen compartida - estos son los eventos comunes de Fireblocks)
// TODO: Actualizar con la lista completa cuando se comparta
const availableEvents = [
  'transaction.created',
  'transaction.status.updated',
  'transaction.approval_status.updated',
  'transaction.network_records.processing_completed',
  'external_wallet.asset.added',
  'external_wallet.asset.removed',
  'internal_wallet.asset.added',
  'internal_wallet.asset.removed',
  'contract_wallet.asset.added',
  'contract_wallet.asset.removed',
  'vault_account.created',
  'vault_account.asset.added',
  'vault_account.asset.balance_updated',
  'embedded_wallet.status.updated',
  'embedded_wallet.created',
  'embedded_wallet.asset.balance_updated',
  'embedded_wallet.asset.added',
  'embedded_wallet.account.created',
  'embedded_wallet.device.added',
  'onchain_data.updated',
  'connection.added',
  'connection.removed',
  'connection.request.waiting_peer_approval',
  'connection.request.rejected_by_peer',
].sort();

const formData = ref<Webhook>({
  url: '',
  description: '',
  events: [],
  enabled: true,
});

const isEditMode = computed(() => !!props.webhook);

const toggleEvent = (event: string) => {
  const index = formData.value.events.indexOf(event);
  if (index > -1) {
    formData.value.events.splice(index, 1);
  } else {
    formData.value.events.push(event);
  }
};

watch(
  () => props.webhook,
  (newWebhook) => {
    if (newWebhook) {
      formData.value = {
        url: newWebhook.url,
        description: newWebhook.description,
        events: [...newWebhook.events],
        enabled: newWebhook.enabled,
      };
    } else {
      formData.value = {
        url: '',
        description: '',
        events: [],
        enabled: true,
      };
    }
  },
  { immediate: true },
);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.webhook) {
      formData.value = {
        url: props.webhook.url,
        description: props.webhook.description,
        events: [...props.webhook.events],
        enabled: props.webhook.enabled,
      };
    } else if (isOpen && !props.webhook) {
      formData.value = {
        url: '',
        description: '',
        events: [],
        enabled: true,
      };
    }
  },
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = () => {
  if (formData.value.events.length === 0) {
    return;
  }
  const data: Webhook = {
    url: formData.value.url,
    description: formData.value.description,
    events: [...formData.value.events],
    enabled: formData.value.enabled,
  };
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
