<script setup lang="ts">
import { getPlantelByCode } from '~/utils/planteles'

const route = useRoute()
const plantel = String(route.params.plantel || '').trim().toUpperCase()
const query = route.fullPath.includes('?') ? route.fullPath.slice(route.fullPath.indexOf('?')) : ''

await navigateTo(getPlantelByCode(plantel) ? `/asistencia/${plantel}${query}` : '/', { replace: true })
</script>

<template>
  <main class="page-shell landing-shell" aria-live="polite" />
</template>
