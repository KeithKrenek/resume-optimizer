import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="container mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-4">AI Assistant Chat</h1>
      <div className="border rounded-lg shadow-lg h-[calc(100vh-8rem)]">
        <App />
      </div>
    </div>
  </React.StrictMode>,
)
