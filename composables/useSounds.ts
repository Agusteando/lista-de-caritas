type SoundName = 'present' | 'absent' | 'sick' | 'save' | 'complete' | 'logro' | 'streak' | 'milestone'

const soundRecipes: Record<SoundName, Array<{ freq: number; at: number; duration: number; gain: number }>> = {
  present: [{ freq: 520, at: 0, duration: 0.055, gain: 0.035 }, { freq: 690, at: 0.045, duration: 0.07, gain: 0.028 }],
  absent: [{ freq: 260, at: 0, duration: 0.07, gain: 0.024 }, { freq: 220, at: 0.055, duration: 0.08, gain: 0.018 }],
  sick: [{ freq: 410, at: 0, duration: 0.06, gain: 0.026 }, { freq: 360, at: 0.048, duration: 0.09, gain: 0.02 }],
  save: [{ freq: 440, at: 0, duration: 0.055, gain: 0.028 }, { freq: 660, at: 0.05, duration: 0.08, gain: 0.03 }, { freq: 880, at: 0.12, duration: 0.11, gain: 0.024 }],
  complete: [{ freq: 392, at: 0, duration: 0.06, gain: 0.025 }, { freq: 587, at: 0.05, duration: 0.08, gain: 0.026 }, { freq: 784, at: 0.13, duration: 0.13, gain: 0.022 }],
  logro: [{ freq: 600, at: 0, duration: 0.06, gain: 0.028 }, { freq: 920, at: 0.07, duration: 0.12, gain: 0.022 }],
  streak: [{ freq: 520, at: 0, duration: 0.05, gain: 0.023 }, { freq: 720, at: 0.045, duration: 0.06, gain: 0.025 }, { freq: 960, at: 0.1, duration: 0.12, gain: 0.022 }],
  milestone: [{ freq: 392, at: 0, duration: 0.06, gain: 0.023 }, { freq: 523, at: 0.055, duration: 0.07, gain: 0.024 }, { freq: 659, at: 0.11, duration: 0.09, gain: 0.024 }, { freq: 988, at: 0.18, duration: 0.14, gain: 0.019 }]
}

export function useSounds() {
  const key = 'lista-de-caritas:sound-enabled'
  const enabled = ref(true)
  let audioContext: AudioContext | null = null

  if (import.meta.client) {
    enabled.value = localStorage.getItem(key) !== 'false'
  }

  const setEnabled = (value: boolean) => {
    enabled.value = value
    if (import.meta.client) localStorage.setItem(key, String(value))
  }

  const getContext = () => {
    if (!import.meta.client || !enabled.value) return null
    audioContext ||= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  }

  const play = (name: SoundName) => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    for (const note of soundRecipes[name]) {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(note.freq, now + note.at)
      gain.gain.setValueAtTime(0.0001, now + note.at)
      gain.gain.exponentialRampToValueAtTime(note.gain, now + note.at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.duration)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now + note.at)
      oscillator.stop(now + note.at + note.duration + 0.02)
    }
  }

  return { enabled, setEnabled, play }
}
