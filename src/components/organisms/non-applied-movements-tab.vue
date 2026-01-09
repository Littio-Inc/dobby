<template>
  <div class="space-y-8">
    <NonAppliedMovementForm @movement-created="handleMovementCreated" />

    <!-- Tabla de Transacciones -->
    <UnifiedMovementsTable
      ref="movementsTableRef"
      exclude-provider="fireblocks,kira"
      movement-type="internal"
      title="Transacciones de Proveedores No Apificados"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import NonAppliedMovementForm from './non-applied-movement-form.vue';
import UnifiedMovementsTable from '../molecules/unified-movements-table.vue';

const movementsTableRef = ref<InstanceType<typeof UnifiedMovementsTable> | null>(null);

const handleMovementCreated = () => {
  // Refrescar la tabla cuando se crea un nuevo movimiento
  if (movementsTableRef.value) {
    movementsTableRef.value.refresh();
  }
};
</script>
