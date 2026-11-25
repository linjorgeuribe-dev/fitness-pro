import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>)

// Cuando llega una versión nueva de la app, se aplica sola al momento (salvo a mitad de un entrenamiento,
// donde se aplica al salir de esa pantalla), en vez de esperar a que el usuario cierre y vuelva a abrir.
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (location.pathname === '/workout') sessionStorage.setItem('update-pending', '1'); else location.reload()
  })
}
