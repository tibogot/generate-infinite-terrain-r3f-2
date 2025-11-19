import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";

// Constants
const GRASS_SEGMENTS_LOW = 1;
const GRASS_SEGMENTS_HIGH = 6;
const GRASS_VERTICES_LOW = (GRASS_SEGMENTS_LOW + 1) * 2; // 4
const GRASS_VERTICES_HIGH = (GRASS_SEGMENTS_HIGH + 1) * 2; // 14
const GRASS_LOD_DIST = 15;
const GRASS_MAX_DIST = 100;
const GRASS_WIDTH = 0.1;
const GRASS_HEIGHT = 1.5;

// Shader utility functions (same as ClaudeGrassQuick5)
const SHADER_COMMON = `
// Utility functions
float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

vec2 saturate2(vec2 x) {
  return clamp(x, vec2(0.0), vec2(1.0));
}

vec3 saturate3(vec3 x) {
  return clamp(x, vec3(0.0), vec3(1.0));
}

float linearstep(float minValue, float maxValue, float v) {
  return clamp((v - minValue) / (maxValue - minValue), 0.0, 1.0);
}

float inverseLerp(float minValue, float maxValue, float v) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(inMin, inMax, v);
  return mix(outMin, outMax, t);
}

float easeOut(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

float easeIn(float x, float t) {
  return pow(x, t);
}

mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}

mat3 rotateAxis(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
    oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
  );
}

// Hash functions - GLSL 1.0 compatible (no uint types)
vec4 hash42(vec2 p) {
  vec4 p4 = fract(vec4(p.xyxy) * vec4(443.897, 441.423, 437.195, 429.123));
  p4 += dot(p4, p4.wzxy + 19.19);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash12(vec2 p) {
  return hash(p);
}

float noise12(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// OkLab color space
vec3 rgbToOklab(vec3 c) {
  mat3 kCONEtoLMS = mat3(
    0.4121656120, 0.5362752080, 0.0514575653,
    0.2118591070, 0.6807189584, 0.1074065790,
    0.0883097947, 0.2818474174, 0.6302613616
  );

  vec3 lms = kCONEtoLMS * c;
  return sign(lms) * pow(abs(lms), vec3(0.3333333333333));
}

vec3 oklabToRGB(vec3 c) {
  mat3 kLMStoCONE = mat3(
    4.0767245293, -3.3072168827, 0.2307590544,
    -1.2681437731, 2.6093323231, -0.3411344290,
    -0.0041119885, -0.7034763098, 1.7068625689
  );

  vec3 lms = c;
  return kLMStoCONE * (lms * lms * lms);
}

vec3 col3_rgb(float r, float g, float b) {
  return rgbToOklab(vec3(r, g, b));
}

vec3 col3_vec(vec3 v) {
  return rgbToOklab(v);
}

// Sky/Fog functions
vec3 CalculateSkyLighting(vec3 viewDir, vec3 normalDir) {
  vec3 SKY_lighterBlue = vec3(0.39, 0.57, 0.86) * 0.25;
  vec3 SKY_midBlue = vec3(0.1, 0.11, 0.1) * 0.5;
  vec3 SKY_darkerBlue = vec3(0.0);
  vec3 SKY_SUN_COLOUR = vec3(0.5);
  vec3 SKY_SUN_GLOW_COLOUR = vec3(0.15, 0.2, 0.25);
  vec3 SUN_DIR = vec3(-1.0, 0.45, 1.0);

  vec3 lighterBlue = col3_vec(SKY_lighterBlue);
  vec3 midBlue = col3_vec(SKY_midBlue);
  vec3 darkerBlue = col3_vec(SKY_darkerBlue);
  vec3 SUN_COLOUR = col3_vec(SKY_SUN_COLOUR);
  vec3 SUN_GLOW_COLOUR = col3_vec(SKY_SUN_GLOW_COLOUR);

  float viewDirY = linearstep(-0.01, 1.0, viewDir.y);
  vec3 skyGradient = mix(darkerBlue, lighterBlue, exp(-sqrt(saturate(viewDirY)) * 2.0));

  vec3 sunDir = normalize(SUN_DIR);
  float mu = 1.0 - saturate(dot(viewDir, sunDir));

  vec3 colour = skyGradient + SUN_GLOW_COLOUR * saturate(exp(-sqrt(mu) * 10.0)) * 0.75;
  colour += SUN_COLOUR * smoothstep(0.9997, 0.9998, 1.0 - mu);
  colour = oklabToRGB(colour);

  return colour;
}

vec3 CalculateSkyFog(vec3 normalDir) {
  return CalculateSkyLighting(normalDir, normalDir);
}
`;

