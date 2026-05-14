<script setup lang="ts">
import { Camera, CheckCircle2, Clock3, HeartPulse, ShieldCheck, UserCheck, UserX } from 'lucide-vue-next'

const props = defineProps<{
  presentes: number
  faltas: number
  enfermedad: number
  total: number
  plantel: string
  grado: string
  grupo: string
  attendanceDate: string
  savedAt: string
  operationId: string
}>()

const emit = defineEmits<{ close: [] }>()

const lockSeconds = 10
const remainingSeconds = ref(lockSeconds)
let timer: ReturnType<typeof setInterval> | null = null

const pad = (value: number) => String(value).padStart(2, '0')

const formatDisplayDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const formatDisplayTime = (value: string) => new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(new Date(value))

const unlockLabel = computed(() => `00:${pad(remainingSeconds.value)}`)
const canClose = computed(() => remainingSeconds.value <= 0)
const classLabel = computed(() => `${props.grado} ${props.grupo}`.trim().toUpperCase())
const displayDate = computed(() => formatDisplayDate(props.attendanceDate))
const displayTime = computed(() => formatDisplayTime(props.savedAt))
const folioLabel = computed(() => props.operationId.slice(-10).toUpperCase())

const tryClose = () => {
  if (!canClose.value) return
  emit('close')
}

onMounted(() => {
  const unlockAt = Date.now() + lockSeconds * 1000
  timer = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000))
    if (remainingSeconds.value === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 250)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="receipt-modal-backdrop" role="presentation" @click="tryClose">
    <article
      class="summary-sheet attendance-proof-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-proof-title"
      aria-describedby="attendance-proof-description"
      @click.stop="tryClose"
    >
      <header class="attendance-proof-head">
        <BrandLogo />
        <div class="attendance-proof-title-group">
          <span class="official-kicker"><ShieldCheck class="icon-xs" /> Comprobante oficial</span>
          <h3 id="attendance-proof-title">Toma de asistencia registrada</h3>
          <p id="attendance-proof-description">
            Este comprobante demuestra tu toma de asistencia para el grado {{ classLabel }} para el día {{ displayDate }}.
          </p>
        </div>
      </header>

      <div class="attendance-proof-stamp" aria-label="Estado guardado">
        <CheckCircle2 class="icon" />
        <span>Guardado correctamente</span>
      </div>

      <dl class="attendance-proof-meta">
        <div>
          <dt>Plantel</dt>
          <dd>{{ plantel }}</dd>
        </div>
        <div>
          <dt>Grado y grupo</dt>
          <dd>{{ classLabel }}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{{ displayDate }}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{{ displayTime }}</dd>
        </div>
      </dl>

      <div class="summary-sheet-grid attendance-proof-grid" aria-label="Estadístico de asistencia">
        <div class="summary-metric present"><UserCheck class="icon-xs" /><span>Presentes</span><strong>{{ presentes }}/{{ total }}</strong></div>
        <div class="summary-metric absent"><UserX class="icon-xs" /><span>Faltas</span><strong>{{ faltas }}</strong></div>
        <div class="summary-metric sick"><HeartPulse class="icon-xs" /><span>Enfermedad</span><strong>{{ enfermedad }}</strong></div>
      </div>

      <div class="attendance-proof-instruction">
        <Camera class="icon-sm" />
        <strong>Toma captura y mándala.</strong>
      </div>

      <footer class="attendance-proof-footer">
        <span class="attendance-proof-folio">Folio: {{ folioLabel }}</span>
        <button class="secondary-button summary-sheet-action" type="button" :disabled="!canClose" @click.stop="tryClose">
          <Clock3 v-if="!canClose" class="icon-sm" />
          {{ canClose ? 'Tocar para cerrar' : `Disponible en ${unlockLabel}` }}
        </button>
      </footer>
    </article>
  </section>
</template>
