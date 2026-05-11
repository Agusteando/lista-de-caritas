<script setup lang="ts">
import { Check, Circle, Filter, Search, Thermometer, UserMinus, X } from 'lucide-vue-next'
import type { AttendanceStatus } from '~/types/domain'

const props = defineProps<{
  searchTerm: string
  statusFilter: 'all' | AttendanceStatus
}>()

const emit = defineEmits<{
  'update:searchTerm': [value: string]
  'update:statusFilter': [value: 'all' | AttendanceStatus]
}>()

const filters: Array<{ value: 'all' | AttendanceStatus; label: string; icon?: 'present' | 'absent' | 'sick' | 'unmarked' }> = [
  { value: 'all', label: 'Todos' },
  { value: 'present', label: 'Presentes', icon: 'present' },
  { value: 'absent', label: 'Faltas', icon: 'absent' },
  { value: 'sick', label: 'Enfermos', icon: 'sick' },
  { value: 'unmarked', label: 'Sin marcar', icon: 'unmarked' }
]

const filterOpen = ref(false)
const filterRoot = ref<HTMLElement | null>(null)
const activeFilterLabel = computed(() => filters.find((filter) => filter.value === props.statusFilter)?.label || 'Filtros')

const selectFilter = (value: 'all' | AttendanceStatus) => {
  emit('update:statusFilter', value)
  filterOpen.value = false
}

const clearFilters = () => {
  emit('update:statusFilter', 'all')
  emit('update:searchTerm', '')
  filterOpen.value = false
}

const closeFilter = () => { filterOpen.value = false }

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target || !filterRoot.value || filterRoot.value.contains(target)) return
  closeFilter()
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <section class="attendance-controls" aria-label="Buscar alumnos">
    <div class="search-row">
      <label class="search-box">
        <Search class="icon" />
        <input :value="props.searchTerm" type="search" placeholder="Buscar alumno..." @input="emit('update:searchTerm', ($event.target as HTMLInputElement).value)">
      </label>
      <div ref="filterRoot" class="filter-wrap" @keydown.esc="closeFilter">
        <button class="filter-button" :class="{ active: props.statusFilter !== 'all' }" type="button" aria-haspopup="menu" :aria-expanded="filterOpen" @click="filterOpen = !filterOpen">
          <Filter class="icon" />
          <span>{{ props.statusFilter === 'all' ? 'Filtros' : activeFilterLabel }}</span>
        </button>
        <div v-if="filterOpen" class="filter-popover" role="menu">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            role="menuitemradio"
            :aria-checked="props.statusFilter === filter.value"
            :class="{ active: props.statusFilter === filter.value }"
            @click="selectFilter(filter.value)"
          >
            <Check v-if="filter.icon === 'present'" class="icon-sm" />
            <UserMinus v-else-if="filter.icon === 'absent'" class="icon-sm" />
            <Thermometer v-else-if="filter.icon === 'sick'" class="icon-sm" />
            <Circle v-else-if="filter.icon === 'unmarked'" class="icon-sm" />
            <Filter v-else class="icon-sm" />
            {{ filter.label }}
          </button>
          <button v-if="props.statusFilter !== 'all' || props.searchTerm" type="button" class="clear-filter" role="menuitem" @click="clearFilters">
            <X class="icon-sm" /> Limpiar
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
