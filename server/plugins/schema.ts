import { useDbPool } from '../utils/db'
import { ensureLogrosSchema } from '../utils/schema'

export default defineNitroPlugin(async () => {
  try {
    await ensureLogrosSchema(useDbPool())
  } catch (err) {
    console.error('logros schema auto-heal deferred', err)
  }
})