// Vertex Shader - Modified to use modulo wrapping
const vertexShader = `
#define PHONG
varying vec3 vViewPosition;

${SHADER_COMMON}

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

varying vec3 vWorldNormal;
varying vec3 vGrassColour;
varying vec4 vGrassParams;
varying vec3 vNormal2;
varying vec3 vWorldPosition;

uniform vec2 grassSize;
uniform vec4 grassParams;
uniform vec4 grassDraw;
uniform float time;
uniform sampler2D heightmap;
uniform vec4 heightParams;
uniform vec3 playerPos;
uniform float grassDistance; // Distance to wrap around (like uGrassDistance in Grass.tsx)
uniform mat4 viewMatrixInverse;
uniform vec4 windParams;
uniform float windStrength;
uniform vec2 playerInteractionParams;
uniform float playerInteractionRepel;
uniform float playerInteractionHeightThreshold;
uniform vec3 uBaseColor1;
uniform vec3 uBaseColor2;
uniform vec3 uTipColor1;
uniform vec3 uTipColor2;
uniform float uGradientCurve;
uniform bool uAoEnabled;
uniform float uAoIntensity;

attribute vec2 center; // Center position of grass blade (like Grass.tsx)
attribute float vertIndex;

void main() {
  #include <uv_vertex>
  #include <color_vertex>
  #include <morphcolor_vertex>
  #include <beginnormal_vertex>
  #include <begin_vertex>
  
  // Apply modulo wrapping to center position (like Grass.tsx)
  vec2 newCenter = center;
  newCenter -= playerPos.xz;
  float halfSize = grassDistance * 0.5;
  newCenter.x = mod(newCenter.x + halfSize, grassDistance) - halfSize;
  newCenter.y = mod(newCenter.y + halfSize, grassDistance) - halfSize;
  
  // Now use wrapped center as the grass offset
  vec3 grassOffset = vec3(newCenter.x, 0.0, newCenter.y);
  
  // Blade world position (after wrapping)
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  
  // Heightmap sampling
  vec2 heightmapUV = vec2(
      remap(grassBladeWorldPos.x, -heightParams.x * 0.5, heightParams.x * 0.5, 0.0, 1.0),
      remap(grassBladeWorldPos.z, -heightParams.x * 0.5, heightParams.x * 0.5, 1.0, 0.0));
  vec4 heightmapSample = texture2D(heightmap, heightmapUV);
  grassBladeWorldPos.y += heightmapSample.x * grassParams.z - grassParams.w;

  float heightmapSampleHeight = 1.0;

  // Use wrapped position for hash (this ensures consistent grass appearance)
  vec4 hashVal1 = hash42(vec2(grassBladeWorldPos.x, grassBladeWorldPos.z));

  float highLODOut = smoothstep(grassDraw.x * 0.5, grassDraw.x, distance(cameraPosition, grassBladeWorldPos));
  float lodFadeIn = smoothstep(grassDraw.x, grassDraw.y, distance(cameraPosition, grassBladeWorldPos));

  // Check terrain type
  float isSandy = linearstep(-11.0, -14.0, grassBladeWorldPos.y);
  float grassAllowedHash = hashVal1.w - isSandy;
  float isGrassAllowed = step(0.0, grassAllowedHash);

  float randomAngle = hashVal1.x * 2.0 * PI;
  float randomShade = remap(hashVal1.y, -1.0, 1.0, 0.5, 1.0);
  float randomHeight = remap(hashVal1.z, 0.0, 1.0, 0.75, 1.5) * mix(1.0, 0.0, lodFadeIn) * isGrassAllowed * heightmapSampleHeight;
  float randomWidth = (1.0 - isSandy) * heightmapSampleHeight;
  float randomLean = remap(hashVal1.w, 0.0, 1.0, 0.1, 0.4);

  vec2 hashGrassColour = hash22(vec2(grassBladeWorldPos.x, grassBladeWorldPos.z));
  float leanAnimation = noise12(vec2(time * 0.35) + grassBladeWorldPos.xz * 137.423) * 0.1;

  float GRASS_SEGMENTS = grassParams.x;
  float GRASS_VERTICES = grassParams.y;

  // Figure out vertex id
  float vertID = mod(float(vertIndex), GRASS_VERTICES);

  // 1 = front, -1 = back
  float zSide = -(floor(vertIndex / GRASS_VERTICES) * 2.0 - 1.0);

  // 0 = left, 1 = right
  float xSide = mod(vertID, 2.0);

  float heightPercent = (vertID - xSide) / (GRASS_SEGMENTS * 2.0);

  float grassTotalHeight = grassSize.y * randomHeight;
  float grassTotalWidthHigh = easeOut(1.0 - heightPercent, 2.0);
  float grassTotalWidthLow = 1.0 - heightPercent;
  float grassTotalWidth = grassSize.x * mix(grassTotalWidthHigh, grassTotalWidthLow, highLODOut) * randomWidth;

  // Shift verts
  float x = (xSide - 0.5) * grassTotalWidth;
  float y = heightPercent * grassTotalHeight;

  // Wind
  float windDir = noise12(grassBladeWorldPos.xz * windParams.x + windParams.y * time);
  float windNoiseSample = noise12(grassBladeWorldPos.xz * windParams.z + time * windParams.w);
  float windLeanAngle = remap(windNoiseSample, -1.0, 1.0, 0.25, 1.0);
  windLeanAngle = easeIn(windLeanAngle, 2.0) * windStrength;
  vec3 windAxis = vec3(cos(windDir), 0.0, sin(windDir));
  windLeanAngle *= heightPercent;

  // Player interaction
  float distToPlayer = distance(grassBladeWorldPos.xz, playerPos.xz);
  float heightDiff = abs(grassBladeWorldPos.y - playerPos.y);
  float heightFalloff = smoothstep(playerInteractionHeightThreshold, 0.0, heightDiff);
  float distanceFalloff = smoothstep(playerInteractionParams.x, 1.0, distToPlayer);
  float playerFalloff = distanceFalloff * heightFalloff;
  float playerLeanAngle = mix(0.0, playerInteractionParams.y, playerFalloff * linearstep(0.5, 0.0, windLeanAngle));
  playerLeanAngle *= playerInteractionRepel;
  vec3 grassToPlayer = normalize(vec3(playerPos.x, 0.0, playerPos.z) - vec3(grassBladeWorldPos.x, 0.0, grassBladeWorldPos.z));
  vec3 playerLeanAxis = vec3(grassToPlayer.z, 0.0, -grassToPlayer.x);

  randomLean += leanAnimation;

  float easedHeight = mix(easeIn(heightPercent, 2.0), 1.0, highLODOut);
  float curveAmount = -randomLean * easedHeight;

  // Normal calculation
  float ncurve1 = -randomLean * easedHeight;
  vec3 n1 = vec3(0.0, (heightPercent + 0.01), 0.0);
  n1 = rotateX(ncurve1) * n1;

  float ncurve2 = -randomLean * easedHeight * 0.9;
  vec3 n2 = vec3(0.0, (heightPercent + 0.01) * 0.9, 0.0);
  n2 = rotateX(ncurve2) * n2;

  vec3 ncurve = normalize(n1 - n2);

  mat3 grassMat = rotateAxis(playerLeanAxis, playerLeanAngle) * rotateAxis(windAxis, windLeanAngle) * rotateY(randomAngle);

  vec3 grassFaceNormal = vec3(0.0, 0.0, 1.0);
  grassFaceNormal = grassMat * grassFaceNormal;
  grassFaceNormal *= zSide;

  vec3 grassVertexNormal = vec3(0.0, -ncurve.z, ncurve.y);
  vec3 grassVertexNormal1 = rotateY(PI * 0.3 * zSide) * grassVertexNormal;
  vec3 grassVertexNormal2 = rotateY(PI * -0.3 * zSide) * grassVertexNormal;

  grassVertexNormal1 = grassMat * grassVertexNormal1;
  grassVertexNormal1 *= zSide;

  grassVertexNormal2 = grassMat * grassVertexNormal2;
  grassVertexNormal2 *= zSide;

  vec3 grassVertexPosition = vec3(x, y, 0.0);
  grassVertexPosition = rotateX(curveAmount) * grassVertexPosition;
  grassVertexPosition = grassMat * grassVertexPosition;
  grassVertexPosition += grassOffset;

  // Color gradient
  vec3 b1 = uBaseColor1;
  vec3 b2 = uBaseColor2;
  vec3 t1 = uTipColor1;
  vec3 t2 = uTipColor2;

  vec3 baseColour = mix(b1, b2, hashGrassColour.x);
  vec3 tipColour = mix(t1, t2, hashGrassColour.y);
  vec3 highLODColour = mix(baseColour, tipColour, easeIn(heightPercent, uGradientCurve)) * randomShade;
  vec3 lowLODColour = mix(b1, t1, heightPercent);
  vGrassColour = mix(highLODColour, lowLODColour, highLODOut);
  vGrassParams = vec4(heightPercent, grassBladeWorldPos.y, highLODOut, xSide);

  float SKY_RATIO = 0.25;
  vec3 UP = vec3(0.0, 1.0, 0.0);
  float skyFadeIn = (1.0 - highLODOut) * SKY_RATIO;
  vec3 normal1 = normalize(mix(UP, grassVertexNormal1, skyFadeIn));
  vec3 normal2 = normalize(mix(UP, grassVertexNormal2, skyFadeIn));

  transformed = grassVertexPosition;
  transformed.y += grassBladeWorldPos.y;

  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 viewDirXZ = normalize(vec3(viewDir.x, 0.0, viewDir.z));
  vec3 grassFaceNormalXZ = normalize(vec3(grassFaceNormal.x, 0.0, grassFaceNormal.z));

  float viewDotNormal = saturate(dot(grassFaceNormal, viewDirXZ));
  float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);

  objectNormal = grassVertexNormal1;

  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>

  vNormal = normalize(normalMatrix * normal1);
  vNormal2 = normalize(normalMatrix * normal2);

  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <displacementmap_vertex>

  vec4 mvPosition = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
  #endif
  mvPosition = modelViewMatrix * mvPosition;

  // Billboard thickening in view space
  mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * grassTotalWidth * 0.5 * zSide;

  gl_Position = projectionMatrix * mvPosition;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  vViewPosition = -mvPosition.xyz;
  #include <worldpos_vertex>
  #include <envmap_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>

  vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
}
`;

