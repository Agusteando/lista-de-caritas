<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'mark' | 'hero'
}>(), {
  variant: 'mark'
})
</script>

<template>
  <span class="animated-logo" :class="props.variant === 'hero' ? 'animated-logo-hero' : 'animated-logo-mark'" aria-hidden="true">
    <picture>
      <source srcset="/brand-logo/logo-animated.webp" type="image/webp">
      <img src="/brand-logo/logo-poster.png" alt="" draggable="false" loading="eager" decoding="async">
    </picture>
  </span>
</template>
