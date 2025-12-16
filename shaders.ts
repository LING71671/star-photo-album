// Vertex Shader for Particles (Breathing/Twinkling)
export const particleVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uBaseColor; // Added
  
  attribute float aScale;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Breathing effect based on time and random offset
    float breath = sin(uTime * 2.0 + aRandom * 10.0) * 0.5 + 0.5;
    float size = aScale * (0.8 + 0.4 * breath);
    
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z);
    
    // Mix passed base color with some variation
    vec3 variation = vec3(0.1, 0.1, 0.2) * sin(uTime + position.x);
    vColor = uBaseColor + variation * breath;
    vAlpha = 0.6 + 0.4 * breath;
  }
`;

// Fragment Shader for Particles
export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft edge
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

// Fragment Shader for Holographic Photos with Chromatic Aberration
export const holoFragmentShader = `
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uHover;
  uniform float uGlitchStrength;
  
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    
    // Random jitter for glitches
    float noise = random(vec2(uTime * 15.0, uv.y));
    float trigger = step(0.95, noise); // 5% chance of jitter row
    float offset = (noise - 0.5) * 0.1 * uGlitchStrength * trigger;
    
    uv.x += offset;

    // Chromatic Aberration (RGB Split)
    float shift = 0.02 * uGlitchStrength;
    float r = texture2D(uTexture, uv + vec2(shift, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(shift, 0.0)).b;
    vec3 texColor = vec3(r, g, b);
    
    float alpha = texture2D(uTexture, uv).a;

    // Scanlines
    float scanline = sin(uv.y * 150.0 + uTime * 5.0) * 0.05;
    
    // Color tinting
    vec3 mixedColor = mix(texColor.rgb, uColor, 0.1 + uHover * 0.3);
    mixedColor += vec3(scanline);
    
    // Border glow
    float borderX = step(0.48, abs(uv.x - 0.5));
    float borderY = step(0.48, abs(uv.y - 0.5));
    float border = max(borderX, borderY);
    
    vec3 borderColor = uColor * border * (1.5 + sin(uTime * 5.0) * 0.5);
    
    // Combine
    vec3 finalColor = mixedColor + borderColor;
    
    // Alpha logic
    float fade = alpha * (0.9 + 0.1 * sin(uTime));
    
    gl_FragColor = vec4(finalColor, fade);
  }
`;

export const holoVertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHover;
  uniform float uGlitchStrength;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Hover float effect
    pos.z += sin(uTime * 3.0) * 0.1 * uHover;
    
    // Slight vertex jitter on strong glitch
    if (uGlitchStrength > 0.5) {
        pos.x += sin(uTime * 20.0 + pos.y) * 0.02 * uGlitchStrength;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;