<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border border-neutral-20 p-6">
      <div
        v-if="walletId"
        class="space-y-4"
      >
        <div>
          <h3 class="text-lg font-semibold text-neutral-80 mb-2">Mover fondos desde wallet</h3>
          <div class="space-y-2 text-sm">
            <p>
              <span class="font-medium text-neutral-60">Wallet:</span>
              <span class="text-neutral-80 ml-2">{{ walletName }}</span>
            </p>
            <p>
              <span class="font-medium text-neutral-60">ID:</span>
              <span class="text-neutral-80 ml-2 font-mono">{{ walletId }}</span>
            </p>
            <p>
              <span class="font-medium text-neutral-60">Balance:</span>
              <span class="text-neutral-80 ml-2">{{ walletBalance }}</span>
            </p>
            <p v-if="walletToken">
              <span class="font-medium text-neutral-60">Token:</span>
              <span class="text-neutral-80 ml-2">{{ walletToken }}</span>
            </p>
          </div>
        </div>
        <p class="text-neutral-60 text-sm">Funcionalidad de Mover Fondos - Próximamente</p>
      </div>
      <p
        v-else
        class="text-neutral-60"
      >
        Funcionalidad de Mover Fondos - Próximamente
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  walletId: string | null;
  walletName: string;
  walletBalance: string;
  walletToken: string | null;
}>();
</script>
