# Speech Translation Desktop App

A modern desktop application for real-time speech translation, built with Electron, React, TypeScript, and Vite.

## 🚀 Features

- **Modern Stack**: Built with Electron + Vite + React + TypeScript
- **Theme Support**: Light/dark/system theme with persistent preferences
- **Responsive UI**: Built with TailwindCSS and custom design tokens
- **State Management**: Zustand for efficient global state
- **Secure IPC**: Preload bridge for secure renderer-main communication
- **Type Safety**: Full TypeScript support with strict mode
- **Developer Experience**: Hot reload, fast builds with Vite

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (comes with Node.js)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/Sync1are/Live-Realtime-Translator-Demo-.git
cd Live-Realtime-Translator-Demo-
```

2. Install dependencies:
```bash
npm install
```

## 🎬 Development

Start the development server with hot reload:

```bash
npm run dev
```

This will:
1. Start the Vite dev server on http://localhost:5173
2. Launch the Electron window
3. Enable hot module replacement (HMR)
4. Open DevTools automatically

## 🔨 Building

Build the application for production:

```bash
npm run build
```

This will:
1. Type-check the TypeScript code
2. Bundle the renderer process with Vite
3. Build the main and preload processes
4. Output to `dist/` and `dist-electron/` directories

To build the Electron application:

```bash
npm run electron:build
```

This creates distributable packages for your platform in the `release/` directory.

## 🧪 Linting & Type Checking

Run ESLint:
```bash
npm run lint
```

Run TypeScript type checking:
```bash
npm run type-check
```

## 📁 Project Structure

```
├── app/
│   ├── electron/           # Electron main process
│   │   ├── main.ts        # Main process entry point
│   │   └── preload.ts     # Preload script with IPC bridge
│   └── src/               # React renderer process
│       ├── components/    # Reusable UI components
│       ├── layouts/       # Layout components
│       ├── pages/         # Page components
│       ├── stores/        # Zustand stores
│       ├── services/      # Service layer (stub implementations)
│       ├── lib/           # Utility functions
│       ├── types/         # TypeScript type definitions
│       ├── styles/        # Global styles and Tailwind
│       ├── App.tsx        # Root component with routing
│       └── main.tsx       # Renderer entry point
├── legacy/                # Legacy Python implementation
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Theme System

The application includes a comprehensive theme system:

- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for low-light environments
- **System Mode**: Automatically matches your OS preference

The theme toggle is located in the top-right corner of the app header. Click it to cycle through:
1. Light → Dark → System → Light...

Theme preferences are persisted to `localStorage` and restored on app restart.

## 🔌 IPC Bridge

The app uses a secure IPC bridge between the renderer and main processes:

```typescript
// In renderer process
const result = await window.ipcApi.ping()
const platform = await window.ipcApi.getPlatform()
const version = await window.ipcApi.getAppVersion()
```

The bridge is defined in `app/electron/preload.ts` and exposed via `contextBridge`.

## 📦 Available Components

### UI Primitives
- `Button`: Primary, secondary, outline, and ghost variants
- `Card`: Container with header, title, and content sections
- `ThemeToggle`: Theme switcher with visual feedback

### Layouts
- `AppLayout`: Main application shell with sidebar navigation

### Pages
- `Home`: Dashboard with feature overview
- `Settings`: Configuration interface (stub)
- `About`: Application information and resources

## 🗂️ State Management

The app uses Zustand for state management. Example stores:

### Theme Store
```typescript
import { useThemeStore } from '@/stores'

const { theme, setTheme } = useThemeStore()
```

## 🔧 Services

Stub services are provided for future implementation:

- **DataService**: CRUD operations for data access
- **NotificationService**: Toast/notification system

These are placeholders that throw errors when called, ready for implementation in future tickets.

## 🚦 Routing

The app uses React Router v6 for navigation:

- `/` - Home page
- `/settings` - Settings page
- `/about` - About page

Navigation is handled through the sidebar in `AppLayout`.

## 🎯 Next Steps

This bootstrap provides the foundation for:

1. **Python Integration**: Connect to the legacy Python translation pipeline
2. **Speech Input**: Implement microphone capture and VAD
3. **Translation Engine**: Integrate Faster-Whisper and MarianMT
4. **TTS Output**: Add text-to-speech playback
5. **Session Management**: Implement recording and history features
6. **Performance Monitoring**: Add analytics and metrics

## 📚 Technology Stack

### Frontend
- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Lucide React**: Icon library

### Development Tools
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is already in use:
```bash
# Kill the process using port 5173
# On Unix/macOS:
lsof -ti:5173 | xargs kill -9
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Electron Window Not Opening
1. Check that Vite dev server started successfully
2. Look for errors in the terminal
3. Try clearing node_modules and reinstalling:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Theme Not Persisting
- Check browser console for localStorage errors
- Ensure the app has write permissions
- Clear localStorage and try again:
```javascript
localStorage.clear()
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related

- **Legacy Python Demo**: See `legacy/` folder for the original CLI implementation
- **Documentation**: Additional docs in `legacy/*.md`

## 🤝 Contributing

This is a demonstration project. For production use:
1. Implement proper error handling
2. Add comprehensive tests
3. Configure electron-builder for all platforms
4. Add auto-updater functionality
5. Implement proper logging

---

Built with ❤️ using modern web technologies
