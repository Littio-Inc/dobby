<template>
  <div class="flex items-center gap-3 bg-white border border-neutral-20 rounded-lg px-4 py-3 shadow-sm">
    <div class="flex items-center gap-2">
      <div :class="['h-2 w-2 rounded-full', isActive ? 'bg-green-500 animate-pulse' : 'bg-neutral-40']" />
      <div class="text-sm">
        <p class="text-neutral-60 text-xs">Última actualización:</p>
        <p class="font-mono font-medium text-neutral-80">
          {{ lastUpdateTime }}
        </p>
      </div>
    </div>

    <div class="h-8 w-px bg-neutral-20" />

    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1.5 h-8 border border-neutral-20 rounded hover:bg-neutral-20/20 transition-colors flex items-center gap-1 text-sm"
        @click="$emit('toggle')"
      >
        <PlayIcon
          v-if="!isActive"
          class="h-3 w-3"
        />
        <PauseIcon
          v-else
          class="h-3 w-3"
        />
        {{ isActive ? 'Pausar' : 'Reanudar' }}
      </button>
      <button
        :class="[
          'px-3 py-1.5 h-8 bg-littio-secondary-sky text-white rounded hover:bg-littio-secondary-sky/90 transition-colors flex items-center gap-1 text-sm',
          isRefreshing ? 'opacity-75 cursor-not-allowed' : '',
        ]"
        :disabled="isRefreshing"
        @click="$emit('refresh')"
      >
        <ArrowPathIcon :class="['h-3 w-3', isRefreshing ? 'animate-spin' : '']" />
        {{ isRefreshing ? 'Refrescando...' : 'Refrescar' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/outline';

defineProps<{
  isActive: boolean;
  isRefreshing: boolean;
  lastUpdateTime: string;
}>();

defineEmits<{
  toggle: [];
  refresh: [];
}>();
</script>
