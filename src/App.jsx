import { useState } from 'react'
import './App.css'
import InicioSesion from './paginas/inicioSesion';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='App'>
      <InicioSesion />
    </div>
  )
}

export default App
