<script setup lang="ts">
import { Filter, Search } from 'lucide-vue-next'

const props = defineProps<{
  searchTerm: string
}>()

const emit = defineEmits<{
  'update:searchTerm': [value: string]
}>()
</script>

<template>
  <section class="attendance-controls" aria-label="Buscar alumnos">
    <div class="search-row">
      <label class="search-box">
        <Search class="icon" />
        <input :value="props.searchTerm" type="search" placeholder="Buscar alumno..." @input="emit('update:searchTerm', ($event.target as HTMLInputElement).value)">
      </label>
      <button class="filter-button" type="button"><Filter class="icon" /> Filtros</button>
    </div>
  </section>
</template>
