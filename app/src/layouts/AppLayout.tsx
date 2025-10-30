import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Settings, Info } from 'lucide-react'
import { ThemeToggle } from '@/components'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: ReactNode
}

const NavLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  )
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Speech Translation App
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <nav className="space-y-2">
            <NavLink to="/" icon={Home} label="Home" />
            <NavLink to="/settings" icon={Settings} label="Settings" />
            <NavLink to="/about" icon={Info} label="About" />
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
