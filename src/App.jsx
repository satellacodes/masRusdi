import React, { useState } from 'react'
import TemplateEditor from './components/TemplateEditor'
import OverlayRenderer from './components/OverlayRenderer'

export default function App() {
  const [mode, setMode] = useState('editor')
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">📄</div>
          <div>
            <h1>Visio SVG Template</h1>
            <p className="muted">Upload SVG → Position fields → Fill & Export</p>
          </div>
        </div>

        <nav className="nav">
          <button className={mode==='editor'? 'tab active':'tab'} onClick={() => setMode('editor')}>Template Editor</button>
          <button className={mode==='fill'? 'tab active':'tab'} onClick={() => setMode('fill')}>Fill & Export</button>
        </nav>
      </header>

      <main className="main">
        {mode === 'editor' ? <TemplateEditor /> : <OverlayRenderer />}
      </main>

      <footer className="footer">
        <small>Tip: Drag placeholders, or click to set precise X/Y. Layouts saved to localStorage.</small>
      </footer>
    </div>
  )
}
