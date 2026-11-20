import type { Progress } from '../progress/progress'
import type { Profile } from './store'

// The backup file a parent saves (docs/specs/parents.md, DECISIONS D18, D27). Restoring from a file was removed with
// the event log (docs/specs/accounts-sync.md): progress now follows the account, not a file.

export interface Backup {
  app: 'lomdim-vemsachakim'
  version: 1
  savedAt: number
  profiles: Profile[]
  progress: Record<string, Progress>
}

export const makeBackup = (profiles: Profile[], progress: Record<string, Progress>, savedAt: number): Backup =>
  ({ app: 'lomdim-vemsachakim', version: 1, savedAt, profiles, progress })
