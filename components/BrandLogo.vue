<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'mark' | 'hero'
}>(), {
  variant: 'mark'
})
</script>

<template>
  <span class="brand-logo" :class="props.variant === 'hero' ? 'brand-logo-hero' : 'brand-logo-mark'" aria-hidden="true">
    <img src="/brand-logo/logo.png" alt="" draggable="false" loading="eager" decoding="async">
  </span>
</template>
