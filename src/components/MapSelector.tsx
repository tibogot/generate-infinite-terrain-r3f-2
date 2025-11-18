import { useEffect } from 'react'
import { useControls } from 'leva'
import { useMap } from '../contexts/MapContext'

export default function MapSelector() {
  const { maps, activeMapId, switchMap } = useMap()

  // Create options object for Leva select
  const mapOptions: Record<string, string> = {}
  maps.forEach((config) => {
    mapOptions[config.name] = config.id
  })

  const { selectedMap } = useControls('🗺️ Map Selection', {
    selectedMap: {
      value: activeMapId,
      options: mapOptions,
      label: 'Current Map',
    },
  })

  // Switch map when selection changes
  useEffect(() => {
    if (selectedMap && selectedMap !== activeMapId) {
      switchMap(selectedMap)
    }
  }, [selectedMap, activeMapId, switchMap])

  return null // This component only adds Leva controls
}

