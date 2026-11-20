import { phraseOfFile } from './filename'

const recordingFiles = import.meta.glob('/src/audio/he/*.{mp3,m4a,ogg,webm,wav}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

interface RecordingState {
  recordings: Map<string, string>
  revision: number
}

const state: RecordingState = import.meta.hot?.data.recordingState ?? {
  recordings: new Map(),
  revision: 0,
}

// Keep existing audio consumers in sync without refreshing their components.
const devBust = import.meta.env.DEV ? `?t=${Date.now()}` : ''
state.recordings.clear()
for (const [path, url] of Object.entries(recordingFiles)) {
  state.recordings.set(phraseOfFile(path.replace(/^.*\/([^/]+)\.\w+$/, '$1')), url + devBust)
}
state.revision++

export const recordings: ReadonlyMap<string, string> = state.recordings
export const recordingRevision = () => state.revision

if (import.meta.hot) {
  import.meta.hot.data.recordingState = state
  import.meta.hot.accept()
}
