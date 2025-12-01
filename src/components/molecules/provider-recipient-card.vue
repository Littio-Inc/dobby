<template>
  <div class="bg-white rounded-lg border border-neutral-20 shadow-md p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <!-- Left: Proveedor -->
      <div class="space-y-4">
        <div>
          <p class="text-sm text-neutral-60 mb-2">Proveedor</p>
          <select
            :model-value="selectedProvider"
            class="w-full px-4 py-2.5 border border-neutral-40 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer"
            @change="$emit('update:selectedProvider', ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="provider in availableProviders"
              :key="provider.value"
              :value="provider.value"
              :disabled="provider.disabled"
            >
              {{ provider.label }}
            </option>
          </select>
        </div>

        <div>
          <p class="text-sm text-neutral-60 mb-2">Monto Total</p>
          <p class="text-3xl font-bold text-neutral-80">
            {{ formattedTotalAmount === '-' ? '-' : formattedTotalAmount }}
          </p>
        </div>
      </div>

      <!-- Right: Destinatario -->
      <div class="flex items-start gap-6">
        <div class="flex-1">
          <p class="text-sm text-neutral-60 mb-2">Destinatario</p>
          <div class="flex items-center gap-4">
            <select
              :model-value="selectedRecipient"
              class="flex-1 px-4 py-2.5 border border-neutral-40 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky appearance-none cursor-pointer"
              @change="$emit('update:selectedRecipient', ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Seleccionar destinatario</option>
              <option
                v-for="recipient in recipients"
                :key="recipient.id"
                :value="recipient.id"
              >
                {{ getRecipientDisplayName(recipient) }}
              </option>
            </select>

            <!-- Avatar -->
            <div
              v-if="selectedRecipientData"
              class="w-12 h-12 rounded-full bg-littio-secondary-sky flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            >
              {{ getRecipientInitials(selectedRecipientData) }}
            </div>

            <!-- Action Button -->
            <button
              :disabled="!canMonetize || isProcessing"
              class="px-6 py-3 bg-littio-secondary-sky text-white rounded-lg hover:bg-littio-secondary-sky/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-sm whitespace-nowrap flex-shrink-0"
              @click="$emit('monetize')"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Monetizar & Enviar
            </button>
          </div>

          <!-- Recipient Details -->
          <div
            v-if="selectedRecipientData"
            class="mt-3"
          >
            <p class="font-semibold text-lg text-neutral-80 mb-2">
              {{ getRecipientDisplayName(selectedRecipientData) }}
            </p>
            <div class="flex gap-2 flex-wrap">
              <span
                v-if="selectedRecipientData.bank"
                class="px-2.5 py-1 bg-white text-neutral-70 text-xs rounded-md border border-neutral-40"
              >
                {{ selectedRecipientData.bank }}
              </span>
              <span
                v-if="selectedRecipientData.account_type"
                class="px-2.5 py-1 bg-white text-neutral-70 text-xs rounded-md border border-neutral-40"
              >
                {{ selectedRecipientData.account_type }}
              </span>
              <span
                v-if="selectedRecipientData.account_type === 'Empresa' || selectedRecipientData.type === 'company'"
                class="px-2.5 py-1 bg-white text-neutral-70 text-xs rounded-md border border-neutral-40"
              >
                Empresa
              </span>
              <span
                v-if="selectedRecipientData.account_number"
                class="px-2.5 py-1 bg-white text-neutral-70 text-xs rounded-md border border-neutral-40 font-mono"
              >
                ....{{ selectedRecipientData.account_number.slice(-4) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Recipient {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  bank?: string;
  account_type?: string;
  account_number?: string;
  type?: string;
}

interface Provider {
  value: string;
  label: string;
  disabled: boolean;
}

const props = defineProps<{
  selectedProvider: string;
  selectedRecipient: string;
  recipients: Recipient[];
  availableProviders: Provider[];
  formattedTotalAmount: string;
  canMonetize: boolean;
  isProcessing: boolean;
}>();

defineEmits<{
  'update:selectedProvider': [value: string];
  'update:selectedRecipient': [value: string];
  monetize: [];
}>();

const selectedRecipientData = computed(() => {
  if (!props.selectedRecipient) return null;
  return props.recipients.find((r) => r.id === props.selectedRecipient) || null;
});

const getRecipientDisplayName = (recipient: Recipient) => {
  if (recipient.name) return recipient.name;
  if (recipient.first_name || recipient.last_name) {
    return `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim();
  }
  return 'Destinatario';
};

const getRecipientInitials = (recipient: Recipient) => {
  const name = getRecipientDisplayName(recipient);
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
</script>
