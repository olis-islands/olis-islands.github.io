import { expect, test } from '@playwright/test'
import react from '@vitejs/plugin-react'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { studioPlugin } from '../scripts/studio-plugin'

test('recording and re-recording keep the studio open and update playback', async ({ page }) => {
  const project = process.cwd()
  const root = await mkdtemp(join(tmpdir(), 'oli-studio-test-'))
  const audio = join(project, 'src/audio/he')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    await cp(join(project, 'src'), join(root, 'src'), {
      recursive: true,
      filter: source => source !== audio,
    })
    await mkdir(join(root, 'src/audio/he'), { recursive: true })
    await mkdir(join(root, 'src/subjects/studiotest'))
    await writeFile(join(root, 'src/subjects/studiotest/phrases.ts'),
      "import { phrases } from '../../app/phrases'\nexport const phrasesForTest = { 'zz.fixture': phrases['app.sprint.again'] }\nexport { phrasesForTest as phrases }\n")
    await cp(join(project, 'index.html'), join(root, 'index.html'))
    await symlink(join(project, 'node_modules'), join(root, 'node_modules'), 'dir')
    server = await createServer({
      root,
      configFile: false,
      plugins: [react(), studioPlugin()],
      server: { host: '127.0.0.1', port: 0, fs: { allow: [root, join(project, 'node_modules')] } },
      logLevel: 'error',
    })
    await server.listen()
    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') throw new Error('Studio test server did not start')

    await page.addInitScript(() => {
      let take = 0
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: async () => ({ getTracks: () => [{ stop() {} }] }),
      })
      Object.defineProperty(window, 'MediaRecorder', {
        value: class {
          mimeType = 'audio/wav'
          ondataavailable: ((event: { data: Blob }) => void) | null = null
          onstop: (() => void) | null = null
          start() {}
          stop() {
            const samples = 800
            const data = new ArrayBuffer(44 + samples * 2)
            const view = new DataView(data)
            const text = (offset: number, value: string) => {
              for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
            }
            text(0, 'RIFF')
            view.setUint32(4, 36 + samples * 2, true)
            text(8, 'WAVE')
            text(12, 'fmt ')
            view.setUint32(16, 16, true)
            view.setUint16(20, 1, true)
            view.setUint16(22, 1, true)
            view.setUint32(24, 8000, true)
            view.setUint32(28, 16000, true)
            view.setUint16(32, 2, true)
            view.setUint16(34, 16, true)
            text(36, 'data')
            view.setUint32(40, samples * 2, true)
            take++
            for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, Math.sin(i / 5) * take * 5000, true)
            this.ondataavailable?.({ data: new Blob([data], { type: this.mimeType }) })
            this.onstop?.()
          }
        },
      })
      Object.defineProperty(HTMLMediaElement.prototype, 'play', {
        value: function (this: HTMLMediaElement) {
          ;(window as Window & { studioPlayed?: string }).studioPlayed = this.src
          return Promise.resolve()
        },
      })
      const revoke = URL.revokeObjectURL.bind(URL)
      URL.revokeObjectURL = url => {
        const state = window as Window & { studioRevoked?: string[] }
        state.studioRevoked = [...(state.studioRevoked ?? []), url]
        revoke(url)
      }
    })

    const socket = page.waitForEvent('websocket')
    await page.goto(`http://127.0.0.1:${address.port}/#/studio`)
    const connection = await socket
    const messages: { type: string; paths: string[] }[] = []
    connection.on('framereceived', frame => {
      try {
        const message = JSON.parse(frame.payload.toString()) as { type?: string; updates?: { path: string }[] }
        if (message.type) messages.push({ type: message.type, paths: message.updates?.map(update => update.path) ?? [] })
      } catch {
        // Ignore non-JSON WebSocket frames.
      }
    })
    await page.getByLabel('All', { exact: true }).check()
    const row = page.getByRole('row').filter({ has: page.locator('code', { hasText: /^app\.sprint\.again$/ }) })
    await row.scrollIntoViewIfNeeded()
    await page.evaluate(() => { (window as Window & { studioTest?: string }).studioTest = 'original' })

    const record = async (target = row) => {
      await target.scrollIntoViewIfNeeded()
      await target.getByRole('button', { name: /record/i }).click()
      const before = messages.length
      const saved = page.waitForResponse(response => response.url().includes('/__studio/save') && response.request().method() === 'POST')
      const scroll = await page.evaluate(() => window.scrollY)
      await target.getByRole('button', { name: '⏹ Stop' }).click()
      expect((await saved).ok()).toBe(true)
      await expect.poll(() => messages.slice(before).find(message =>
        message.type === 'full-reload' || message.paths.includes('/src/core/audio/recordings.ts'),
      )).toEqual({ type: 'update', paths: ['/src/core/audio/recordings.ts'] })
      await expect(target.getByText('✅')).toBeVisible()
      await expect(target.getByRole('button', { name: /re-record/i })).toBeEnabled()
      await expect(page.getByLabel('All', { exact: true })).toBeChecked()
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
    }

    const decode = async (url: string) => page.evaluate(async url => {
      const response = await fetch(url)
      const bytes = await response.arrayBuffer()
      const context = new AudioContext()
      const decoded = await context.decodeAudioData(bytes)
      await context.close()
      return decoded.getChannelData(0)[1]
    }, url)
    const audioFromApp = async (id = 'app.sprint.again') => page.evaluate(async id => {
      const path = '/src/core/audio/audio.ts'
      const audioModule = await import(/* @vite-ignore */ path)
      return audioModule.recordings.get(audioModule.recordingId(id)) ?? null
    }, id)
    const playFromStudio = async () => {
      await row.getByRole('button', { name: '▶' }).click()
      const url = await page.evaluate(() => (window as Window & { studioPlayed?: string }).studioPlayed)
      expect(url).toMatch(/^blob:/)
      return decode(url!)
    }

    await record()
    await expect.poll(audioFromApp).not.toBeNull()
    const first = await decode((await audioFromApp())!)
    expect(await playFromStudio()).toBeCloseTo(first)
    const firstBlob = await page.evaluate(() => (window as Window & { studioPlayed?: string }).studioPlayed)
    await record()
    await expect.poll(async () => decode((await audioFromApp())!)).toBeGreaterThan(first * 1.5)
    expect(await playFromStudio()).toBeGreaterThan(first * 1.5)
    expect(await page.evaluate(() => (window as Window & { studioRevoked?: string[] }).studioRevoked)).toContain(firstBlob)

    const next = page.getByRole('row').filter({ has: page.locator('code', { hasText: /^app\.sprint\.best$/ }) })
    await record(next)
    await expect.poll(() => audioFromApp('app.sprint.best')).not.toBeNull()
    expect(await page.evaluate(() => (window as Window & { studioTest?: string }).studioTest)).toBe('original')

    const latestBlob = await page.evaluate(() => (window as Window & { studioPlayed?: string }).studioPlayed)
    await page.getByRole('link', { name: 'Back to app' }).click()
    await expect.poll(() => page.evaluate(() => (window as Window & { studioRevoked?: string[] }).studioRevoked)).toContain(latestBlob)
    await page.goto(`http://127.0.0.1:${address.port}/#/studio`)
    await expect.poll(() => audioFromApp('app.sprint.best')).not.toBeNull()
    expect(await decode((await audioFromApp())!)).toBeGreaterThan(first * 1.5)

    const firstFile = join(root, 'src/audio/he/app.sprint.again.wav')
    const duplicate = await page.request.post(`http://127.0.0.1:${address.port}/__studio/save?id=zz.fixture`, {
      data: await readFile(firstFile),
      headers: { 'Content-Type': 'audio/wav' },
    })
    expect(duplicate.ok()).toBe(true)
    const sharedState = () => page.evaluate(async () => {
      const path = '/src/core/audio/audio.ts'
      const audioModule = await import(/* @vite-ignore */ path)
      return {
        duplicate: audioModule.recordings.has('zz.fixture'),
        owner: audioModule.recordingId('app.sprint.again'),
      }
    })
    await expect.poll(async () => (await sharedState()).duplicate).toBe(true)
    await unlink(firstFile)
    await expect.poll(async () => (await sharedState()).owner).toBe('zz.fixture')
    expect(await decode((await audioFromApp())!)).toBeGreaterThan(first * 1.5)
  } finally {
    await server?.close()
    await rm(root, { recursive: true, force: true })
  }
})
