<script setup lang="ts">
import { Star, Users } from 'lucide-vue-next'

const props = defineProps<{
  grupo: string
  title: string
  classCode: string
  detail?: string
  studentCountLabel: string
}>()
</script>

<template>
  <section class="class-hero-card">
    <div class="hero-badge">
      <span class="badge-aura" aria-hidden="true" />
      <span class="laurel laurel-left" aria-hidden="true" />
      <span class="laurel laurel-right" aria-hidden="true" />
      <div class="shield">
        <span class="shield-shine" aria-hidden="true" />
        <GroupIcon :label="props.grupo" tone="green" />
      </div>
      <span class="medal"><Star class="icon-sm" /></span>
    </div>

    <div class="hero-copy">
      <h2>{{ props.title }}</h2>
      <p class="hero-meta">
        <span>{{ props.classCode }}</span>
        <template v-if="props.detail"><i>•</i> {{ props.detail }}</template>
      </p>
      <p class="hero-roster-meta"><Users class="icon-sm" /> {{ props.studentCountLabel }} alumnos</p>
    </div>

    <GroupIcon :label="props.grupo" tone="green" decorative />
    <div class="hero-sparkles" aria-hidden="true" />
  </section>
</template>
