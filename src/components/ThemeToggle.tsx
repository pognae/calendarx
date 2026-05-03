import { useState, useEffect } from 'react'

function readStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem('calendarx-theme') === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readStoredTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    } else {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    }
    localStorage.setItem('calendarx-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={`${theme === 'light' ? '다크 모드로' : '라이트 모드로'} 전환`}
    >
      <span className={`theme-icon ${theme === 'light' ? 'sun-icon' : 'moon-icon'}`} />
      <span className="theme-text">{theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}</span>
    </button>
  )
}