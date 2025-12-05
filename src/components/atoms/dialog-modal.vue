<template>
  <Teleport to="body">
    <Transition
      name="dialog"
      appear
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" />

        <!-- Dialog -->
        <div
          class="relative bg-white rounded-lg border border-neutral-20 shadow-md max-w-md w-full mx-4 overflow-hidden"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-20">
            <div class="flex items-center gap-3">
              <!-- Icon -->
              <div
                :class="[
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  type === 'error'
                    ? 'bg-carmine text-white'
                    : type === 'success'
                      ? 'bg-green-500 text-white'
                      : 'bg-littio-secondary-sky text-white',
                ]"
              >
                <svg
                  v-if="type === 'error'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="type === 'success'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <!-- Title -->
              <h3 :class="['text-lg font-semibold', type === 'error' ? 'text-carmine' : 'text-neutral-80']">
                {{ title }}
              </h3>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <div
              v-if="isLoading"
              class="flex flex-col items-center justify-center py-8"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-littio-secondary-sky mb-4" />
              <p class="text-neutral-70 text-sm">Procesando pago...</p>
            </div>
            <p
              v-else
              class="text-neutral-70 text-sm leading-relaxed whitespace-pre-line"
            >
              {{ message }}
            </p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-neutral-20/50 border-t border-neutral-20 flex justify-end gap-3">
            <button
              v-if="!isLoading"
              type="button"
              class="px-4 py-2 text-neutral-70 bg-white border border-neutral-40 rounded-lg hover:bg-neutral-20 focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky/20 focus:border-littio-secondary-sky transition-colors text-sm font-medium"
              @click="handleClose"
            >
              {{ cancelText }}
            </button>
            <button
              v-if="showConfirm && !isLoading"
              type="button"
              :class="[
                'px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium',
                type === 'error'
                  ? 'bg-carmine hover:bg-carmine/90 focus:ring-carmine/20'
                  : 'bg-littio-secondary-sky hover:bg-littio-secondary-sky/90 focus:ring-littio-secondary-sky/20',
              ]"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'info' | 'error' | 'success';
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Información',
  type: 'info',
  showConfirm: false,
  confirmText: 'Aceptar',
  cancelText: 'Cerrar',
  isLoading: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  // Don't close if loading - let the parent handle it
  if (props.isLoading) {
    return; // Don't do anything if already loading
  }
  emit('confirm');
  // Don't close here - let the parent component handle closing after async operations
};

// Cerrar con ESC (only if not loading)
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !props.isLoading) {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }
  },
);
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active > div:last-child,
.dialog-leave-active > div:last-child {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.dialog-enter-from > div:last-child,
.dialog-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
