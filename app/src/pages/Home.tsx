import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components'
import { Mic, Languages, Volume2 } from 'lucide-react'

export const Home = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to Speech Translation
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time speech translation powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Mic className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <CardTitle>Speech Input</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Capture and transcribe speech in real-time using advanced voice activity detection.
            </p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                <Languages className="text-secondary-600 dark:text-secondary-400" size={24} />
              </div>
              <CardTitle>Translation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Translate between multiple languages with neural machine translation models.
            </p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Volume2 className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <CardTitle>Speech Output</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Text-to-speech synthesis with acoustic echo cancellation for natural feedback.
            </p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Configure Languages
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Go to Settings to select your source and target languages.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Test Microphone
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Ensure your microphone is properly connected and configured.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Start Translating
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Click the start button and begin speaking to see real-time translations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
