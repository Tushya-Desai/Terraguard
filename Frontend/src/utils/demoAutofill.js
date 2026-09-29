/**
 * Demo Data Generator Utility for TerraGuard "Record New Test" Form.
 * Isolated module for one-click autofill during pitches and live demonstrations.
 * Can be safely removed prior to production launch without affecting core logic.
 */

const SAMPLE_PLOT_NAMES = [
  'North Field A',
  'Riverside Plot 2',
  'Backyard Garden Test',
  'Community Farm Plot C',
  'Greenhouse Bed 1',
  'East Acre Trial Plot',
  'Sector 7 Organic Field',
  'Tomato Patch South',
  'Canal Border Ridge',
  'Highland Agroforestry Bed',
];

/**
 * Generate a dynamic SVG test cuvette photo matching the chosen lead risk tier.
 */
function createDemoReactionPhoto(ppm, riskLevel, plotName) {
  const colors = {
    low: { r: 62, g: 145, b: 66, label: 'Optimal / Safe Color Reaction' },
    moderate: { r: 224, g: 165, b: 38, label: 'Amber / Caution Reaction' },
    high: { r: 194, g: 76, b: 61, label: 'Red / Danger Reaction' },
  };

  const { r, g, b, label } = colors[riskLevel] || colors.low;

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e241c"/>
      <stop offset="100%" stop-color="#141813"/>
    </linearGradient>
    <radialGradient id="liquid" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgb(${r},${g},${b})" stop-opacity="0.95"/>
      <stop offset="80%" stop-color="rgb(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)})" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="rgb(${Math.max(0, r - 70)},${Math.max(0, g - 70)},${Math.max(0, b - 70)})" stop-opacity="0.75"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" rx="16" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="70" fill="#4c8c5c" opacity="0.06"/>
  <circle cx="350" cy="250" r="90" fill="#b8863b" opacity="0.06"/>
  
  <!-- Cuvette / Vial -->
  <rect x="130" y="45" width="140" height="180" rx="20" fill="url(#liquid)"/>
  <rect x="130" y="45" width="140" height="180" rx="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <rect x="145" y="28" width="110" height="20" rx="4" fill="#2f5c3a" stroke="rgba(255,255,255,0.2)"/>
  
  <!-- Measurement Markings -->
  <line x1="145" y1="85" x2="165" y2="85" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <line x1="145" y1="125" x2="175" y2="125" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <line x1="145" y1="165" x2="165" y2="165" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  
  <!-- Badge -->
  <rect x="60" y="245" width="280" height="34" rx="17" fill="#1e241c" stroke="rgb(${r},${g},${b})" stroke-width="1.5"/>
  <text x="200" y="267" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#FAF7F0" text-anchor="middle">
    ${label} (${ppm} ppm)
  </text>
</svg>`;

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const filename = `demo_reaction_${riskLevel}_${Math.floor(Math.random() * 1000)}.svg`;
  const file = new File([blob], filename, { type: 'image/svg+xml' });
  const previewUrl = URL.createObjectURL(blob);

  return { file, previewUrl };
}

/**
 * Generate a complete set of randomized, in-range demo values.
 */
export function generateRandomDemoData(currentLat, currentLng) {
  // 1. Random Plot Name with 2-digit distinct identifier
  const baseName = SAMPLE_PLOT_NAMES[Math.floor(Math.random() * SAMPLE_PLOT_NAMES.length)];
  const randomSuffix = Math.floor(Math.random() * 90 + 10);
  const plotLabel = `${baseName} - ${randomSuffix}`;

  // 2. Randomized Lead Concentration distributed evenly across Low, Moderate, High risk tiers
  const tiers = ['low', 'moderate', 'high'];
  const chosenTier = tiers[Math.floor(Math.random() * tiers.length)];

  let ppm;
  if (chosenTier === 'low') {
    ppm = parseFloat((Math.random() * 165 + 15).toFixed(1)); // 15.0 to 180.0 ppm (<200)
  } else if (chosenTier === 'moderate') {
    ppm = parseFloat((Math.random() * 175 + 210).toFixed(1)); // 210.0 to 385.0 ppm (200-400)
  } else {
    ppm = parseFloat((Math.random() * 165 + 415).toFixed(1)); // 415.0 to 580.0 ppm (>400)
  }

  // 3. Random GPS Coordinates: ~1-2km offset around current point or fallback center
  const baseLat = parseFloat(currentLat) || 22.9734;
  const baseLng = parseFloat(currentLng) || 78.6569;
  
  // Offset by +/- 0.015 degrees (~1.5km)
  const latOffset = (Math.random() - 0.5) * 0.03;
  const lngOffset = (Math.random() - 0.5) * 0.03;
  
  const latitude = (baseLat + latOffset).toFixed(6);
  const longitude = (baseLng + lngOffset).toFixed(6);

  // 4. Remediation Toggle (~50/50)
  const remediationActive = Math.random() > 0.5;

  // 5. Generate matching reaction photo
  const { file: photoFile, previewUrl: photoPreview } = createDemoReactionPhoto(ppm, chosenTier, plotLabel);

  return {
    plotLabel,
    leadConcentration: ppm.toString(),
    latitude,
    longitude,
    remediationActive,
    photoFile,
    photoPreview,
    riskLevel: chosenTier,
  };
}
