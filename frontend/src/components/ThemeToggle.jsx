import React from 'react'
import { Button } from './ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Light Mode
        </>
      )}
    </Button>
  )
}

export default ThemeToggle 