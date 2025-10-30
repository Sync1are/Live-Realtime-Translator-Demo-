import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores'
import { cn } from '@/lib/utils'

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />
    }
    return theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />
  }

  const getLabel = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme})`
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gray-100 dark:bg-gray-800',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'transition-colors duration-200',
        'text-gray-700 dark:text-gray-300'
      )}
      title={`Current theme: ${getLabel()}. Click to cycle.`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  )
}
