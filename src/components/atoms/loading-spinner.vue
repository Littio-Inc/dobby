<template>
  <div class="flex flex-col items-center justify-center p-6">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-littio-secondary-sky" />
    <p
      v-if="message"
      class="mt-4 text-neutral-80"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>