// Fragment Shader (same as ClaudeGrassQuick5)
const fragmentShader = `
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>

varying vec3 vGrassColour;
varying vec4 vGrassParams;
varying vec3 vNormal2;
varying vec3 vWorldPosition;

#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform sampler2D grassTexture;
uniform vec3 grassLODColour;
uniform float time;
uniform mat3 normalMatrix;
uniform bool uAoEnabled;
uniform float uAoIntensity;
uniform bool uFogEnabled;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogIntensity;
uniform vec3 uFogColor;
uniform bool uSpecularEnabled;
uniform float uSpecularIntensity;
uniform vec3 uSpecularColor;
uniform vec3 uSpecularDirection;
uniform float uGrassMiddleBrightnessMin;
uniform float uGrassMiddleBrightnessMax;
uniform bool uBackscatterEnabled;
uniform float uBackscatterIntensity;
uniform vec3 uBackscatterColor;
uniform float uBackscatterPower;
uniform float uFrontScatterStrength;
uniform float uRimSSSStrength;

// Utility functions
// Note: saturate might be defined by Three.js, so we check and undefine if needed
#ifdef saturate
#undef saturate
#endif
float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

float linearstep(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float easeIn(float t, float p) {
  return pow(t, p);
}

vec3 rgbToOklab(vec3 c) {
  mat3 kCONEtoLMS = mat3(
    0.4121656120, 0.5362752080, 0.0514575653,
    0.2118591070, 0.6807189584, 0.1074065790,
    0.0883097947, 0.2818474174, 0.6302613616
  );
  vec3 lms = kCONEtoLMS * c;
  return sign(lms) * pow(abs(lms), vec3(0.3333333333333));
}

vec3 oklabToRGB(vec3 c) {
  mat3 kLMStoCONE = mat3(
    4.0767245293, -3.3072168827, 0.2307590544,
    -1.2681437731, 2.6093323231, -0.3411344290,
    -0.0041119885, -0.7034763098, 1.7068625689
  );
  vec3 lms = c;
  return kLMStoCONE * (lms * lms * lms);
}

vec3 col3_vec(vec3 v) {
  return rgbToOklab(v);
}

vec3 CalculateSkyLighting(vec3 viewDir, vec3 normalDir) {
  vec3 SKY_lighterBlue = vec3(0.39, 0.57, 0.86) * 0.25;
  vec3 SKY_midBlue = vec3(0.1, 0.11, 0.1) * 0.5;
  vec3 SKY_darkerBlue = vec3(0.0);
  vec3 SKY_SUN_COLOUR = vec3(0.5);
  vec3 SKY_SUN_GLOW_COLOUR = vec3(0.15, 0.2, 0.25);
  vec3 SUN_DIR = vec3(-1.0, 0.45, 1.0);

  vec3 lighterBlue = col3_vec(SKY_lighterBlue);
  vec3 midBlue = col3_vec(SKY_midBlue);
  vec3 darkerBlue = col3_vec(SKY_darkerBlue);
  vec3 SUN_COLOUR = col3_vec(SKY_SUN_COLOUR);
  vec3 SUN_GLOW_COLOUR = col3_vec(SKY_SUN_GLOW_COLOUR);

  float viewDirY = linearstep(-0.01, 1.0, viewDir.y);
  vec3 skyGradient = mix(darkerBlue, lighterBlue, exp(-sqrt(saturate(viewDirY)) * 2.0));

  vec3 sunDir = normalize(SUN_DIR);
  float mu = 1.0 - saturate(dot(viewDir, sunDir));

  vec3 colour = skyGradient + SUN_GLOW_COLOUR * saturate(exp(-sqrt(mu) * 10.0)) * 0.75;
  colour += SUN_COLOUR * smoothstep(0.9997, 0.9998, 1.0 - mu);
  colour = oklabToRGB(colour);

  return colour;
}

vec3 CalculateSkyFog(vec3 normalDir) {
  return CalculateSkyLighting(normalDir, normalDir);
}

vec3 CalculateFog(vec3 baseColour, vec3 viewDir, float sceneDepth) {
  if (!uFogEnabled) {
    return baseColour;
  }
  
  float fogDepth = sceneDepth;
  float fogFactor = clamp((fogDepth - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
  fogFactor *= uFogIntensity;
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColour = mix(baseColour, uFogColor, fogFactor);
  return finalColour;
}

void main() {
  vec3 viewDir;
  vec4 diffuseColor;
  float heightPercent;
  float height;
  float lodFadeIn;
  float lodFadeOut;
  float grassMiddle;
  float isSandy;
  float density;
  float aoForDensity;
  float ao;
  ReflectedLight reflectedLight;
  vec3 totalEmissiveRadiance;
  vec3 normal2;
  vec3 outgoingLight;
  float sceneDepth;
  
  viewDir = normalize(cameraPosition - vWorldPosition);

  #include <clipping_planes_fragment>
  
  diffuseColor = vec4(diffuse, opacity);

  heightPercent = vGrassParams.x;
  height = vGrassParams.y;
  lodFadeIn = vGrassParams.z;
  lodFadeOut = 1.0 - lodFadeIn;

  grassMiddle = mix(smoothstep(abs(vGrassParams.w - 0.5), 0.0, 0.1), 1.0, lodFadeIn);

  isSandy = saturate(linearstep(-11.0, -14.0, height));

  density = 1.0 - isSandy;

  if (uAoEnabled) {
    aoForDensity = mix(1.0, 0.25, density);
    ao = mix(aoForDensity, 1.0, easeIn(heightPercent, 2.0));
    diffuseColor.rgb *= ao * uAoIntensity;
  }

  diffuseColor.rgb *= vGrassColour;
  diffuseColor.rgb *= mix(uGrassMiddleBrightnessMin, uGrassMiddleBrightnessMax, grassMiddle);

  reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
  totalEmissiveRadiance = emissive;
  
  #include <logdepthbuf_fragment>
  #include <map_fragment>
  #include <color_fragment>
  #include <alphamap_fragment>
  #include <alphatest_fragment>
  #include <alphahash_fragment>
  #include <specularmap_fragment>
  #include <normal_fragment_begin>
  #include <normal_fragment_maps>

  vec3 grassBaseNormal = normalize(normal);
  normal2 = normalize(vNormal2);
  normal = normalize(mix(grassBaseNormal, normal2, vGrassParams.w));

  #include <emissivemap_fragment>
  
  #include <lights_phong_fragment>
  #include <lights_fragment_begin>
  #include <lights_fragment_maps>
  #include <lights_fragment_end>
  
  if (uBackscatterEnabled) {
    vec3 viewDir = normalize(-vViewPosition);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
    
    float backScatter = max(dot(-lightDir, normal), 0.0);
    float frontScatter = max(dot(lightDir, normal), 0.0);
    
    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    rim = pow(rim, 1.5);
    
    float grassThickness = (1.0 - heightPercent) * 0.8 + 0.2;
    
    float sssBack = pow(backScatter, uBackscatterPower) * grassThickness;
    float sssFront = pow(frontScatter, 1.5) * grassThickness * uFrontScatterStrength;
    float rimSSS = pow(rim, 2.0) * grassThickness * uRimSSSStrength;
    
    float totalSSS = sssBack + sssFront + rimSSS;
    totalSSS = clamp(totalSSS, 0.0, 1.0);
    
    vec3 backscatterColor = uBackscatterColor * 0.4;
    vec3 backscatterContribution = backscatterColor * totalSSS * uBackscatterIntensity;
    reflectedLight.directDiffuse += backscatterContribution;
  }
  
  if (uSpecularEnabled && uSpecularIntensity > 0.0) {
    vec3 specularNormal = normalize(vNormal2);
    vec3 viewDir = normalize(-vViewPosition);
    vec3 specDir = normalize(uSpecularDirection);
    vec3 specReflectDir = reflect(-specDir, specularNormal);
    float spec = pow(max(dot(viewDir, specReflectDir), 0.0), 25.6);
    
    float specularDepth = length(vViewPosition);
    float distanceFalloff = smoothstep(2.0, 10.0, specularDepth);
    float tipFalloff = smoothstep(0.5, 1.0, heightPercent);
    
    vec3 specular = uSpecularColor * spec * uSpecularIntensity * distanceFalloff * tipFalloff * 3.0;
    reflectedLight.directSpecular += specular;
  }
  
  #include <aomap_fragment>
  
  outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

  #include <envmap_fragment>
  #include <opaque_fragment>
  #include <tonemapping_fragment>
  #include <colorspace_fragment>

  sceneDepth = length(vViewPosition);
  gl_FragColor.xyz = CalculateFog(gl_FragColor.xyz, viewDir, sceneDepth);

  #include <premultiplied_alpha_fragment>
  #include <dithering_fragment>
}
`;

