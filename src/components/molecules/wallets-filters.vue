<template>
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <div class="relative">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-60" />
        <input
          :model-value="searchQuery"
          type="text"
          placeholder="Buscar wallet o proveedor..."
          class="w-full pl-10 pr-4 py-2.5 border border-neutral-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
    <div class="flex gap-3">
      <select
        :model-value="selectedType"
        class="px-4 py-2.5 border border-neutral-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-littio-secondary-sky focus:border-transparent bg-white"
        @change="$emit('update:selectedType', ($event.target as HTMLSelectElement).value)"
      >
        <option value="all">Todos los tipos</option>
        <option value="vault">Vault</option>
        <option value="otc">OTC</option>
        <option value="proveedor">Proveedor</option>
        <option value="operativa">Operativa</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

defineProps<{
  searchQuery: string;
  selectedType: string;
}>();

defineEmits<{
  'update:searchQuery': [value: string];
  'update:selectedType': [value: string];
}>();
</script>
