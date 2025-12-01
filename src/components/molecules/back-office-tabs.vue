<template>
  <div class="w-full">
    <div class="flex border-b border-neutral-20">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'px-6 py-3.5 font-semibold transition-all border-b-2 text-base relative',
          activeTab === tab.value
            ? 'border-littio-secondary-sky text-littio-secondary-sky bg-white'
            : 'border-transparent text-neutral-60 hover:text-neutral-80 hover:bg-neutral-20/20',
        ]"
        @click="$emit('update:activeTab', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: string;
  tabs: Array<{ value: string; label: string }>;
}>();

defineEmits<{
  'update:activeTab': [value: string];
}>();
</script>

