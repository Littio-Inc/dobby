<template>
  <div class="bg-white rounded-lg border border-neutral-20 p-6 space-y-4">
    <!-- Token Header -->
    <div class="flex items-center justify-between">
      <span :class="['px-3 py-1 rounded-full text-xs font-semibold', badgeColor]">
        {{ symbol }}
      </span>
    </div>

    <!-- Balance -->
    <div class="space-y-1">
      <p class="text-3xl font-bold text-neutral-80">
        {{ formattedBalance }}
      </p>
      <p class="text-sm text-neutral-60">{{ walletsCount }} wallets</p>
    </div>

    <!-- Action Button -->
    <button
      :class="[
        'w-full px-4 py-2 border rounded transition-colors text-sm font-medium',
        isSelected
          ? 'border-littio-secondary-sky bg-littio-secondary-sky/10 text-littio-secondary-sky'
          : 'border-neutral-20 hover:bg-neutral-20/20',
      ]"
      @click="$emit('toggle')"
    >
      {{ isSelected ? 'Ocultar wallets' : 'Ver wallets' }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  symbol: string;
  formattedBalance: string;
  walletsCount: number;
  badgeColor: string;
  isSelected: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>
