<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-neutral-80">Recipients</h2>
        <p class="text-sm text-neutral-60">Gestiona los recipients del sistema</p>
      </div>
      <button
        class="px-4 py-2 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-2"
        @click="openCreateModal"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Crear Recipient</span>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-neutral-20 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-5 border-b border-neutral-20">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Nombre de Empresa
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Tipo Documento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Número Documento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Banco</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Número Cuenta
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">
                Tipo Cuenta
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Provider</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-80 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-20">
            <tr
              v-for="recipient in recipients"
              :key="recipient.user_id"
              class="hover:bg-neutral-5"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.company_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.document_type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.document_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.bank_code }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.account_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.account_type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-80">
                {{ recipient.provider }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    class="text-littio-secondary-sky hover:text-littio-secondary-sky/80"
                    @click="openEditModal(recipient)"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    class="text-carmine hover:text-carmine/80"
                    @click="openDeleteModal(recipient)"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="recipients.length === 0">
              <td
                colspan="9"
                class="px-6 py-8 text-center text-neutral-60"
              >
                No hay recipients registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <RecipientFormModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :recipient="selectedRecipient"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal -->
    <DialogModal
      :is-open="isDeleteModalOpen"
      title="Eliminar Recipient"
      :message="`¿Estás seguro de que deseas eliminar el recipient ${selectedRecipient?.company_name}?`"
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
import RecipientFormModal from '../molecules/recipient-form-modal.vue';

interface Recipient {
  user_id: string;
  company_name: string;
  document_type: string;
  document_number: string;
  bank_code: string;
  account_number: string;
  account_type: string;
  pomelo_id?: string | null;
  type: 'transfer' | 'pay';
  provider: string;
}

const recipients = ref<Recipient[]>([]);
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedRecipient = ref<Recipient | null>(null);

// TODO: Integrar con API cuando esté disponible
const loadRecipients = async () => {
  // Placeholder data basado en los ejemplos proporcionados
  recipients.value = [
    {
      user_id: '60906e5b-484c-416c-8e87-f49f5aa69a8a',
      company_name: 'Pomelo Tecnologia SAS',
      document_type: 'NIT',
      document_number: '9015542761',
      bank_code: '1001',
      account_number: '500246624',
      account_type: 'checking',
      pomelo_id: 'cp_qgDCz0twxe',
      type: 'transfer',
      provider: 'COBRE',
    },
    {
      user_id: 'dd329366-a9ff-4f5b-a606-6ce0e15b5a82',
      company_name: 'Wagmi SAS',
      document_type: 'NIT',
      document_number: '901563171',
      bank_code: '1812',
      account_number: '00000317351',
      account_type: 'savings',
      pomelo_id: 'cp_DgKdK9P5Qk',
      type: 'pay',
      provider: 'COBRE',
    },
    {
      user_id: 'dd329366-a9ff-4f5b-a606-6ce0e15b5a83',
      company_name: 'Banco BBVA Colombia S.A',
      document_type: 'NIT',
      document_number: '90156317234',
      bank_code: '1013',
      account_number: '31231231233',
      account_type: 'savings',
      pomelo_id: null,
      type: 'transfer',
      provider: 'BBVA',
    },
    {
      user_id: 'dd329366-a9ff-4f5b-a606-6ce0e15b5a84',
      company_name: 'Zulu',
      document_type: 'NIT',
      document_number: '13313543242',
      bank_code: '1014',
      account_number: '442232424324',
      account_type: 'savings',
      pomelo_id: null,
      type: 'transfer',
      provider: 'ZULU',
    },
  ];
};

const openCreateModal = () => {
  selectedRecipient.value = null;
  isModalOpen.value = true;
};

const openEditModal = (recipient: Recipient) => {
  selectedRecipient.value = { ...recipient };
  isModalOpen.value = true;
};

const openDeleteModal = (recipient: Recipient) => {
  selectedRecipient.value = recipient;
  isDeleteModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedRecipient.value = null;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  selectedRecipient.value = null;
};

const handleSave = async (data: Recipient) => {
  // TODO: Integrar con API cuando esté disponible
  console.log('Saving recipient:', data);
  closeModal();
  await loadRecipients();
};

const handleDelete = async () => {
  if (!selectedRecipient.value) return;

  isDeleting.value = true;
  try {
    // TODO: Integrar con API cuando esté disponible
    console.log('Deleting recipient:', selectedRecipient.value.user_id);
    await loadRecipients();
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting recipient:', error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadRecipients();
});
</script>