// Create heightmap texture (simple flat plane for now)
function createHeightmap() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  for (let i = 0; i < size * size; i++) {
    const stride = i * 4;
    data[stride] = 0; // Height
    data[stride + 1] = 0;
    data[stride + 2] = 0;
    data[stride + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;

  return texture;
}

// Create full geometry with all grass blades (non-instanced)
function createGrassGeometry(segments, numGrass, centers) {
  const VERTICES = (segments + 1) * 2;
  const totalVertices = numGrass * VERTICES * 2; // Front and back faces

  // Create indices for all blades
  const indices = [];
  const vertIndices = new Uint8Array(totalVertices);
  const centerAttrib = new Float32Array(totalVertices * 2);
  const positionAttrib = new Float32Array(totalVertices * 3);

  let vertexOffset = 0;

  for (let bladeIdx = 0; bladeIdx < numGrass; bladeIdx++) {
    const centerX = centers[bladeIdx * 2];
    const centerZ = centers[bladeIdx * 2 + 1];

    // Create indices for front and back faces of this blade
    for (let i = 0; i < segments; ++i) {
      const vi = i * 2;
      const baseIdx = vertexOffset + vi;

      // Front face
      indices.push(baseIdx + 0, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 2, baseIdx + 1, baseIdx + 3);

      // Back face
      const fi = baseIdx + VERTICES;
      indices.push(fi + 2, fi + 1, fi + 0);
      indices.push(fi + 3, fi + 1, fi + 2);
    }

    // Set vertex data for this blade
    for (let v = 0; v < VERTICES * 2; v++) {
      const idx = vertexOffset + v;
      vertIndices[idx] = v;
      centerAttrib[idx * 2] = centerX;
      centerAttrib[idx * 2 + 1] = centerZ;
      // Position will be set to 0,0,0 initially (shader will calculate from center)
      positionAttrib[idx * 3] = 0;
      positionAttrib[idx * 3 + 1] = 0;
      positionAttrib[idx * 3 + 2] = 0;
    }

    vertexOffset += VERTICES * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("vertIndex", new THREE.Uint8BufferAttribute(vertIndices, 1));
  geo.setAttribute("center", new THREE.Float32BufferAttribute(centerAttrib, 2));
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positionAttrib, 3)
  );
  geo.setIndex(indices);

  return geo;
}

