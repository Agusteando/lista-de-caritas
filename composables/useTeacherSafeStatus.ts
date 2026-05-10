export type TeacherSaveState = 'idle' | 'saving' | 'ready' | 'pending'

export function useTeacherSafeStatus() {
  const saveState = ref<TeacherSaveState>('idle')

  const label = computed(() => {
    if (saveState.value === 'saving') return 'Guardando'
    if (saveState.value === 'ready') return 'Listo'
    if (saveState.value === 'pending') return 'Pendiente de guardar'
    return 'Listo'
  })

  const setSaving = () => { saveState.value = 'saving' }
  const setReady = () => { saveState.value = 'ready' }
  const setPending = () => { saveState.value = 'pending' }

  return { saveState, label, setSaving, setReady, setPending }
}
