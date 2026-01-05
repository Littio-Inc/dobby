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
              {{ isEditMode ? 'Editar Recipient' : 'Crear Recipient' }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 overflow-y-auto flex-1">
            <form
              class="space-y-4"
              @submit.prevent="handleSubmit"
            >
              <!-- Company Name -->
              <div>
                <label
                  for="company_name"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Nombre de Empresa *
                </label>
                <input
                  id="company_name"
                  v-model="formData.company_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Document Type -->
              <div>
                <label
                  for="document_type"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Tipo de Documento *
                </label>
                <select
                  id="document_type"
                  v-model="formData.document_type"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                </select>
              </div>

              <!-- Document Number -->
              <div>
                <label
                  for="document_number"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Número de Documento *
                </label>
                <input
                  id="document_number"
                  v-model="formData.document_number"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Bank Code -->
              <div>
                <label
                  for="bank_code"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Código de Banco *
                </label>
                <input
                  id="bank_code"
                  v-model="formData.bank_code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Account Number -->
              <div>
                <label
                  for="account_number"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Número de Cuenta *
                </label>
                <input
                  id="account_number"
                  v-model="formData.account_number"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                />
              </div>

              <!-- Account Type -->
              <div>
                <label
                  for="account_type"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Tipo de Cuenta *
                </label>
                <select
                  id="account_type"
                  v-model="formData.account_type"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <!-- Type -->
              <div>
                <label
                  for="type"
                  class="block text-sm font-medium text-neutral-80 mb-1"
                >
                  Tipo *
                </label>
                <select
                  id="type"
                  v-model="formData.type"
                  required
                  class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                >
                  <option value="transfer">Transfer</option>
                  <option value="pay">Pay</option>
                </select>
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
                  <option value="COBRE">COBRE</option>
                  <option value="BBVA">BBVA</option>
                  <option value="ZULU">ZULU</option>
                </select>
              </div>

              <!-- COBRE-specific fields -->
              <template v-if="formData.provider === 'COBRE'">
                <!-- Pomelo ID -->
                <div>
                  <label
                    for="pomelo_id"
                    class="block text-sm font-medium text-neutral-80 mb-1"
                  >
                    POMELO *
                  </label>
                  <input
                    id="pomelo_id"
                    v-model="formData.pomelo_id"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                  />
                </div>

                <!-- Counter Party -->
                <div>
                  <label
                    for="counter_party"
                    class="block text-sm font-medium text-neutral-80 mb-1"
                  >
                    COUNTER_PARTY *
                  </label>
                  <input
                    id="counter_party"
                    v-model="formData.counter_party"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-neutral-30 rounded-md focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
                    placeholder="cp_..."
                  />
                </div>
              </template>
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

interface Recipient {
  user_id?: string;
  company_name: string;
  document_type: string;
  document_number: string;
  bank_code: string;
  account_number: string;
  account_type: string;
  pomelo_id?: string | null;
  counter_party?: string | null;
  type: 'transfer' | 'pay';
  provider: string;
}

interface Props {
  isOpen: boolean;
  recipient?: Recipient | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [data: Recipient];
}>();

const formData = ref<Omit<Recipient, 'user_id'>>({
  company_name: '',
  document_type: 'NIT',
  document_number: '',
  bank_code: '',
  account_number: '',
  account_type: 'checking',
  pomelo_id: null,
  counter_party: null,
  type: 'transfer',
  provider: 'COBRE',
});

const isEditMode = computed(() => !!props.recipient);

watch(
  () => props.recipient,
  (newRecipient) => {
    if (newRecipient) {
      formData.value = {
        company_name: newRecipient.company_name,
        document_type: newRecipient.document_type,
        document_number: newRecipient.document_number,
        bank_code: newRecipient.bank_code,
        account_number: newRecipient.account_number,
        account_type: newRecipient.account_type,
        pomelo_id: newRecipient.pomelo_id || null,
        counter_party: newRecipient.counter_party || null,
        type: newRecipient.type,
        provider: newRecipient.provider,
      };
    } else {
      // Reset form
      formData.value = {
        company_name: '',
        document_type: 'NIT',
        document_number: '',
        bank_code: '',
        account_number: '',
        account_type: 'checking',
        pomelo_id: null,
        counter_party: null,
        type: 'transfer',
        provider: 'COBRE',
      };
    }
  },
  { immediate: true },
);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.recipient) {
      formData.value = {
        company_name: props.recipient.company_name,
        document_type: props.recipient.document_type,
        document_number: props.recipient.document_number,
        bank_code: props.recipient.bank_code,
        account_number: props.recipient.account_number,
        account_type: props.recipient.account_type,
        pomelo_id: props.recipient.pomelo_id || null,
        counter_party: props.recipient.counter_party || null,
        type: props.recipient.type,
        provider: props.recipient.provider,
      };
    } else if (isOpen && !props.recipient) {
      formData.value = {
        company_name: '',
        document_type: 'NIT',
        document_number: '',
        bank_code: '',
        account_number: '',
        account_type: 'checking',
        pomelo_id: null,
        counter_party: null,
        type: 'transfer',
        provider: 'COBRE',
      };
    }
  },
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = () => {
  const data: Recipient = {
    ...formData.value,
    user_id: props.recipient?.user_id,
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
