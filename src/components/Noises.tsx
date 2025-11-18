import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import NoisesMaterial from '../Game/View/Materials/NoisesMaterial'
import { useNoise } from '../contexts/NoiseContext'

export default function Noises() {
  const { gl } = useThree()
  const { noiseTexture } = useNoise()
  const customSceneRef = useRef<THREE.Scene | null>(null)
  const customCameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const planeRef = useRef<THREE.Mesh | null>(null)
  const materialRef = useRef<NoisesMaterial | null>(null)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null)

  // Initialize custom render scene and create noise texture
  useEffect(() => {
    customSceneRef.current = new THREE.Scene()
    customCameraRef.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    
    materialRef.current = new NoisesMaterial()
    
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      materialRef.current
    )
    plane.frustumCulled = false
    customSceneRef.current.add(plane)
    planeRef.current = plane

    // Create noise texture (128x128 as in original)
    const width = 128
    const height = 128
    renderTargetRef.current = new THREE.WebGLRenderTarget(width, height, {
      generateMipmaps: false,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping
    })

    // Render to texture
    gl.setRenderTarget(renderTargetRef.current)
    gl.render(customSceneRef.current, customCameraRef.current)
    gl.setRenderTarget(null)

    const texture = renderTargetRef.current.texture
    noiseTexture.current = texture

    return () => {
      if (customSceneRef.current) {
        customSceneRef.current.clear()
      }
      materialRef.current?.dispose()
      renderTargetRef.current?.dispose()
      noiseTexture.current = null
    }
  }, [gl, noiseTexture])

  // This component doesn't render anything visible - it's used for generating noise textures
  return null
}

