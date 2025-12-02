<template>
  <div
    v-if="message"
    class="bg-red-50 border border-red-200 rounded-lg p-4"
  >
    <p class="text-red-800 text-sm">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string | null;
}>();
</script>

