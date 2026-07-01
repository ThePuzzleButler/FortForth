/* ============================================================
   Renders the Fortnite Survivor mark + title into any element
   with id="brand-slot". 4th of July edition:
   Navy shield, red & white firework burst, star field.
   ============================================================ */

function renderBrand(subtitle) {
  const el = document.getElementById("brand-slot");
  if (!el) return;
  el.innerHTML = `
    <div class="brand">
      <div class="brand-mark">
        <svg width="112" height="112" viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%"   stop-color="#1a3080"/>
              <stop offset="100%" stop-color="#050b20"/>
            </radialGradient>
            <radialGradient id="burstGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#ffffff"/>
              <stop offset="35%"  stop-color="#f5c518"/>
              <stop offset="70%"  stop-color="#dc2626"/>
              <stop offset="100%" stop-color="#4a90e2" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- outer dashed ring in red -->
          <circle cx="56" cy="56" r="52" fill="none" stroke="#dc2626" stroke-width="1.5"
                  stroke-dasharray="5 5" opacity="0.6"/>
          <!-- inner blue ring -->
          <circle cx="56" cy="56" r="46" fill="none" stroke="#4a90e2" stroke-width="1"
                  stroke-dasharray="3 9" opacity="0.4"/>
          <!-- navy background circle -->
          <circle cx="56" cy="56" r="43" fill="url(#bgGrad)"/>

          <!-- firework burst rays (alternating long/short) -->
          <!-- 16 rays: 8 long, 8 short interleaved -->
          <g transform="translate(56,56)" stroke-linecap="round">
            <line x1="0" y1="-12" x2="0"  y2="-34" stroke="#ffffff" stroke-width="2.2"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(22.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-26" stroke="#dc2626" stroke-width="2.2" transform="rotate(45)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(67.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-34" stroke="#ffffff" stroke-width="2.2" transform="rotate(90)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(112.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-26" stroke="#dc2626" stroke-width="2.2" transform="rotate(135)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(157.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-34" stroke="#ffffff" stroke-width="2.2" transform="rotate(180)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(202.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-26" stroke="#dc2626" stroke-width="2.2" transform="rotate(225)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(247.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-34" stroke="#ffffff" stroke-width="2.2" transform="rotate(270)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(292.5)"/>
            <line x1="0" y1="-12" x2="0"  y2="-26" stroke="#dc2626" stroke-width="2.2" transform="rotate(315)"/>
            <line x1="0" y1="-12" x2="9"  y2="-20" stroke="#f5c518" stroke-width="1.4" transform="rotate(337.5)"/>
          </g>

          <!-- burst glow core -->
          <circle cx="56" cy="56" r="11" fill="url(#burstGrad)" opacity="0.9"/>
          <circle cx="56" cy="56" r="6"  fill="#ffffff" opacity="0.95"/>

          <!-- 5-pointed stars (small, scattered) -->
          <!-- star helper: polygon centered at 0,0 r=4 -->
          <!-- top star -->
          <polygon points="56,18 57.2,22 61,22 58,24.5 59.2,28.5 56,26 52.8,28.5 54,24.5 51,22 54.8,22"
                   fill="#f5c518" opacity="0.85"/>
          <!-- bottom-left star -->
          <polygon points="28,72 29,75.1 32.2,75.1 29.6,77 30.7,80.1 28,78.2 25.3,80.1 26.4,77 23.8,75.1 27,75.1"
                   fill="#f5c518" opacity="0.75"/>
          <!-- bottom-right star -->
          <polygon points="84,72 85,75.1 88.2,75.1 85.6,77 86.7,80.1 84,78.2 81.3,80.1 82.4,77 79.8,75.1 83,75.1"
                   fill="#f5c518" opacity="0.75"/>
          <!-- left star (tiny) -->
          <polygon points="22,50 22.7,52.2 25,52.2 23.2,53.5 23.9,55.7 22,54.4 20.1,55.7 20.8,53.5 19,52.2 21.3,52.2"
                   fill="#ffffff" opacity="0.6"/>
          <!-- right star (tiny) -->
          <polygon points="90,50 90.7,52.2 93,52.2 91.2,53.5 91.9,55.7 90,54.4 88.1,55.7 88.8,53.5 87,52.2 89.3,52.2"
                   fill="#ffffff" opacity="0.6"/>
        </svg>
      </div>
      <h1 class="brand-title">FORTNITE<br/>SURVIVOR</h1>
      <div class="brand-sub">${subtitle || "🇺🇸 independence day edition 🇺🇸"}</div>
    </div>
  `;
}
