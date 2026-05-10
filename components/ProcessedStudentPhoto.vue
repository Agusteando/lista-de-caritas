<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  alt: string
  cacheKey?: string | null
  groupLabel?: string | null
}>()

const visualFallback = ref(false)
const fallbackAttempted = ref(false)
const rawFallbackAttempted = ref(false)
const { src: displaySrc, rawSrc, fallbackSrc, isProcessing, failed, usedProcessedPhoto } = useProcessedStudentPhoto(
  () => props.src,
  () => props.cacheKey || props.src || ''
)

const initials = computed(() => {
  const parts = String(props.alt || '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const first = parts[0]?.[0] || ''
  const second = parts.length > 1 ? parts.at(-1)?.[0] || '' : ''
  return `${first}${second}`.toUpperCase() || 'LC'
})

watch(() => props.src, () => {
  visualFallback.value = false
  fallbackAttempted.value = false
  rawFallbackAttempted.value = false
})

watch(displaySrc, () => {
  visualFallback.value = false
})

const visibleSrc = computed(() => visualFallback.value ? '' : displaySrc.value)

const onImageError = () => {
  const current = visibleSrc.value
  const raw = rawSrc.value

  if (!rawFallbackAttempted.value && raw && current !== raw && raw !== fallbackSrc) {
    rawFallbackAttempted.value = true
    displaySrc.value = raw
    return
  }

  if (!fallbackAttempted.value && current !== fallbackSrc) {
    fallbackAttempted.value = true
    displaySrc.value = fallbackSrc
    return
  }

  visualFallback.value = true
}
</script>

<template>
  <span
    class="processed-photo-frame"
    :class="{
      'is-processing': isProcessing,
      'is-processed': usedProcessedPhoto,
      'is-fallback': visualFallback || displaySrc === fallbackSrc,
      'vision-failed': failed
    }"
  >
    <img
      v-if="!visualFallback"
      :src="visibleSrc"
      :alt="alt"
      class="avatar"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="onImageError"
    >
    <span v-else class="avatar avatar-css-fallback" aria-hidden="true">
      <GroupIcon :label="groupLabel || ''" tone="green" />
      <strong>{{ initials }}</strong>
    </span>
    <span v-if="isProcessing" class="photo-processing-indicator" aria-hidden="true" />
  </span>
</template>
