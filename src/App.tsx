import './App.css'
import { CalendarApp } from './calendar/CalendarApp'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-title">CalendarX</div>
            <div className="brand-subtitle">구글 캘린더 스타일 MVP</div>
          </div>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <a
            className="link"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            프로젝트로 확장하기
          </a>
        </div>
      </header>

      <main className="app-main">
        {/* 구현은 src/calendar 아래에 추가합니다. */}
        <CalendarApp />
      </main>
    </div>
  )
}

export default App
