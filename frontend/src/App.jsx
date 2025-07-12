import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import LandingPage from './components/LandingPage'
import Assistant from './components/Assistant'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App 