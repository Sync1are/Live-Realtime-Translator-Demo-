# Quick Start Guide

## Installation

```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

This will:
1. Start Vite dev server (http://localhost:5173)
2. Build Electron main/preload processes
3. Launch Electron window with hot reload

Note: In some environments, Electron may fail to launch due to missing system libraries. The Vite dev server will still work, and you can test the UI in a regular browser.

## Production Build

Build the application:
```bash
npm run build
```

This creates:
- `dist/` - Bundled React application
- `dist-electron/` - Compiled Electron main/preload

## Code Quality

Run linting:
```bash
npm run lint
```

Run type checking:
```bash
npm run type-check
```

## Project Structure

```
app/
├── electron/       # Electron main process
│   ├── main.ts    # Main process entry
│   └── preload.ts # IPC bridge
└── src/           # React renderer
    ├── components/
    ├── layouts/
    ├── pages/
    ├── stores/
    ├── services/
    └── styles/
```

## Key Features

✅ Electron + Vite + React + TypeScript
✅ TailwindCSS with dark mode
✅ Theme toggle (Light/Dark/System)
✅ React Router navigation
✅ Zustand state management
✅ Secure IPC bridge
✅ Hot reload in development

## Theme System

The app includes a comprehensive theme system:
- **Light Mode**: Default bright theme
- **Dark Mode**: Dark theme for low-light environments
- **System Mode**: Follows OS preference

Theme preference is saved to localStorage and restored on app restart.

## Next Steps

1. Start development: `npm run dev`
2. Explore the codebase in `app/`
3. Check `CONTRIBUTING.md` for development guidelines
4. See legacy Python demo in `legacy/`

## Troubleshooting

**Build errors?**
- Delete `dist/`, `dist-electron/`, and `node_modules/`
- Run `npm install` again

**Type errors?**
- Run `npm run type-check` to see all errors
- Check import paths use `@/` alias

**Electron not launching?**
- This is expected in some CI/headless environments
- The Vite dev server will still work
- Test UI in a regular browser at http://localhost:5173
