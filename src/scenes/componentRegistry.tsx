import React from "react";
import Sky from "../components/Sky";
import Terrains from "../components/Terrains";
import Water from "../components/Water";
import Chunks from "../components/Chunks";
import Player from "../components/Player";
import Grass from "../components/Grass";
import Noises from "../components/Noises";
import Camera from "../components/Camera";
import SimpleSky from "./components/SimpleSky";

// Component registry type
export type ComponentName =
  | "Sky"
  | "SimpleSky"
  | "Terrains"
  | "Water"
  | "Chunks"
  | "Player"
  | "Grass"
  | "Noises"
  | "Camera"
  | null;

// Component registry mapping
export const componentRegistry: Record<string, React.ComponentType<any>> = {
  // Default components
  Sky: Sky,
  Terrains: Terrains,
  Water: Water,
  Chunks: Chunks,
  Player: Player,
  Grass: Grass,
  Noises: Noises,
  Camera: Camera,

  // Scene-specific components
  SimpleSky: SimpleSky,
  // Add more scene-specific components here as you create them
};

/**
 * Get a component from the registry by name
 */
export function getComponent(
  name: ComponentName
): React.ComponentType<any> | null {
  if (!name) return null;
  return componentRegistry[name] || null;
}

/**
 * Render a component dynamically from the registry
 * Returns a React element that can be used in JSX
 */
export function renderComponent(
  name: ComponentName,
  props?: Record<string, any>
): React.ReactElement | null {
  const Component = getComponent(name);
  if (!Component) return null;
  return React.createElement(Component, props || {});
}
