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

const GROUP_SPRITE_COLS = 6
const GROUP_SPRITE_LABELS = [
  'MATERNAL A', 'MATERNAL B', 'LACTANTES B', 'LACTANTES C', 'A', 'B',
  'C', 'D', 'E', 'F', 'G', 'H',
  'ÁFRICA', 'AMÉRICA', 'ANTÁRTIDA', 'ASIA', 'EUROPA', 'OCEANÍA',
  'ABEJAS', 'BORREGOS', 'BUHOS', 'CANGUROS', 'CEBRAS', 'COCODRILOS',
  'CONEJOS', 'DINOS', 'ELEFANTES', 'FOCAS', 'JIRAFAS', 'KOALAS',
  'LEONES', 'LEOPARDOS', 'OSOS', 'PANDAS', 'PANTERAS', 'PATOS',
  'TIGRES', 'UNICORNIOS'
] as const

const normalizeGroupLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_.·/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const GROUP_ALIASES: Record<string, string> = {
  AFRICA: 'ÁFRICA',
  AMERICA: 'AMÉRICA',
  ANTARTIDA: 'ANTÁRTIDA',
  OCEANIA: 'OCEANÍA',
  BUHO: 'BUHOS',
  BUHOS: 'BUHOS',
  BÚHO: 'BUHOS',
  BÚHOS: 'BUHOS',
  ABEJA: 'ABEJAS',
  BORREGO: 'BORREGOS',
  CANGURO: 'CANGUROS',
  CEBRA: 'CEBRAS',
  COCODRILO: 'COCODRILOS',
  CONEJO: 'CONEJOS',
  DINO: 'DINOS',
  DINOSAURIO: 'DINOS',
  ELEFANTE: 'ELEFANTES',
  FOCA: 'FOCAS',
  JIRAFA: 'JIRAFAS',
  KOALA: 'KOALAS',
  LEON: 'LEONES',
  LEÓN: 'LEONES',
  LEOPARDO: 'LEOPARDOS',
  OSO: 'OSOS',
  PANDA: 'PANDAS',
  PANTERA: 'PANTERAS',
  PATO: 'PATOS',
  TIGRE: 'TIGRES',
  UNICORNIO: 'UNICORNIOS'
}

const normalizedLabels = GROUP_SPRITE_LABELS.map((label) => normalizeGroupLabel(label))

const resolveGroupLabel = (value: string) => {
  const normalized = normalizeGroupLabel(value)
  if (!normalized) return 'OCEANÍA'

  const alias = GROUP_ALIASES[normalized]
  if (alias) return alias

  const exactIndex = normalizedLabels.indexOf(normalized)
  if (exactIndex >= 0) return GROUP_SPRITE_LABELS[exactIndex]

  const tokens = normalized.split(/[\s·/-]+/).filter(Boolean)
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i]
    const tokenAlias = GROUP_ALIASES[token] || token
    const tokenIndex = normalizedLabels.indexOf(normalizeGroupLabel(tokenAlias))
    if (tokenIndex >= 0) return GROUP_SPRITE_LABELS[tokenIndex]
  }

  return 'OCEANÍA'
}

const sprite = computed(() => {
  const label = resolveGroupLabel(String(props.label || ''))
  const index = Math.max(0, normalizedLabels.indexOf(normalizeGroupLabel(label)))
  const rows = Math.ceil(GROUP_SPRITE_LABELS.length / GROUP_SPRITE_COLS)
  const col = index % GROUP_SPRITE_COLS
  const row = Math.floor(index / GROUP_SPRITE_COLS)
  const x = `${(col / (GROUP_SPRITE_COLS - 1)) * 100}%`
  const y = `${(row / (rows - 1)) * 100}%`

  return {
    label,
    style: {
      '--sprite-x': x,
      '--sprite-y': y
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
