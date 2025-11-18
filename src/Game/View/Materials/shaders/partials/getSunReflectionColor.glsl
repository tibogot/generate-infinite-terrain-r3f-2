vec3 getSunReflectionColor(vec3 baseColor, float sunReflection)
{
    // Use a softer reflection color instead of pure white to prevent mountains from appearing too bright
    vec3 reflectionColor = baseColor + vec3(0.3, 0.3, 0.3);
    return mix(baseColor, reflectionColor, clamp(sunReflection, 0.0, 0.6));
}