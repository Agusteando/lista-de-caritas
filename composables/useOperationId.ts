export function useOperationId() {
  const createOperationId = (prefix = 'op') => {
    if (import.meta.client && crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
  return { createOperationId }
}
