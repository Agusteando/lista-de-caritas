import { useDbPool } from '../utils/db'
import { ensureDatabaseSchema } from '../utils/schema'

export default defineNitroPlugin(async () => {
  try {
    await ensureDatabaseSchema(useDbPool())
  } catch (err) {
    console.error('schema auto-heal deferred', err)
  }
})
