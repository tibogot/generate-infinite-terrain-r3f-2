import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import Camera from './Camera'
import Sky from './Sky'
import Water from './Water'
import Terrains from './Terrains'
import Chunks from './Chunks'
import Player from './Player'
import Grass from './Grass'
import Noises from './Noises'
import { useGameState } from '../contexts/GameStateContext'

export default function Scene() {
  const state = useGameState()
  const { gl, scene } = useThree()

  // Update renderer settings
  useFrame(() => {
    // Render loop is handled by R3F automatically
  })

  return (
    <>
      <Camera />
      <Noises />
      <Sky />
      <Water />
      <Terrains />
      <Chunks />
      <Player />
      <Grass />
    </>
  )
}

