<script setup lang="ts">
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Loader2,
  ShieldCheck,
  UserCheck,
  UserX,
  Wifi,
  WifiOff
} from 'lucide-vue-next'

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
  confirmationStatus: 'saving' | 'confirmed' | 'offline' | 'error'
  internetOnline: boolean
  confirmedAt?: string
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

const stopTimer = () => {
  if (!timer) return
  clearInterval(timer)
  timer = null
}

const startLockTimer = () => {
  stopTimer()
  remainingSeconds.value = lockSeconds
  const unlockAt = Date.now() + lockSeconds * 1000
  timer = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000))
    if (remainingSeconds.value === 0) stopTimer()
  }, 250)
}

const unlockLabel = computed(() => `00:${pad(remainingSeconds.value)}`)
const canClose = computed(() => remainingSeconds.value <= 0)
const classLabel = computed(() => `${props.grado} ${props.grupo}`.trim().toUpperCase())
const displayDate = computed(() => formatDisplayDate(props.attendanceDate))
const submissionTime = computed(() => formatDisplayTime(props.savedAt))
const confirmationTime = computed(() => props.confirmedAt ? formatDisplayTime(props.confirmedAt) : 'Pendiente')
const folioLabel = computed(() => props.operationId.slice(-10).toUpperCase())

const isConfirmed = computed(() => props.confirmationStatus === 'confirmed')
const isSaving = computed(() => props.confirmationStatus === 'saving')
const hasWarning = computed(() => props.confirmationStatus === 'offline' || props.confirmationStatus === 'error')

const stampIcon = computed(() => {
  if (isConfirmed.value) return CheckCircle2
  if (props.confirmationStatus === 'offline') return WifiOff
  if (props.confirmationStatus === 'error') return AlertTriangle
  return Loader2
})

const stampLabel = computed(() => {
  if (isConfirmed.value) return 'Registro confirmado por servidor'
  if (props.confirmationStatus === 'offline') return 'Sin conexión: registro pendiente'
  if (props.confirmationStatus === 'error') return 'No confirmado: pendiente de guardar'
  return 'Confirmando registro con el servidor'
})

const networkLabel = computed(() => props.internetOnline ? 'Internet conectado' : 'Sin conexión a internet')

const statusDescription = computed(() => {
  if (isConfirmed.value) return 'La asistencia ya fue confirmada por el sistema. Conserva esta captura como comprobante.'
  if (props.confirmationStatus === 'offline') return 'Tu navegador reporta que no hay internet. El registro no puede confirmarse hasta recuperar conexión.'
  if (props.confirmationStatus === 'error') return 'No se recibió confirmación del servidor. Revisa la conexión; el registro queda pendiente para sincronizarse.'
  return 'Mantén esta pantalla abierta mientras se verifica la conexión y el servidor confirma el registro.'
})

const tryClose = () => {
  if (!canClose.value) return
  emit('close')
}

watch(() => props.operationId, startLockTimer)

onMounted(() => startLockTimer())

onBeforeUnmount(() => stopTimer())
</script>

<template>
  <section class="receipt-modal-backdrop" role="presentation" @click="tryClose">
    <article
      class="summary-sheet attendance-proof-modal"
      :class="{ 'is-saving': isSaving, 'is-confirmed': isConfirmed, 'has-warning': hasWarning }"
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
          <h3 id="attendance-proof-title">Comprobante de toma de asistencia</h3>
          <p id="attendance-proof-description">
            Este comprobante demuestra tu toma de asistencia para el grado {{ classLabel }} para el día {{ displayDate }}.
          </p>
        </div>
      </header>

      <div class="attendance-proof-stamp" :class="{ pending: isSaving, warning: hasWarning }" aria-live="polite">
        <component :is="stampIcon" class="icon" :class="{ spin: isSaving }" />
        <span>{{ stampLabel }}</span>
      </div>

      <div class="attendance-network-panel" :class="{ offline: !internetOnline, confirmed: isConfirmed }" aria-live="polite">
        <div class="attendance-network-main">
          <Wifi v-if="internetOnline" class="icon-sm" />
          <WifiOff v-else class="icon-sm" />
          <strong>{{ networkLabel }}</strong>
        </div>
        <p>{{ statusDescription }}</p>
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
          <dt>Hora de envío</dt>
          <dd>{{ submissionTime }}</dd>
        </div>
        <div>
          <dt>Hora confirmación</dt>
          <dd>{{ confirmationTime }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{{ isConfirmed ? 'Confirmado' : 'Pendiente' }}</dd>
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
