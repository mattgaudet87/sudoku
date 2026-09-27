import { useState } from 'react'
import Home from './screens/Home'
import Game from './screens/Game'

type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'game') {
    return <Game onHome={() => setScreen('home')} />
  }

  return <Home onPlay={() => setScreen('game')} />
}
