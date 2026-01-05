<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-neutral-80">Webhooks</h2>
        <p class="text-sm text-neutral-60">Gestiona los webhooks de Fireblocks</p>
      </div>
      <button
        class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-2"
        @click="openCreateModal"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Crear Webhook</span>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-neutral-20 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-5 border-b border-neutral-20">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">URL</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Descripción
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Eventos</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-20">
            <tr
              v-for="webhook in webhooks"
              :key="webhook.url"
              class="hover:bg-neutral-5"
            >
              <td class="px-6 py-4 text-sm text-neutral-80">
                <div class="max-w-xs truncate font-mono text-xs">
                  {{ webhook.url }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-neutral-80">
                {{ webhook.description }}
              </td>
              <td class="px-6 py-4 text-sm text-neutral-80">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="event in webhook.events"
                    :key="event"
                    class="px-2 py-1 text-xs bg-littio-secondary-sky/10 text-littio-secondary-sky border border-littio-secondary-sky/20 rounded font-mono"
                  >
                    {{ event }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    webhook.enabled ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800',
                  ]"
                >
                  {{ webhook.enabled ? 'Habilitado' : 'Deshabilitado' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    class="text-littio-secondary-sky hover:text-littio-secondary-sky/80"
                    @click="openEditModal(webhook)"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    class="text-carmine hover:text-carmine/80"
                    @click="openDeleteModal(webhook)"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="webhooks.length === 0">
              <td
                colspan="5"
                class="px-6 py-8 text-center text-neutral-60"
              >
                No hay webhooks registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <WebhookFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :webhook="selectedWebhook"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal -->
    <DialogModal
      :is-open="isDeleteModalOpen"
      title="Eliminar Webhook"
      :message="`¿Estás seguro de que deseas eliminar el webhook ${selectedWebhook?.url}?`"
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
import WebhookFormModal from '../molecules/webhook-form-modal.vue';

interface Webhook {
  url: string;
  description: string;
  events: string[];
  enabled: boolean;
}

const webhooks = ref<Webhook[]>([]);
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedWebhook = ref<Webhook | null>(null);

// TODO: Integrar con API cuando esté disponible
const loadWebhooks = async () => {
  // Placeholder data basado en el ejemplo proporcionado
  webhooks.value = [
    {
      url: 'https://ejemplo.com/webhook',
      description: 'webhook transactions',
      events: ['transaction.created', 'transaction.status.updated', 'transaction.approval_status.updated'],
      enabled: true,
    },
  ];
};

const openCreateModal = () => {
  selectedWebhook.value = null;
  isModalOpen.value = true;
};

const openEditModal = (webhook: Webhook) => {
  selectedWebhook.value = { ...webhook };
  isModalOpen.value = true;
};

const openDeleteModal = (webhook: Webhook) => {
  selectedWebhook.value = webhook;
  isDeleteModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedWebhook.value = null;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  selectedWebhook.value = null;
};

const handleSave = async (data: Webhook) => {
  // TODO: Integrar con API cuando esté disponible
  console.log('Saving webhook:', data);
  closeModal();
  await loadWebhooks();
};

const handleDelete = async () => {
  if (!selectedWebhook.value) return;

  isDeleting.value = true;
  try {
    // TODO: Integrar con API cuando esté disponible
    console.log('Deleting webhook:', selectedWebhook.value.url);
    await loadWebhooks();
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting webhook:', error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadWebhooks();
});
</script>
