# Contributing to Speech Translation App

## Development Setup

1. **Prerequisites**
   - Node.js 18.x or higher
   - npm 9.x or higher

2. **Installation**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   npm run dev
   ```
   This starts the Vite dev server and launches Electron in development mode.

## Project Structure

```
app/
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script with IPC bridge
└── src/              # React renderer process
    ├── components/   # Reusable UI components
    ├── layouts/      # Layout components
    ├── pages/        # Page components
    ├── stores/       # Zustand state management
    ├── services/     # Service layer
    ├── lib/          # Utility functions
    ├── types/        # TypeScript types
    └── styles/       # Global styles
```

## Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Run `npm run lint` before committing
- **Formatting**: Use consistent formatting
- **Imports**: Use path aliases (`@/`) for cleaner imports

## Building

```bash
npm run build        # Build for production
npm run type-check   # Type check without emitting
npm run lint         # Lint the codebase
```

## IPC Communication

When adding new IPC handlers:

1. Add handler in `app/electron/main.ts`:
   ```typescript
   ipcMain.handle('my-handler', async (event, arg) => {
     return result
   })
   ```

2. Add to preload API in `app/electron/preload.ts`:
   ```typescript
   export type IpcApi = {
     myHandler: (arg: string) => Promise<Result>
   }
   ```

3. Use in renderer:
   ```typescript
   const result = await window.ipcApi.myHandler(arg)
   ```

## State Management

Use Zustand for global state:

```typescript
// stores/myStore.ts
export const useMyStore = create<MyState>((set) => ({
  value: 0,
  setValue: (value) => set({ value })
}))

// In component
const { value, setValue } = useMyStore()
```

## Adding New Pages

1. Create page component in `app/src/pages/`
2. Export from `app/src/pages/index.ts`
3. Add route in `app/src/App.tsx`
4. Add navigation link in `app/src/layouts/AppLayout.tsx`

## Troubleshooting

### Build Errors
- Clear `dist/` and `dist-electron/` directories
- Delete `node_modules/` and reinstall

### Type Errors
- Run `npm run type-check` to see all errors
- Check import paths use `@/` alias correctly

### Theme Issues
- Check localStorage in DevTools
- Verify `initTheme()` is called in App.tsx
- Check Tailwind dark mode classes
