<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'mark' | 'hero'
}>(), {
  variant: 'mark'
})

const logoSrc = '/brand-logo/logo.png'
</script>

<template>
  <span class="brand-logo" :class="props.variant === 'hero' ? 'brand-logo-hero' : 'brand-logo-mark'" aria-hidden="true">
    <img :src="logoSrc" alt="" draggable="false" loading="eager" decoding="async">
  </span>
</template>
