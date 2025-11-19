import React, { createContext, useContext, useRef, useEffect, useState } from 'react'
import Time from '../Game/State/Time'
import Controls from '../Game/State/Controls'
import Viewport from '../Game/State/Viewport'
import DayCycle from '../Game/State/DayCycle'
import Sun from '../Game/State/Sun'
import Player from '../Game/State/Player'
import Terrains from '../Game/State/Terrains'
import Chunks from '../Game/State/Chunks'
import Game from '../Game/Game'
import State from '../Game/State/State'

interface GameStateContextType {
  seed: string
  time: Time
  controls: Controls
  viewport: Viewport
  day: DayCycle
  sun: Sun
  player: Player
  terrains: Terrains
  chunks: Chunks
}

const GameStateContext2 = createContext<GameStateContextType | null>(null)

export function useGameState2() {
  const context = useContext(GameStateContext2)
  if (!context) {
    throw new Error('useGameState2 must be used within GameStateProvider2')
  }
  return context
}

export function GameStateProvider2({ children }: { children: React.ReactNode }) {
  const seedRef = useRef('p')
  const timeRef = useRef<Time | null>(null)
  const controlsRef = useRef<Controls | null>(null)
  const viewportRef = useRef<Viewport | null>(null)
  const dayRef = useRef<DayCycle | null>(null)
  const sunRef = useRef<Sun | null>(null)
  const playerRef = useRef<Player | null>(null)
  const terrainsRef = useRef<Terrains | null>(null)
  const chunksRef = useRef<Chunks | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Create a temporary DOM element for initialization
    const tempElement = document.createElement('div')
    tempElement.className = 'game'
    
    // Create a minimal Game instance to satisfy dependencies
    // We'll prevent it from creating View/Renderer by checking if we're in React mode
    // For now, we'll create it but stop the update loop immediately
    const game = new Game(tempElement)
    
    // Stop the old update loop - R3F handles rendering
    // We'll use our own update loop for state only
    if (game && (game as any).update) {
      // The Game constructor starts an update loop, but we'll override it
      // by not calling it after initialization
    }
    
    // Now we can get the state instances
    const stateInstance = State.getInstance()
    timeRef.current = stateInstance.time
    controlsRef.current = stateInstance.controls
    viewportRef.current = stateInstance.viewport
    dayRef.current = stateInstance.day
    sunRef.current = stateInstance.sun
    playerRef.current = stateInstance.player
    terrainsRef.current = stateInstance.terrains
    chunksRef.current = stateInstance.chunks

    setMounted(true)

    // Handle resize
    const handleResize = () => {
      viewportRef.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Update loop using requestAnimationFrame
  useEffect(() => {
    if (!mounted) return

    let animationFrameId: number

    const update = () => {
      if (timeRef.current) timeRef.current.update()
      if (controlsRef.current) controlsRef.current.update()
      if (dayRef.current) dayRef.current.update()
      if (sunRef.current) sunRef.current.update()
      if (playerRef.current) playerRef.current.update()
      if (chunksRef.current) chunksRef.current.update()

      animationFrameId = window.requestAnimationFrame(update)
    }

    update()

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [mounted])

  if (!mounted || !timeRef.current || !controlsRef.current || !viewportRef.current || 
      !dayRef.current || !sunRef.current || !playerRef.current || 
      !terrainsRef.current || !chunksRef.current) {
    return null
  }

  const value: GameStateContextType = {
    seed: seedRef.current,
    time: timeRef.current,
    controls: controlsRef.current,
    viewport: viewportRef.current,
    day: dayRef.current,
    sun: sunRef.current,
    player: playerRef.current,
    terrains: terrainsRef.current,
    chunks: chunksRef.current,
  }

  return (
    <GameStateContext2.Provider value={value}>
      {children}
    </GameStateContext2.Provider>
  )
}