// Main component
export default function ClaudeGrassQuick5Infinite({
  playerPosition = new THREE.Vector3(0, 0, 0),
  terrainSize = 100,
  heightScale = 1,
  heightOffset = 0,
  grassWidth = 0.1,
  grassHeight = 1.5,
  lodDistance = 15,
  maxDistance = 100,
  grassDensity = 40000, // Total number of grass blades (like details*details in Grass.tsx)
  grassDistance = 50, // Distance to wrap around (like state.chunks.minSize in Grass.tsx)
  windEnabled = true,
  windStrength = 1.25,
  windDirectionScale = 0.05,
  windDirectionSpeed = 0.05,
  windStrengthScale = 0.25,
  windStrengthSpeed = 1.0,
  playerInteractionEnabled = true,
  playerInteractionRepel = true,
  playerInteractionRange = 2.5,
  playerInteractionStrength = 0.2,
  playerInteractionHeightThreshold = 3.0,
  baseColor1 = "#051303",
  baseColor2 = "#061a03",
  tipColor1 = "#a6cc40",
  tipColor2 = "#cce666",
  gradientCurve = 4.0,
  aoEnabled = true,
  aoIntensity = 1.0,
  grassMiddleBrightnessMin = 0.85,
  grassMiddleBrightnessMax = 1.0,
  fogEnabled = false,
  fogNear = 5.0,
  fogFar = 50.0,
  fogIntensity = 1.0,
  fogColor = "#4f74af",
  specularEnabled = false,
  specularIntensity = 2.0,
  specularColor = "#ffffff",
  specularDirectionX = -1.0,
  specularDirectionY = 1.0,
  specularDirectionZ = 0.5,
  backscatterEnabled = true,
  backscatterIntensity = 0.5,
  backscatterColor = "#51cc66",
  backscatterPower = 2.0,
  frontScatterStrength = 0.3,
  rimSSSStrength = 0.5,
}) {
  const { camera } = useThree();
  const state = useGameState();
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const totalTime = useRef(0);

  // Track player position
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (playerPosition) {
      if (Array.isArray(playerPosition)) {
        playerPosRef.current.set(
          playerPosition[0] || 0,
          playerPosition[1] || 0,
          playerPosition[2] || 0
        );
      } else if (playerPosition instanceof THREE.Vector3) {
        playerPosRef.current.copy(playerPosition);
      } else if (playerPosition.x !== undefined) {
        playerPosRef.current.set(
          playerPosition.x || 0,
          playerPosition.y || 0,
          playerPosition.z || 0
        );
      }
    }
  }, [playerPosition]);

  // Use game state player position if available
  useEffect(() => {
    if (state?.player?.position?.current) {
      const pos = state.player.position.current;
      playerPosRef.current.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    }
  }, [state?.player?.position]);

  // Color refs for uniforms
  const baseColor1Ref = useRef(new THREE.Color());
  const baseColor2Ref = useRef(new THREE.Color());
  const tipColor1Ref = useRef(new THREE.Color());
  const tipColor2Ref = useRef(new THREE.Color());
  const fogColorRef = useRef(new THREE.Color());
  const specularColorRef = useRef(new THREE.Color());
  const backscatterColorRef = useRef(new THREE.Color());

  // Convert SRGB to Linear
  function convertSRGBToLinear(color) {
    const c = new THREE.Color(color);
    return c;
  }

  useEffect(() => {
    baseColor1Ref.current.copy(convertSRGBToLinear(baseColor1));
    baseColor2Ref.current.copy(convertSRGBToLinear(baseColor2));
    tipColor1Ref.current.copy(convertSRGBToLinear(tipColor1));
    tipColor2Ref.current.copy(convertSRGBToLinear(tipColor2));
    fogColorRef.current.copy(convertSRGBToLinear(fogColor));
    const spec = convertSRGBToLinear(specularColor);
    specularColorRef.current.copy(spec);
    const backscatter = convertSRGBToLinear(backscatterColor);
    backscatterColorRef.current.copy(backscatter);
  }, [
    baseColor1,
    baseColor2,
    tipColor1,
    tipColor2,
    fogColor,
    specularColor,
    backscatterColor,
  ]);

  // Pre-generate grass center positions in a grid (like Grass.tsx)
  const centers = useMemo(() => {
    const details = Math.floor(Math.sqrt(grassDensity)); // Calculate grid size
    const size = grassDistance;
    const count = details * details;
    const fragmentSize = size / details;
    const positionRandomness = 0.5;

    const centersArray = new Float32Array(count * 2); // Just X, Z per blade

    for (let iX = 0; iX < details; iX++) {
      const fragmentX = (iX / details - 0.5) * size + fragmentSize * 0.5;

      for (let iZ = 0; iZ < details; iZ++) {
        const fragmentZ = (iZ / details - 0.5) * size + fragmentSize * 0.5;

        const idx = (iX * details + iZ) * 2;

        const centerX =
          fragmentX + (Math.random() - 0.5) * fragmentSize * positionRandomness;
        const centerZ =
          fragmentZ + (Math.random() - 0.5) * fragmentSize * positionRandomness;

        centersArray[idx] = centerX;
        centersArray[idx + 1] = centerZ;
      }
    }

    return centersArray;
  }, [grassDensity, grassDistance]);

  // Create heightmap
  const heightmap = useMemo(() => createHeightmap(), []);

  // Create geometry with all blades
  const geometry = useMemo(() => {
    const details = Math.floor(Math.sqrt(grassDensity));
    const numGrass = details * details;
    console.log(
      "🌿 Creating grass geometry with",
      numGrass,
      "blades, centers length:",
      centers.length
    );
    if (centers.length < numGrass * 2) {
      console.warn("⚠️ Not enough centers for grass density!");
      return null;
    }
    const geo = createGrassGeometry(GRASS_SEGMENTS_HIGH, numGrass, centers);
    console.log(
      "🌿 Geometry created:",
      geo,
      "vertices:",
      geo.attributes.position.count
    );
    return geo;
  }, [grassDensity, centers]);

  // Create material
  const material = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.grassSize = {
        value: new THREE.Vector2(grassWidth, grassHeight),
      };
      shader.uniforms.grassParams = {
        value: new THREE.Vector4(
          GRASS_SEGMENTS_HIGH, // Use high detail for main mesh
          GRASS_VERTICES_HIGH,
          heightScale,
          heightOffset
        ),
      };
      shader.uniforms.grassDraw = {
        value: new THREE.Vector4(lodDistance, maxDistance, 0, 0),
      };
      shader.uniforms.time = { value: 0.0 };
      shader.uniforms.heightmap = { value: heightmap };
      shader.uniforms.heightParams = {
        value: new THREE.Vector4(terrainSize, 0, 0, 0),
      };
      shader.uniforms.playerPos = { value: new THREE.Vector3(0, 0, 0) };
      shader.uniforms.grassDistance = { value: grassDistance };
      shader.uniforms.viewMatrixInverse = { value: new THREE.Matrix4() };

      shader.uniforms.windParams = {
        value: new THREE.Vector4(
          windDirectionScale,
          windDirectionSpeed,
          windStrengthScale,
          windStrengthSpeed
        ),
      };
      shader.uniforms.windStrength = {
        value: windEnabled ? windStrength : 0.0,
      };

      shader.uniforms.playerInteractionParams = {
        value: new THREE.Vector2(
          playerInteractionEnabled ? playerInteractionRange : 999.0,
          playerInteractionEnabled ? playerInteractionStrength : 0.0
        ),
      };
      shader.uniforms.playerInteractionRepel = {
        value: playerInteractionRepel ? 1.0 : -1.0,
      };
      shader.uniforms.playerInteractionHeightThreshold = {
        value: playerInteractionHeightThreshold,
      };

      shader.uniforms.uBaseColor1 = {
        value: baseColor1Ref.current.clone(),
      };
      shader.uniforms.uBaseColor2 = {
        value: baseColor2Ref.current.clone(),
      };
      shader.uniforms.uTipColor1 = { value: tipColor1Ref.current.clone() };
      shader.uniforms.uTipColor2 = { value: tipColor2Ref.current.clone() };
      shader.uniforms.uGradientCurve = { value: gradientCurve };
      shader.uniforms.uAoEnabled = { value: aoEnabled };
      shader.uniforms.uAoIntensity = { value: aoIntensity };
      shader.uniforms.uFogEnabled = { value: fogEnabled };
      shader.uniforms.uFogNear = { value: fogNear };
      shader.uniforms.uFogFar = { value: fogFar };
      shader.uniforms.uFogIntensity = { value: fogIntensity };
      shader.uniforms.uFogColor = { value: fogColorRef.current.clone() };
      shader.uniforms.uSpecularEnabled = { value: specularEnabled };
      shader.uniforms.uSpecularIntensity = { value: specularIntensity };
      shader.uniforms.uSpecularColor = {
        value: specularColorRef.current.clone(),
      };
      shader.uniforms.uSpecularDirection = {
        value: new THREE.Vector3(
          specularDirectionX,
          specularDirectionY,
          specularDirectionZ
        ).normalize(),
      };
      shader.uniforms.uGrassMiddleBrightnessMin = {
        value: grassMiddleBrightnessMin,
      };
      shader.uniforms.uGrassMiddleBrightnessMax = {
        value: grassMiddleBrightnessMax,
      };
      shader.uniforms.uBackscatterEnabled = { value: backscatterEnabled };
      shader.uniforms.uBackscatterIntensity = {
        value: backscatterIntensity,
      };
      shader.uniforms.uBackscatterColor = {
        value: backscatterColorRef.current.clone(),
      };
      shader.uniforms.uBackscatterPower = { value: backscatterPower };
      shader.uniforms.uFrontScatterStrength = {
        value: frontScatterStrength,
      };
      shader.uniforms.uRimSSSStrength = { value: rimSSSStrength };

      shader.vertexShader = vertexShader;
      shader.fragmentShader = fragmentShader;

      mat.userData.shader = shader;
    };

    mat.needsUpdate = true;
    materialRef.current = mat;

    return mat;
  }, [
    grassWidth,
    grassHeight,
    heightScale,
    heightOffset,
    lodDistance,
    maxDistance,
    terrainSize,
    grassDistance,
    windEnabled,
    windStrength,
    windDirectionScale,
    windDirectionSpeed,
    windStrengthScale,
    windStrengthSpeed,
    playerInteractionEnabled,
    playerInteractionRange,
    playerInteractionStrength,
    playerInteractionRepel,
    playerInteractionHeightThreshold,
    baseColor1,
    baseColor2,
    tipColor1,
    tipColor2,
    gradientCurve,
    aoEnabled,
    aoIntensity,
    fogEnabled,
    fogNear,
    fogFar,
    fogIntensity,
    fogColor,
    specularEnabled,
    specularIntensity,
    specularColor,
    specularDirectionX,
    specularDirectionY,
    specularDirectionZ,
    grassMiddleBrightnessMin,
    grassMiddleBrightnessMax,
    backscatterEnabled,
    backscatterIntensity,
    backscatterColor,
    backscatterPower,
    frontScatterStrength,
    rimSSSStrength,
    heightmap,
  ]);

  // Update uniforms and mesh position
  useFrame((r3fState, delta) => {
    if (!materialRef.current || !meshRef.current || !geometry) return;

    totalTime.current += delta;

    // Update player position
    if (state?.player?.position?.current) {
      const pos = state.player.position.current;
      playerPosRef.current.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    } else if (playerPosition) {
      if (Array.isArray(playerPosition)) {
        playerPosRef.current.set(
          playerPosition[0] || 0,
          playerPosition[1] || 0,
          playerPosition[2] || 0
        );
      } else if (playerPosition instanceof THREE.Vector3) {
        playerPosRef.current.copy(playerPosition);
      } else if (playerPosition.x !== undefined) {
        playerPosRef.current.set(
          playerPosition.x || 0,
          playerPosition.y || 0,
          playerPosition.z || 0
        );
      }
    }

    // Update mesh position to follow player (X and Z, Y stays at 0)
    meshRef.current.position.set(
      playerPosRef.current.x,
      0,
      playerPosRef.current.z
    );

    // Update shader uniforms
    if (materialRef.current.userData.shader) {
      const shader = materialRef.current.userData.shader;
      shader.uniforms.time.value = totalTime.current;
      shader.uniforms.playerPos.value.copy(playerPosRef.current);
      shader.uniforms.viewMatrixInverse.value = camera.matrixWorld;

      // Debug log every 60 frames
      if (Math.floor(totalTime.current * 60) % 60 === 0) {
        console.log("🌿 Grass Infinite - Player pos:", playerPosRef.current);
        console.log("🌿 Grass Infinite - Mesh pos:", meshRef.current.position);
        console.log("🌿 Grass Infinite - Material:", materialRef.current);
        console.log("🌿 Grass Infinite - Geometry:", geometry);
      }

      // Update color uniforms
      shader.uniforms.uBaseColor1.value.copy(baseColor1Ref.current);
      shader.uniforms.uBaseColor2.value.copy(baseColor2Ref.current);
      shader.uniforms.uTipColor1.value.copy(tipColor1Ref.current);
      shader.uniforms.uTipColor2.value.copy(tipColor2Ref.current);
      shader.uniforms.uFogColor.value.copy(fogColorRef.current);
      shader.uniforms.uSpecularColor.value.copy(specularColorRef.current);
      shader.uniforms.uBackscatterColor.value.copy(backscatterColorRef.current);
    }
  });

  if (!geometry || !material) {
    console.warn("🌿 Grass Infinite - Missing geometry or material");
    return null;
  }

  console.log(
    "🌿 Grass Infinite - Rendering mesh with geometry:",
    geometry,
    "material:",
    material
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      visible={true}
    />
  );
}
