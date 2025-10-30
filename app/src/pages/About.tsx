import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components'
import { Github, ExternalLink } from 'lucide-react'

export const About = () => {
  const [platform, setPlatform] = useState<string>('unknown')
  const [version, setVersion] = useState<string>('unknown')

  useEffect(() => {
    if (window.ipcApi) {
      window.ipcApi.getPlatform().then(setPlatform).catch(console.error)
      window.ipcApi.getAppVersion().then(setVersion).catch(console.error)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          About
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time speech translation desktop application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-700 dark:text-gray-300">Version</span>
              <span className="text-gray-600 dark:text-gray-400">{version}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-700 dark:text-gray-300">Platform</span>
              <span className="text-gray-600 dark:text-gray-400">{platform}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">License</span>
              <span className="text-gray-600 dark:text-gray-400">MIT</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Real-time voice activity detection with WebRTC VAD</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Faster-Whisper streaming transcription with GPU support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Helsinki-NLP MarianMT neural translation models</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Thread-safe text-to-speech with acoustic echo cancellation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Multi-threaded pipeline architecture for sub-second latency</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
              <span>Session recording with performance metrics and history export</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Frontend</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                <li>• Electron</li>
                <li>• React</li>
                <li>• TypeScript</li>
                <li>• Vite</li>
                <li>• TailwindCSS</li>
                <li>• Zustand</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Backend</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                <li>• Python</li>
                <li>• Faster-Whisper</li>
                <li>• MarianMT</li>
                <li>• PyTorch</li>
                <li>• PyAudio</li>
                <li>• WebRTC VAD</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a
              href="https://github.com/Sync1are/Live-Realtime-Translator-Demo-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Github size={20} />
              <span>View on GitHub</span>
              <ExternalLink size={16} />
            </a>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check out the legacy Python demo in the <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">legacy/</code> folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
