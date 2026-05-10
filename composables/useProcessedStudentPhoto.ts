import type { MaybeRefOrGetter } from 'vue'
import { processFaceImage } from '~/utils/processFaceImage'
import { DEFAULT_STUDENT_PHOTO, hasRealStudentPhoto, normalizeStudentPhotoUrl } from '~/utils/studentPhoto'

const CACHE_PREFIX = 'lista-de-caritas:vision-photo:v1:'
const MAX_ACTIVE_JOBS = 2
let activeJobs = 0
const pendingJobs: Array<() => void> = []

const runQueued = async <T>(job: () => Promise<T>) => {
  if (activeJobs >= MAX_ACTIVE_JOBS) await new Promise<void>((resolve) => pendingJobs.push(resolve))
  activeJobs += 1
  try {
    return await job()
  } finally {
    activeJobs = Math.max(0, activeJobs - 1)
    pendingJobs.shift()?.()
  }
}

const hashKey = (value: string) => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const readCache = (key: string) => {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { src?: string; rawVisionData?: unknown; originalUrl?: string }
    if (!parsed?.src) return null
    return parsed
  } catch {
    return null
  }
}

const writeCache = (key: string, value: { src: string; rawVisionData: unknown; originalUrl: string }) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, cachedAt: new Date().toISOString() }))
  } catch {
    // Keep the raw image path. Rendering must never depend on cache writes.
  }
}

export function useProcessedStudentPhoto(rawPhoto: MaybeRefOrGetter<string | null | undefined>, stableKey?: MaybeRefOrGetter<string | null | undefined>) {
  const displaySrc = ref(DEFAULT_STUDENT_PHOTO)
  const rawSrc = ref(DEFAULT_STUDENT_PHOTO)
  const isProcessing = ref(false)
  const failed = ref(false)
  const usedProcessedPhoto = ref(false)
  const rawVisionData = shallowRef<unknown | null>(null)
  const runId = ref(0)

  const start = () => {
    if (!import.meta.client) return
    const photoValue = toValue(rawPhoto)
    const originalUrl = normalizeStudentPhotoUrl(photoValue)
    const shouldProcess = hasRealStudentPhoto(photoValue) && originalUrl !== DEFAULT_STUDENT_PHOTO
    const identity = String(toValue(stableKey) || originalUrl)
    const cacheKey = `${CACHE_PREFIX}${hashKey(`${identity}:${originalUrl}`)}`
    const currentRun = runId.value + 1
    runId.value = currentRun
    failed.value = false
    rawVisionData.value = null
    rawSrc.value = originalUrl

    const cached = shouldProcess ? readCache(cacheKey) : null
    displaySrc.value = cached?.src || originalUrl
    usedProcessedPhoto.value = Boolean(cached?.src)
    rawVisionData.value = cached?.rawVisionData || null

    if (!shouldProcess || cached?.src) {
      isProcessing.value = false
      return
    }

    isProcessing.value = true
    void runQueued(() => processFaceImage(originalUrl))
      .then((result) => {
        if (runId.value !== currentRun) return
        writeCache(cacheKey, { src: result.src, rawVisionData: result.rawVisionData, originalUrl })
        displaySrc.value = result.src
        rawVisionData.value = result.rawVisionData
        usedProcessedPhoto.value = true
      })
      .catch(() => {
        if (runId.value !== currentRun) return
        failed.value = true
        displaySrc.value = originalUrl
        usedProcessedPhoto.value = false
      })
      .finally(() => {
        if (runId.value === currentRun) isProcessing.value = false
      })
  }

  if (import.meta.client) {
    watch(() => [toValue(rawPhoto), toValue(stableKey)], start, { immediate: true })
  }

  return {
    src: displaySrc,
    rawSrc,
    fallbackSrc: DEFAULT_STUDENT_PHOTO,
    isProcessing,
    failed,
    usedProcessedPhoto,
    rawVisionData
  }
}
