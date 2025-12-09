<template>
  <div class="space-y-8">
    <NonAppliedMovementForm />

    <!-- Tabla de Transacciones -->
    <UnifiedMovementsTable
      exclude-provider="fireblocks,kira"
      title="Transacciones de Proveedores No Apificados"
      :show-fees="false"
    />
  </div>
</template>

<script setup lang="ts">
import NonAppliedMovementForm from './non-applied-movement-form.vue';
import UnifiedMovementsTable from '../molecules/unified-movements-table.vue';
</script>
