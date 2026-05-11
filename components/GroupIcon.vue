<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string | null
  tone?: 'green' | 'red' | 'blue' | 'gold' | 'neutral'
  decorative?: boolean
}>(), {
  label: '',
  tone: 'green',
  decorative: false
})

const labels = [
  'MATERNAL A', 'MATERNAL B', 'LACTANTES B', 'LACTANTES C', 'A', 'B',
  'C', 'D', 'E', 'F', 'G', 'H',
  'ÁFRICA', 'AMÉRICA', 'ANTÁRTIDA', 'ASIA', 'EUROPA', 'OCEANÍA',
  'ABEJAS', 'BORREGOS', 'BUHOS', 'CANGUROS', 'CEBRAS', 'COCODRILOS',
  'CONEJOS', 'DINOS', 'ELEFANTES', 'FOCAS', 'JIRAFAS', 'KOALAS',
  'LEONES', 'LEOPARDOS', 'OSOS', 'PANDAS', 'PANTERAS', 'PATOS',
  'TIGRES', 'UNICORNIOS'
]

const normalizeLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const aliases: Record<string, string> = {
  OCEANIA: 'OCEANÍA',
  BUHOS: 'BUHOS',
  BÚHOS: 'BUHOS',
  CANGURO: 'CANGUROS',
  KOALA: 'KOALAS',
  PANDA: 'PANDAS',
  PATO: 'PATOS',
  TIGRE: 'TIGRES',
  UNICORNIO: 'UNICORNIOS',
  AFRICA: 'ÁFRICA',
  AMERICA: 'AMÉRICA',
  ANTARTIDA: 'ANTÁRTIDA'
}

const sprite = computed(() => {
  const raw = normalizeLabel(String(props.label || ''))
  const resolved = aliases[raw] || raw
  const normalizedLabels = labels.map(normalizeLabel)
  let index = normalizedLabels.indexOf(normalizeLabel(resolved))
  if (index === -1) {
    const lastToken = raw.split(/[\s·/-]+/).filter(Boolean).at(-1) || raw
    index = normalizedLabels.indexOf(normalizeLabel(aliases[lastToken] || lastToken))
  }
  if (index === -1) index = 17
  const cols = 6
  const rows = Math.ceil(labels.length / cols)
  const col = index % cols
  const row = Math.floor(index / cols)
  return {
    label: labels[index] || 'OCEANÍA',
    style: {
      '--sprite-col': col,
      '--sprite-row': row
    }
  }
})
</script>

<template>
  <span
    class="group-icon"
    :class="[`tone-${tone}`, { decorative }]"
    :style="sprite.style"
    :aria-label="decorative ? undefined : sprite.label"
    :aria-hidden="decorative ? 'true' : undefined"
  />
</template>
