<template>
  <div
    :class="['grid w-full border-b border-neutral-20', tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3']"
    role="tablist"
  >
    <button
      v-for="(tab, index) in tabs"
      :key="tab.value"
      :class="[
        'px-6 py-3.5 font-semibold transition-all border-b-2 text-base',
        activeTab === tab.value
          ? 'border-littio-secondary-sky text-littio-secondary-sky bg-white'
          : 'border-transparent text-neutral-60 hover:text-neutral-80 hover:bg-neutral-20/20',
      ]"
      role="tab"
      :aria-selected="activeTab === tab.value"
      :tabindex="activeTab === tab.value ? 0 : -1"
      @click="$emit('update:activeTab', tab.value)"
      @keydown="(event) => handleKeydown(event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  activeTab: string;
  tabs: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  'update:activeTab': [value: string];
}>();

const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
      newIndex = currentIndex > 0 ? currentIndex - 1 : props.tabs.length - 1;
      event.preventDefault();
      break;
    case 'ArrowRight':
      newIndex = currentIndex < props.tabs.length - 1 ? currentIndex + 1 : 0;
      event.preventDefault();
      break;
    case 'Home':
      newIndex = 0;
      event.preventDefault();
      break;
    case 'End':
      newIndex = props.tabs.length - 1;
      event.preventDefault();
      break;
    default:
      return;
  }

  emit('update:activeTab', props.tabs[newIndex].value);
};
</script>
