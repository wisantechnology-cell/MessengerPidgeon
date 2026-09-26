const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'public', 'assets', 'stickers');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const stickers = [
  {
    filename: 'sticker_01_no_me_hables.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="skin1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#99583d"/>
      <stop offset="100%" stop-color="#733e28"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Sticker Die-Cut Outline -->
    <path d="M 120 40 Q 200 20 280 40 Q 350 80 340 180 Q 350 260 300 310 L 320 340 Q 200 370 80 340 L 100 310 Q 50 240 60 160 Q 50 80 120 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Hair Buns -->
    <circle cx="130" cy="95" r="38" fill="#181412"/>
    <circle cx="270" cy="95" r="38" fill="#181412"/>
    <!-- Head Base -->
    <ellipse cx="200" cy="170" rx="90" ry="85" fill="url(#skin1)"/>
    <!-- Front Hair -->
    <path d="M 115 150 C 130 95 270 95 285 150 C 260 120 140 120 115 150 Z" fill="#181412"/>
    <ellipse cx="200" cy="115" rx="55" ry="18" fill="#241d19"/>

    <!-- Angry Eyebrows angled down -->
    <path d="M 135 150 Q 165 160 185 155" stroke="#181412" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 215 155 Q 235 160 265 150" stroke="#181412" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Side-eye Glance Eyes -->
    <ellipse cx="160" cy="170" rx="16" ry="12" fill="#ffffff"/>
    <ellipse cx="240" cy="170" rx="16" ry="12" fill="#ffffff"/>
    <!-- Pupils looking far left/side -->
    <circle cx="152" cy="170" r="8" fill="#181412"/>
    <circle cx="150" cy="168" r="2.5" fill="#ffffff"/>
    <circle cx="232" cy="170" r="8" fill="#181412"/>
    <circle cx="230" cy="168" r="2.5" fill="#ffffff"/>

    <!-- Button Nose -->
    <ellipse cx="196" cy="195" rx="9" ry="6" fill="#5a2f1e"/>

    <!-- Pouty Sulking Cheeks & Mouth -->
    <path d="M 175 228 Q 200 215 225 228" stroke="#422013" stroke-width="6" stroke-linecap="round" fill="none"/>
    <ellipse cx="200" cy="235" rx="14" ry="7" fill="#823d24"/>

    <!-- Black Dress Body with Straps -->
    <path d="M 135 250 L 120 320 L 280 320 L 265 250 Z" fill="#1a1a1a"/>
    <rect x="130" y="245" width="16" height="30" rx="4" fill="#000000"/>
    <rect x="254" y="245" width="16" height="30" rx="4" fill="#000000"/>

    <!-- Meme Text: NO ME HABLES -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="38" fill="#ffffff" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">NO ME HABLES</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_02_diablos_senorita.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-2" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
    <linearGradient id="terry-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a5338"/>
      <stop offset="100%" stop-color="#613520"/>
    </linearGradient>
  </defs>
  <g filter="url(#shadow-2)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 360 120 350 240 Q 360 330 320 350 L 80 350 Q 40 320 50 220 Q 40 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Shaved Head / Bald dome -->
    <ellipse cx="200" cy="145" rx="80" ry="90" fill="url(#terry-skin)"/>
    <!-- Head highlight -->
    <ellipse cx="185" cy="95" rx="35" ry="18" fill="#a4694b" opacity="0.6"/>

    <!-- High expressive raised eyebrows -->
    <path d="M 140 125 Q 165 105 185 125" stroke="#1f130b" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 215 125 Q 235 105 260 125" stroke="#1f130b" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Huge Wide Shocked/Happy Eyes -->
    <ellipse cx="160" cy="148" rx="20" ry="17" fill="#ffffff" stroke="#1f130b" stroke-width="2"/>
    <ellipse cx="240" cy="148" rx="20" ry="17" fill="#ffffff" stroke="#1f130b" stroke-width="2"/>
    <!-- Pupils -->
    <circle cx="160" cy="148" r="9" fill="#1f130b"/>
    <circle cx="157" cy="145" r="3" fill="#ffffff"/>
    <circle cx="240" cy="148" r="9" fill="#1f130b"/>
    <circle cx="237" cy="145" r="3" fill="#ffffff"/>

    <!-- Broad Nose -->
    <path d="M 188 165 L 184 185 Q 200 195 216 185 L 212 165" fill="#4d2714"/>
    <ellipse cx="192" cy="186" rx="4" ry="2" fill="#291307"/>
    <ellipse cx="208" cy="186" rx="4" ry="2" fill="#291307"/>

    <!-- Big Mustache -->
    <path d="M 165 198 Q 200 192 235 198 Q 215 208 200 202 Q 185 208 165 198 Z" fill="#140a04"/>

    <!-- Huge Open Smiling Mouth with White Teeth -->
    <path d="M 155 208 Q 200 205 245 208 Q 240 248 200 252 Q 160 248 155 208 Z" fill="#691419"/>
    <!-- Teeth -->
    <path d="M 160 210 Q 200 210 240 210 L 235 222 Q 200 224 165 222 Z" fill="#ffffff"/>
    <path d="M 170 238 Q 200 246 230 238" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

    <!-- Suit & Shirt -->
    <path d="M 100 280 L 140 250 L 200 290 L 260 250 L 300 280 L 310 330 L 90 330 Z" fill="#1e222d"/>
    <polygon points="175,255 200,290 225,255 200,270" fill="#ffffff"/>
    <polygon points="194,270 206,270 203,310 197,310" fill="#a81924"/>

    <!-- Meme Text: DIABLOS SEÑORITA -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffffff" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">DIABLOS SEÑORITA</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_03_ay_dios_mio.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-3" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="hasbulla-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5cbb1"/>
      <stop offset="100%" stop-color="#dfa785"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 30 Q 200 10 310 30 Q 370 120 350 240 Q 360 330 310 350 L 90 350 Q 40 330 50 230 Q 30 110 90 30 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Short Brown Hair -->
    <ellipse cx="200" cy="120" rx="75" ry="55" fill="#4a2e1b"/>

    <!-- Hands on Head / Clutching Forehead (Stressed gesture) -->
    <!-- Left Hand -->
    <ellipse cx="115" cy="100" rx="30" ry="24" fill="url(#hasbulla-skin)" transform="rotate(-30 115 100)"/>
    <circle cx="100" cy="90" r="10" fill="#dfa785"/>
    <circle cx="112" cy="80" r="10" fill="#dfa785"/>
    <circle cx="126" cy="78" r="10" fill="#dfa785"/>
    <!-- Right Hand -->
    <ellipse cx="285" cy="100" rx="30" ry="24" fill="url(#hasbulla-skin)" transform="rotate(30 285 100)"/>
    <circle cx="300" cy="90" r="10" fill="#dfa785"/>
    <circle cx="288" cy="80" r="10" fill="#dfa785"/>
    <circle cx="274" cy="78" r="10" fill="#dfa785"/>

    <!-- Chubby Face -->
    <ellipse cx="200" cy="165" rx="75" ry="75" fill="url(#hasbulla-skin)"/>
    
    <!-- Hair Bangs -->
    <path d="M 140 115 Q 200 135 260 115 Q 240 100 200 100 Q 160 100 140 115 Z" fill="#4a2e1b"/>

    <!-- Distressed/Crying Brow & Forehead Wrinkles -->
    <path d="M 180 125 Q 200 132 220 125" stroke="#b87a55" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 150 138 Q 175 148 190 140" stroke="#331c0e" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 250 138 Q 225 148 210 140" stroke="#331c0e" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Pained Squinting Eyes with Tears -->
    <ellipse cx="168" cy="155" rx="14" ry="10" fill="#ffffff"/>
    <circle cx="168" cy="155" r="7" fill="#331c0e"/>
    <ellipse cx="232" cy="155" rx="14" ry="10" fill="#ffffff"/>
    <circle cx="232" cy="155" r="7" fill="#331c0e"/>

    <!-- Small nose -->
    <path d="M 195 168 Q 200 176 205 168" stroke="#aa6845" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Crying / Wailing Open Mouth -->
    <path d="M 175 192 Q 200 185 225 192 Q 220 218 200 220 Q 180 218 175 192 Z" fill="#6e1a1e"/>
    <path d="M 182 193 Q 200 196 218 193" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

    <!-- Green Polo Shirt with White Stripes on Neck -->
    <path d="M 120 235 L 80 320 L 320 320 L 280 235 Z" fill="#1b6e3f"/>
    <polygon points="175,235 200,265 225,235" fill="#ffffff"/>
    <path d="M 135 240 L 165 240" stroke="#ffffff" stroke-width="4"/>
    <path d="M 235 240 L 265 240" stroke="#ffffff" stroke-width="4"/>

    <!-- Meme Text: ¡AY DIOS MIO! -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="38" fill="#ffffff" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">!AY DIOS MIO¡</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_04_pero_no_me_hables_asi.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-4" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="crying-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8c3a5"/>
      <stop offset="100%" stop-color="#df8e67"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 70 40 Q 200 10 330 40 Q 370 120 360 240 Q 370 330 310 355 L 90 355 Q 30 330 40 220 Q 30 100 70 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Dark/Moody Background circle -->
    <rect x="55" y="45" width="290" height="295" rx="20" fill="#121214"/>

    <!-- Head & Hair -->
    <ellipse cx="200" cy="140" rx="75" ry="60" fill="#241913"/>
    <ellipse cx="200" cy="170" rx="70" ry="70" fill="url(#crying-skin)"/>

    <!-- Big Distressed Angled Eyebrows -->
    <path d="M 145 145 Q 170 160 185 145" stroke="#1c110a" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 215 145 Q 230 160 255 145" stroke="#1c110a" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Crying Eyes Filled with Tears & Glistening -->
    <ellipse cx="165" cy="165" rx="18" ry="14" fill="#ffffff"/>
    <circle cx="165" cy="165" r="9" fill="#1c110a"/>
    <circle cx="162" cy="160" r="3.5" fill="#ffffff"/>
    <!-- Tear stream left -->
    <path d="M 160 178 Q 155 200 158 220" stroke="#7bd0ff" stroke-width="4" stroke-linecap="round" fill="none"/>

    <ellipse cx="235" cy="165" rx="18" ry="14" fill="#ffffff"/>
    <circle cx="235" cy="165" r="9" fill="#1c110a"/>
    <circle cx="232" cy="160" r="3.5" fill="#ffffff"/>
    <!-- Tear stream right -->
    <path d="M 240 178 Q 245 200 242 220" stroke="#7bd0ff" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Sniffling Red Nose -->
    <ellipse cx="200" cy="188" rx="10" ry="7" fill="#c45d52"/>

    <!-- Desperate Trembling Open Crying Mouth -->
    <path d="M 165 210 Q 200 200 235 210 Q 230 242 200 245 Q 170 242 165 210 Z" fill="#541215"/>
    <path d="M 175 212 Q 200 215 225 212" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

    <!-- Dark Shirt with Scarf/Collar -->
    <path d="M 120 245 L 80 320 L 320 320 L 280 245 Z" fill="#1c2438"/>

    <!-- Meme Text: PERO NO ME HABLES ASI, OKEY? -->
    <text x="200" y="310" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="25" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">PERO NO ME HABLES</text>
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="27" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">ASI,OKEY?</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_05_shrek_sospechoso.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-5" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="shrek-green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#98b63e"/>
      <stop offset="100%" stop-color="#6e8c25"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 40 Q 200 10 320 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 80 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Shrek Trumpet Ears -->
    <!-- Left Ear Tube -->
    <path d="M 125 120 L 70 80 Q 60 70 70 60 Q 85 60 95 80 L 135 130 Z" fill="#7d9d2b"/>
    <ellipse cx="75" cy="70" rx="10" ry="14" fill="#526818" transform="rotate(-30 75 70)"/>
    <!-- Right Ear Tube -->
    <path d="M 275 120 L 330 80 Q 340 70 330 60 Q 315 60 305 80 L 265 130 Z" fill="#7d9d2b"/>
    <ellipse cx="325" cy="70" rx="10" ry="14" fill="#526818" transform="rotate(30 325 70)"/>

    <!-- Shrek Big Round Ogre Head -->
    <ellipse cx="200" cy="180" rx="95" ry="90" fill="url(#shrek-green)"/>
    
    <!-- Brow Ridge -->
    <path d="M 130 135 Q 200 120 270 145" stroke="#526818" stroke-width="8" stroke-linecap="round" fill="none"/>

    <!-- Skeptical Eyebrows: One raised super high, one lowered -->
    <path d="M 135 130 Q 160 110 180 128" stroke="#3b4c10" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 215 142 Q 240 148 265 140" stroke="#3b4c10" stroke-width="8" stroke-linecap="round" fill="none"/>

    <!-- Side-Glance Eyes -->
    <ellipse cx="160" cy="150" rx="18" ry="14" fill="#ffffff"/>
    <ellipse cx="240" cy="155" rx="18" ry="14" fill="#ffffff"/>
    <!-- Pupils glancing hard to the left -->
    <circle cx="150" cy="150" r="8" fill="#5e3914"/>
    <circle cx="148" cy="148" r="2.5" fill="#ffffff"/>
    <circle cx="230" cy="155" r="8" fill="#5e3914"/>
    <circle cx="228" cy="153" r="2.5" fill="#ffffff"/>

    <!-- Wide Big Ogre Nose with Large Nostrils -->
    <ellipse cx="200" cy="190" rx="26" ry="16" fill="#7ea02c"/>
    <circle cx="188" cy="195" r="5" fill="#3b4c10"/>
    <circle cx="212" cy="195" r="5" fill="#3b4c10"/>

    <!-- Smug / Skeptical Curled Lip Smile -->
    <path d="M 150 230 Q 190 235 245 220" stroke="#3b4c10" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 235 220 Q 252 215 250 205" stroke="#3b4c10" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Brown Leather Vest & Cream Tunic -->
    <path d="M 100 260 L 70 340 L 330 340 L 300 260 Z" fill="#d9cdb4"/>
    <path d="M 90 270 L 140 340 L 110 340 L 70 290 Z" fill="#5c3818"/>
    <path d="M 310 270 L 260 340 L 290 340 L 330 290 Z" fill="#5c3818"/>
  </g>
</svg>`
  },
  {
    filename: 'sticker_06_que_me_estas_contando.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-6" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 40 Q 200 10 320 40 Q 380 120 370 250 Q 380 340 310 360 L 90 360 Q 20 340 30 230 Q 20 100 80 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Blonde Pigtails / Ponytail -->
    <circle cx="120" cy="110" r="30" fill="#e8ba5d"/>
    <circle cx="280" cy="110" r="30" fill="#e8ba5d"/>
    <!-- Head Base -->
    <ellipse cx="200" cy="165" rx="75" ry="70" fill="#f8cfb7"/>
    <!-- Blonde Hair Top -->
    <path d="M 125 145 C 130 90 270 90 275 145 C 240 110 160 110 125 145 Z" fill="#f0c66b"/>

    <!-- Expressive Shrugging Eyebrows (Curved up) -->
    <path d="M 150 142 Q 170 130 185 142" stroke="#5c4118" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 215 142 Q 230 130 250 142" stroke="#5c4118" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Wide Confused Eyes -->
    <ellipse cx="168" cy="155" rx="14" ry="12" fill="#ffffff"/>
    <circle cx="168" cy="155" r="7" fill="#426b38"/>
    <circle cx="166" cy="153" r="2.5" fill="#ffffff"/>
    <ellipse cx="232" cy="155" rx="14" ry="12" fill="#ffffff"/>
    <circle cx="232" cy="155" r="7" fill="#426b38"/>
    <circle cx="230" cy="153" r="2.5" fill="#ffffff"/>

    <!-- Small Button Nose -->
    <circle cx="200" cy="175" r="4" fill="#df987e"/>

    <!-- Shrugging / Amused Open Smile -->
    <path d="M 175 195 Q 200 215 225 195" stroke="#8c2e2e" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 182 198 Q 200 206 218 198" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>

    <!-- Shrugging Hands (Palms up beside shoulders) -->
    <ellipse cx="85" cy="225" rx="18" ry="14" fill="#f8cfb7" transform="rotate(-20 85 225)"/>
    <ellipse cx="315" cy="225" rx="18" ry="14" fill="#f8cfb7" transform="rotate(20 315 225)"/>

    <!-- Bright Pink Zipper Jacket -->
    <path d="M 125 225 L 85 300 L 315 300 L 275 225 Z" fill="#e8437a"/>
    <path d="M 200 225 L 200 300" stroke="#ffffff" stroke-width="3"/>

    <!-- Meme Text: QUE ME ESTAS CONTANDO? -->
    <text x="200" y="325" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">QUE ME ESTAS</text>
    <text x="200" y="352" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">CONTANDO?</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_07_estoy_esperando.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-7" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 40 Q 200 10 320 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 80 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Dark Background -->
    <rect x="55" y="45" width="290" height="295" rx="20" fill="#0f1526"/>

    <!-- Skull Base -->
    <ellipse cx="190" cy="135" rx="65" ry="60" fill="#e8e4d8"/>
    <!-- Cheekbones -->
    <polygon points="140,160 170,200 210,200 240,160 190,170" fill="#e8e4d8"/>
    <!-- Teeth / Jaw -->
    <rect x="165" y="195" width="50" height="20" rx="4" fill="#dad5c5"/>
    <path d="M 170 195 L 170 215 M 180 195 L 180 215 M 190 195 L 190 215 M 200 195 L 200 215 M 210 195 L 210 215" stroke="#3d372e" stroke-width="2"/>

    <!-- Dark Eye Sockets -->
    <ellipse cx="165" cy="135" rx="18" ry="20" fill="#1b1713"/>
    <ellipse cx="215" cy="135" rx="18" ry="20" fill="#1b1713"/>
    <!-- Triangular Nose Cavity -->
    <polygon points="190,155 183,172 197,172" fill="#1b1713"/>

    <!-- Skeletal Arm Resting Chin on Hand (Bored waiting posture) -->
    <!-- Bony Hand Under Chin -->
    <path d="M 140 180 Q 130 150 135 125" stroke="#e8e4d8" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M 145 185 Q 138 160 142 135" stroke="#e8e4d8" stroke-width="6" stroke-linecap="round" fill="none"/>
    <!-- Arm Bones -->
    <path d="M 140 195 L 80 250 L 220 250" stroke="#e8e4d8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Ribcage / Spine -->
    <path d="M 190 215 L 190 280" stroke="#e8e4d8" stroke-width="10" stroke-linecap="round"/>
    <path d="M 160 230 Q 190 240 220 230" stroke="#dad5c5" stroke-width="6" fill="none"/>
    <path d="M 155 250 Q 190 260 225 250" stroke="#dad5c5" stroke-width="6" fill="none"/>
    <path d="M 160 270 Q 190 280 220 270" stroke="#dad5c5" stroke-width="6" fill="none"/>

    <!-- Meme Text: ESTOY ESPERANDO! in Yellow Glow -->
    <text x="200" y="325" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffe033" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">ESTOY</text>
    <text x="200" y="355" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffe033" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">ESPERANDO!</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_08_escucho_pero_no_entiendo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-8" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 30 Q 200 10 320 30 Q 370 110 360 240 Q 370 330 310 355 L 90 355 Q 30 330 40 220 Q 30 100 80 30 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Hair -->
    <ellipse cx="200" cy="115" rx="75" ry="50" fill="#613b1e"/>

    <!-- Boy Head Base -->
    <ellipse cx="200" cy="165" rx="75" ry="75" fill="#f8cdb2"/>
    
    <!-- Hair Front -->
    <path d="M 135 125 C 150 95 250 95 265 125 C 240 115 160 115 135 125 Z" fill="#613b1e"/>

    <!-- Loading / Buffering Spinner ON FOREHEAD -->
    <g transform="translate(200, 115)">
      <circle cx="0" cy="-14" r="3" fill="#333333"/>
      <circle cx="10" cy="-10" r="3" fill="#666666"/>
      <circle cx="14" cy="0" r="3" fill="#999999"/>
      <circle cx="10" cy="10" r="3" fill="#cccccc"/>
      <circle cx="0" cy="14" r="3" fill="#ffffff"/>
      <circle cx="-10" cy="10" r="3" fill="#333333"/>
      <circle cx="-14" cy="0" r="3" fill="#333333"/>
      <circle cx="-10" cy="-10" r="3" fill="#333333"/>
    </g>

    <!-- Blank Confused Eyebrows -->
    <path d="M 148 145 Q 170 142 185 148" stroke="#3d210d" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 215 148 Q 230 142 252 145" stroke="#3d210d" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Blank Staring Eyes -->
    <ellipse cx="168" cy="160" rx="14" ry="12" fill="#ffffff"/>
    <circle cx="168" cy="160" r="7" fill="#3d210d"/>
    <circle cx="166" cy="158" r="2.5" fill="#ffffff"/>
    <ellipse cx="232" cy="160" rx="14" ry="12" fill="#ffffff"/>
    <circle cx="232" cy="160" r="7" fill="#3d210d"/>
    <circle cx="230" cy="158" r="2.5" fill="#ffffff"/>

    <!-- Small Nose -->
    <path d="M 196 172 Q 200 180 204 172" stroke="#bd7753" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Straight Flat Confused Mouth -->
    <path d="M 180 205 L 220 205" stroke="#66291a" stroke-width="4" stroke-linecap="round"/>

    <!-- Black T-Shirt -->
    <path d="M 125 235 L 85 300 L 315 300 L 275 235 Z" fill="#18181a"/>

    <!-- Meme Text: Escucho, pero no entiendo -->
    <text x="200" y="325" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="27" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">Escucho, pero</text>
    <text x="200" y="352" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#000000" stroke-width="6" paint-order="stroke fill">no entiendo</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_09_gato_cargando.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-9" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Cat Ears -->
    <polygon points="120,130 90,60 160,100" fill="#665345"/>
    <polygon points="120,120 100,75 150,105" fill="#f0b6ba"/>
    <polygon points="280,130 310,60 240,100" fill="#665345"/>
    <polygon points="280,120 300,75 250,105" fill="#f0b6ba"/>

    <!-- Cat Head (White and Brown/Tabby) -->
    <ellipse cx="200" cy="180" rx="90" ry="85" fill="#ffffff"/>
    <path d="M 120 120 Q 200 135 280 120 Q 250 170 200 140 Q 150 170 120 120 Z" fill="#665345"/>

    <!-- Spinning Loading Rings around Cat Head -->
    <g transform="translate(100, 120) scale(0.6)">
      <circle cx="0" cy="-20" r="4" fill="#ffffff"/>
      <circle cx="14" cy="-14" r="4" fill="#cccccc"/>
      <circle cx="20" cy="0" r="4" fill="#999999"/>
      <circle cx="14" cy="14" r="4" fill="#666666"/>
      <circle cx="0" cy="20" r="4" fill="#333333"/>
      <circle cx="-14" cy="14" r="4" fill="#333333"/>
      <circle cx="-20" cy="0" r="4" fill="#333333"/>
      <circle cx="-14" cy="-14" r="4" fill="#333333"/>
    </g>
    <g transform="translate(300, 120) scale(0.6)">
      <circle cx="0" cy="-20" r="4" fill="#ffffff"/>
      <circle cx="14" cy="-14" r="4" fill="#cccccc"/>
      <circle cx="20" cy="0" r="4" fill="#999999"/>
      <circle cx="14" cy="14" r="4" fill="#666666"/>
      <circle cx="0" cy="20" r="4" fill="#333333"/>
    </g>
    <g transform="translate(200, 80) scale(0.7)">
      <circle cx="0" cy="-20" r="4" fill="#ffffff"/>
      <circle cx="14" cy="-14" r="4" fill="#cccccc"/>
      <circle cx="20" cy="0" r="4" fill="#999999"/>
      <circle cx="14" cy="14" r="4" fill="#666666"/>
      <circle cx="0" cy="20" r="4" fill="#333333"/>
    </g>

    <!-- Blank Round Greenish Yellow Staring Eyes -->
    <ellipse cx="160" cy="175" rx="22" ry="24" fill="#d9e058"/>
    <ellipse cx="160" cy="175" rx="8" ry="20" fill="#141414"/>
    <circle cx="155" cy="168" r="3" fill="#ffffff"/>

    <ellipse cx="240" cy="175" rx="22" ry="24" fill="#d9e058"/>
    <ellipse cx="240" cy="175" rx="8" ry="20" fill="#141414"/>
    <circle cx="235" cy="168" r="3" fill="#ffffff"/>

    <!-- Pink Nose & Cute Blank Cat Mouth -->
    <polygon points="194,205 206,205 200,213" fill="#f09ca5"/>
    <path d="M 188 220 Q 200 226 200 213 Q 200 226 212 220" stroke="#333333" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Whiskers -->
    <path d="M 140 210 L 80 200 M 140 218 L 75 220 M 140 225 L 80 240" stroke="#999999" stroke-width="2.5"/>
    <path d="M 260 210 L 320 200 M 260 218 L 325 220 M 260 225 L 320 240" stroke="#999999" stroke-width="2.5"/>

    <!-- Cat Body -->
    <path d="M 130 255 Q 200 240 270 255 L 290 330 L 110 330 Z" fill="#e8e8e8"/>

    <!-- Meme Text: BUFFERING / CARGANDO... -->
    <text x="200" y="345" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffffff" stroke="#000000" stroke-width="7" paint-order="stroke fill">CARGANDO...</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_10_bebe_riendo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-10" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Baby Soft Hair -->
    <ellipse cx="200" cy="110" rx="70" ry="40" fill="#523924"/>

    <!-- Chubby Baby Face (Lying down tilted) -->
    <ellipse cx="200" cy="165" rx="85" ry="80" fill="#fbd0b9"/>
    
    <!-- Rosy Cheeks -->
    <circle cx="140" cy="180" r="18" fill="#fca5a5" opacity="0.6"/>
    <circle cx="260" cy="180" r="18" fill="#fca5a5" opacity="0.6"/>

    <!-- Happy Squinting Smiling Eyes (Crescents) -->
    <path d="M 145 155 Q 165 140 185 155" stroke="#3b2112" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M 215 155 Q 235 140 255 155" stroke="#3b2112" stroke-width="6" stroke-linecap="round" fill="none"/>

    <!-- Cute Chubby Hand Covering Mouth (Giggling/Snickering) -->
    <g transform="translate(160, 185)">
      <!-- Little Baby Palm & Fingers -->
      <ellipse cx="40" cy="30" rx="35" ry="25" fill="#f8be9e" transform="rotate(-15 40 30)"/>
      <circle cx="20" cy="20" r="9" fill="#f8be9e"/>
      <circle cx="34" cy="14" r="9" fill="#f8be9e"/>
      <circle cx="48" cy="14" r="9" fill="#f8be9e"/>
      <circle cx="62" cy="20" r="9" fill="#f8be9e"/>
      <ellipse cx="50" cy="45" rx="14" ry="20" fill="#f8be9e" transform="rotate(30 50 45)"/>
    </g>

    <!-- Baby White Onesie / Shirt -->
    <path d="M 110 240 L 80 320 L 320 320 L 290 240 Z" fill="#ffffff"/>
    <path d="M 150 255 Q 200 270 250 255" stroke="#e0e0e0" stroke-width="3" fill="none"/>

    <!-- Meme Text: *RISITA PILLA* -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffffff" stroke="#000000" stroke-width="7" paint-order="stroke fill">JEJEJE 🤭</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_11_flanos.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-11" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="caramel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="flan-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 110 50 Q 200 20 290 50 Q 360 90 350 220 Q 360 330 300 355 L 100 355 Q 40 330 50 220 Q 40 90 110 50 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- White Dessert Plate -->
    <ellipse cx="200" cy="250" rx="140" ry="50" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
    <ellipse cx="200" cy="245" rx="120" ry="38" fill="url(#caramel)" opacity="0.8"/>

    <!-- Flan Trapezoid Shape -->
    <path d="M 130 90 L 270 90 L 305 240 L 95 240 Z" fill="url(#flan-body)"/>

    <!-- Caramel Syrup on Top & Dripping -->
    <ellipse cx="200" cy="90" rx="70" ry="25" fill="url(#caramel)"/>
    <!-- Drips -->
    <path d="M 130 90 Q 140 125 150 90 Q 170 140 185 90 Q 210 130 225 90 Q 245 140 260 90" fill="url(#caramel)"/>

    <!-- THANOS FACE CARVED INTO FLAN -->
    <!-- Heavy Brow -->
    <path d="M 145 130 Q 200 120 255 130" stroke="#78350f" stroke-width="7" stroke-linecap="round" fill="none"/>
    <!-- Intense Staring Thanos Eyes -->
    <ellipse cx="170" cy="142" rx="14" ry="10" fill="#ffffff"/>
    <circle cx="170" cy="142" r="6" fill="#4c1d95"/>
    <ellipse cx="230" cy="142" rx="14" ry="10" fill="#ffffff"/>
    <circle cx="230" cy="142" r="6" fill="#4c1d95"/>

    <!-- Thanos Nose -->
    <polygon points="195,150 205,150 200,165" fill="#d97706"/>

    <!-- Stern Mouth -->
    <path d="M 165 180 Q 200 175 235 180" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>

    <!-- Thanos Iconic Grooved / Ribbed Chin -->
    <path d="M 175 195 L 175 230" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
    <path d="M 188 195 L 188 235" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
    <path d="M 200 195 L 200 235" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
    <path d="M 212 195 L 212 235" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
    <path d="M 225 195 L 225 230" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>

    <!-- Meme Text: FLANOS -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="46" fill="#ffffff" stroke="#000000" stroke-width="9" paint-order="stroke fill" letter-spacing="2">FLANOS</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_12_grucero.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-12" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Gru Bald Oval Head (Fisheye distortion) -->
    <ellipse cx="200" cy="150" rx="95" ry="90" fill="#edd0bd"/>

    <!-- Eyebrows with High Arches -->
    <path d="M 135 120 Q 165 95 185 125" stroke="#33241b" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 215 125 Q 235 95 265 120" stroke="#33241b" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Wide Fisheye Staring Eyes -->
    <ellipse cx="160" cy="140" rx="20" ry="16" fill="#ffffff"/>
    <circle cx="160" cy="140" r="8" fill="#427891"/>
    <circle cx="158" cy="138" r="2.5" fill="#ffffff"/>
    <ellipse cx="240" cy="140" rx="20" ry="16" fill="#ffffff"/>
    <circle cx="240" cy="140" r="8" fill="#427891"/>
    <circle cx="238" cy="138" r="2.5" fill="#ffffff"/>

    <!-- Pointy Huge Gru Long Nose -->
    <polygon points="192,135 208,135 200,195" fill="#dfad91"/>

    <!-- Smirking Wide Mouth -->
    <path d="M 145 205 Q 200 230 255 195" stroke="#4a2215" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Striped Scarf & Dark Coat -->
    <path d="M 110 240 L 70 320 L 330 320 L 290 240 Z" fill="#2d3748"/>
    <!-- Scarf Rings -->
    <path d="M 120 235 Q 200 260 280 235 Q 200 275 120 235 Z" fill="#718096"/>
    <path d="M 135 250 Q 200 275 265 250" stroke="#1a202c" stroke-width="8"/>

    <!-- Meme Text: GRUCERO -->
    <text x="200" y="345" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="44" fill="#ffffff" stroke="#000000" stroke-width="9" paint-order="stroke fill" letter-spacing="2">GRUCERO</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_13_quiero_opinar.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-13" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="dog-fur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5cf8e"/>
      <stop offset="100%" stop-color="#d49b4b"/>
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 40 Q 200 10 320 40 Q 370 110 360 240 Q 370 330 310 355 L 90 355 Q 30 330 40 220 Q 30 100 80 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Labrador Ears (Floppy) -->
    <ellipse cx="140" cy="140" rx="30" ry="50" fill="#ba8034" transform="rotate(-15 140 140)"/>
    <ellipse cx="260" cy="140" rx="30" ry="50" fill="#ba8034" transform="rotate(15 260 140)"/>

    <!-- Labrador Head -->
    <ellipse cx="200" cy="150" rx="70" ry="65" fill="url(#dog-fur)"/>

    <!-- Sweet / Polite Looking Dog Eyes -->
    <ellipse cx="170" cy="135" rx="14" ry="12" fill="#2d1a0e"/>
    <circle cx="166" cy="132" r="3.5" fill="#ffffff"/>
    <ellipse cx="230" cy="135" rx="14" ry="12" fill="#2d1a0e"/>
    <circle cx="226" cy="132" r="3.5" fill="#ffffff"/>

    <!-- Muzzle & Black Nose -->
    <ellipse cx="200" cy="165" rx="30" ry="22" fill="#fde68a"/>
    <ellipse cx="200" cy="158" rx="14" ry="9" fill="#171717"/>
    <path d="M 190 175 Q 200 182 200 168 Q 200 182 210 175" stroke="#171717" stroke-width="3" fill="none"/>

    <!-- Raised Paw Reaching Up High (Asking for turn to speak) -->
    <path d="M 80 180 L 100 60 Q 120 40 135 60 L 140 120" stroke="#ffffff" stroke-width="8" fill="none"/>
    <!-- Paw Pad & Claws -->
    <ellipse cx="105" cy="55" rx="22" ry="26" fill="url(#dog-fur)" transform="rotate(-20 105 55)"/>
    <circle cx="95" cy="40" r="6" fill="#ba8034"/>
    <circle cx="107" cy="35" r="6" fill="#ba8034"/>
    <circle cx="120" cy="40" r="6" fill="#ba8034"/>
    <circle cx="107" cy="58" r="10" fill="#523218"/>

    <!-- Dog Body & Desk Table -->
    <path d="M 130 210 L 100 290 L 300 290 L 270 210 Z" fill="url(#dog-fur)"/>
    <!-- Wooden Table Surface -->
    <rect x="60" y="270" width="280" height="25" rx="6" fill="#854d0e" stroke="#58310c" stroke-width="3"/>

    <!-- Meme Text: QUIERO OPINAR -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="38" fill="#ffffff" stroke="#000000" stroke-width="8" paint-order="stroke fill" letter-spacing="1">QUIERO OPINAR</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_14_this_is_fine.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-14" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut Outline -->
    <path d="M 70 30 Q 200 10 330 30 Q 370 110 360 240 Q 370 330 310 360 L 90 360 Q 30 330 40 220 Q 30 90 70 30 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Blazing Fire Background Flames -->
    <path d="M 80 280 Q 60 140 100 80 Q 130 160 160 90 Q 200 180 240 70 Q 270 150 300 80 Q 340 160 320 280 Z" fill="#ea580c"/>
    <path d="M 100 280 Q 90 180 130 130 Q 150 190 180 140 Q 220 200 250 120 Q 280 190 300 280 Z" fill="#facc15"/>

    <!-- Dog Character Sitting -->
    <ellipse cx="180" cy="180" rx="45" ry="40" fill="#d97706"/>
    <ellipse cx="180" cy="225" rx="35" ry="30" fill="#d97706"/>

    <!-- Dog Bowler Hat -->
    <ellipse cx="175" cy="140" rx="30" ry="8" fill="#1e293b"/>
    <rect x="160" y="120" width="30" height="20" rx="4" fill="#1e293b"/>

    <!-- Big Wide Open Calm/Numb Eyes -->
    <circle cx="165" cy="175" r="14" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <circle cx="165" cy="175" r="6" fill="#000000"/>
    <circle cx="195" cy="175" r="14" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <circle cx="195" cy="175" r="6" fill="#000000"/>

    <!-- Calm Tiny Smile & Snout -->
    <ellipse cx="180" cy="195" rx="16" ry="10" fill="#fed7aa"/>
    <circle cx="180" cy="190" r="4" fill="#000000"/>
    <path d="M 172 200 Q 180 205 188 200" stroke="#000000" stroke-width="2" fill="none"/>

    <!-- Table and White Coffee Mug -->
    <ellipse cx="230" cy="245" rx="55" ry="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="220" y="215" width="22" height="25" rx="3" fill="#ffffff" stroke="#64748b" stroke-width="2"/>
    <!-- Steam from Coffee -->
    <path d="M 226 205 Q 230 195 226 190" stroke="#94a3b8" stroke-width="2" fill="none"/>
    <path d="M 234 205 Q 238 195 234 190" stroke="#94a3b8" stroke-width="2" fill="none"/>

    <!-- Speech Bubble: THIS IS FINE -->
    <ellipse cx="270" cy="120" rx="60" ry="32" fill="#ffffff" stroke="#000000" stroke-width="4"/>
    <polygon points="235,140 215,160 245,148" fill="#ffffff"/>
    <polygon points="235,140 215,160 245,148" stroke="#000000" stroke-width="3" fill="none"/>
    <text x="270" y="120" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="18" fill="#000000">THIS IS</text>
    <text x="270" y="140" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="18" fill="#000000">FINE</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_15_gato_gritando.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-15" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- White Cat Ears Pinched Back (Distress) -->
    <polygon points="120,110 70,60 140,80" fill="#f8fafc"/>
    <polygon points="115,100 85,70 130,85" fill="#fda4af"/>
    <polygon points="280,110 330,60 260,80" fill="#f8fafc"/>
    <polygon points="285,100 315,70 270,85" fill="#fda4af"/>

    <!-- White Kitten Head -->
    <ellipse cx="200" cy="160" rx="85" ry="80" fill="#ffffff"/>

    <!-- Crying Watery Black Eyes Filled with Tears -->
    <ellipse cx="150" cy="140" rx="24" ry="26" fill="#0f172a"/>
    <circle cx="142" cy="132" r="8" fill="#ffffff"/>
    <circle cx="158" cy="148" r="4" fill="#ffffff"/>
    <path d="M 135 160 Q 125 190 130 220" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none"/>

    <ellipse cx="250" cy="140" rx="24" ry="26" fill="#0f172a"/>
    <circle cx="242" cy="132" r="8" fill="#ffffff"/>
    <circle cx="258" cy="148" r="4" fill="#ffffff"/>
    <path d="M 265 160 Q 275 190 270 220" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Tiny Pink Nose -->
    <polygon points="194,168 206,168 200,176" fill="#fb7185"/>

    <!-- HUGE WIDE OPEN SCREAMING MOUTH -->
    <path d="M 140 185 Q 200 170 260 185 Q 280 270 200 275 Q 120 270 140 185 Z" fill="#881337"/>
    <!-- Tongue and Fangs -->
    <polygon points="150,185 158,198 166,185" fill="#ffffff"/>
    <polygon points="234,185 242,198 250,185" fill="#ffffff"/>
    <ellipse cx="200" cy="245" rx="30" ry="18" fill="#f43f5e"/>

    <!-- Whiskers -->
    <path d="M 120 180 L 60 170 M 120 190 L 55 195" stroke="#cbd5e1" stroke-width="3"/>
    <path d="M 280 180 L 340 170 M 280 190 L 345 195" stroke="#cbd5e1" stroke-width="3"/>

    <!-- Meme Text: AAAAAAAAH! -->
    <text x="200" y="340" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="40" fill="#ffffff" stroke="#000000" stroke-width="9" paint-order="stroke fill" letter-spacing="2">AAAAAH! 😭</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_16_gato_pulgar_arriba.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-16" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 80 40 Q 200 10 320 40 Q 370 110 360 240 Q 370 330 310 355 L 90 355 Q 30 330 40 220 Q 30 100 80 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Cat Ears -->
    <polygon points="140,110 110,50 170,80" fill="#713f12"/>
    <polygon points="260,110 290,50 230,80" fill="#713f12"/>

    <!-- Cat Head (Calico / Tabby & White) -->
    <ellipse cx="200" cy="160" rx="85" ry="75" fill="#ffffff"/>
    <path d="M 130 110 Q 200 120 270 110 L 250 150 L 150 150 Z" fill="#854d0e"/>

    <!-- Big Teary Crying Eyes (The Crying Cat Meme) -->
    <ellipse cx="160" cy="145" rx="24" ry="22" fill="#1e293b"/>
    <circle cx="152" cy="138" r="8" fill="#ffffff"/>
    <circle cx="168" cy="152" r="4" fill="#ffffff"/>
    <!-- Glossy crying tears reflection -->
    <ellipse cx="160" cy="155" rx="14" ry="6" fill="#38bdf8" opacity="0.6"/>

    <ellipse cx="240" cy="145" rx="24" ry="22" fill="#1e293b"/>
    <circle cx="232" cy="138" r="8" fill="#ffffff"/>
    <circle cx="248" cy="152" r="4" fill="#ffffff"/>
    <ellipse cx="240" cy="155" rx="14" ry="6" fill="#38bdf8" opacity="0.6"/>

    <!-- Sad Cat Mouth with Tears -->
    <polygon points="195,170 205,170 200,178" fill="#f43f5e"/>
    <path d="M 188 185 Q 200 178 212 185" stroke="#475569" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- PAW / HAND GIVING THUMBS UP 👍 (With Blue Hologram Neon Outline) -->
    <g transform="translate(60, 180)">
      <!-- Blue Neon Glow Behind Hand -->
      <path d="M 30 50 L 50 10 Q 65 0 75 15 L 75 40 L 95 40 Q 105 40 100 55 L 75 85 L 20 85 Z" fill="#2563eb" stroke="#38bdf8" stroke-width="8" stroke-linejoin="round"/>
      <!-- Thumbs Up Hand -->
      <path d="M 30 50 L 50 10 Q 65 0 75 15 L 75 40 L 95 40 Q 105 40 100 55 L 75 85 L 20 85 Z" fill="#f8fafc"/>
      <ellipse cx="65" cy="20" rx="10" ry="16" fill="#f1f5f9"/>
    </g>

    <!-- Meme Text: TODO BIEN 👍 -->
    <text x="230" y="325" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="34" fill="#ffffff" stroke="#000000" stroke-width="8" paint-order="stroke fill">TODO BIEN</text>
    <text x="230" y="352" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="26" fill="#38bdf8" stroke="#000000" stroke-width="6" paint-order="stroke fill">(LLORANDO)</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_17_gato_juzgon.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-17" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 90 40 Q 200 10 310 40 Q 370 120 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 100 90 40 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- Flattened / Smug Ears -->
    <polygon points="120,110 70,70 140,85" fill="#475569"/>
    <polygon points="280,110 330,70 260,85" fill="#475569"/>

    <!-- Cat Head (White and Dark Tabby Cap) -->
    <ellipse cx="200" cy="165" rx="90" ry="85" fill="#ffffff"/>
    <path d="M 120 110 Q 200 130 280 110 Q 260 160 200 135 Q 140 160 120 110 Z" fill="#334155"/>

    <!-- Extremely Squinted Smug Sarcastic Eyes (Judging you) -->
    <!-- Left Eye: Narrow Slit -->
    <path d="M 140 152 Q 165 142 185 156" stroke="#0f172a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <ellipse cx="162" cy="154" rx="12" ry="4" fill="#84cc16"/>
    <circle cx="162" cy="154" r="3" fill="#000000"/>

    <!-- Right Eye: Narrow Slit -->
    <path d="M 215 156 Q 235 142 260 152" stroke="#0f172a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <ellipse cx="238" cy="154" rx="12" ry="4" fill="#84cc16"/>
    <circle cx="238" cy="154" r="3" fill="#000000"/>

    <!-- Pink Nose -->
    <polygon points="194,175 206,175 200,183" fill="#f472b6"/>

    <!-- Smug / Judgmental Lip Line -->
    <path d="M 180 198 Q 200 205 220 195" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Whiskers -->
    <path d="M 130 185 L 60 180 M 130 195 L 65 205" stroke="#94a3b8" stroke-width="2.5"/>
    <path d="M 270 185 L 340 180 M 270 195 L 335 205" stroke="#94a3b8" stroke-width="2.5"/>

    <!-- Meme Text: TE ESTOY JUZGANDO -->
    <text x="200" y="325" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#000000" stroke-width="7" paint-order="stroke fill">TE ESTOY</text>
    <text x="200" y="352" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="30" fill="#ffffff" stroke="#000000" stroke-width="7" paint-order="stroke fill">JUZGANDO 😒</text>
  </g>
</svg>`
  },
  {
    filename: 'sticker_18_gatos_albaniles.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow-18" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow)">
    <!-- White Die-Cut -->
    <path d="M 70 30 Q 200 10 330 30 Q 370 110 360 250 Q 370 340 310 360 L 90 360 Q 30 340 40 230 Q 30 90 70 30 Z" fill="#ffffff" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
    
    <!-- White Cat on Left (with Wheelbarrow) -->
    <!-- Yellow Hard Hat -->
    <path d="M 95 100 Q 135 60 175 100 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
    <ellipse cx="135" cy="100" rx="45" ry="8" fill="#eab308"/>
    <!-- White Cat Body Standing Up -->
    <ellipse cx="140" cy="160" rx="35" ry="50" fill="#ffffff"/>
    <circle cx="135" cy="125" r="22" fill="#ffffff"/>
    <!-- Cat Face -->
    <circle cx="125" cy="120" r="3" fill="#1e293b"/>
    <circle cx="145" cy="120" r="3" fill="#1e293b"/>
    <polygon points="133,125 137,125 135,128" fill="#f472b6"/>
    <!-- Holding Wheelbarrow Handle -->
    <path d="M 120 160 L 70 170" stroke="#334155" stroke-width="6" stroke-linecap="round"/>

    <!-- Black Construction Wheelbarrow with Wet Cement -->
    <polygon points="30,170 110,170 95,240 45,240" fill="#334155"/>
    <!-- Wheel -->
    <circle cx="40" cy="260" r="16" fill="#0f172a"/>
    <circle cx="40" cy="260" r="6" fill="#94a3b8"/>
    <!-- Pile of Grey Cement -->
    <ellipse cx="70" cy="170" rx="35" ry="12" fill="#64748b"/>

    <!-- Orange Cat on Right (with Shovel) -->
    <!-- Orange Hard Hat -->
    <path d="M 235 100 Q 275 60 315 100 Z" fill="#ea580c" stroke="#c2410c" stroke-width="3"/>
    <ellipse cx="275" cy="100" rx="45" ry="8" fill="#f97316"/>
    <!-- Orange Cat Body Standing Up -->
    <ellipse cx="270" cy="165" rx="35" ry="50" fill="#f97316"/>
    <circle cx="270" cy="125" r="22" fill="#f97316"/>
    <!-- Cat Face -->
    <circle cx="260" cy="120" r="3" fill="#1e293b"/>
    <circle cx="280" cy="120" r="3" fill="#1e293b"/>
    <polygon points="268,125 272,125 270,128" fill="#f472b6"/>

    <!-- Shovel in Paws Paleando Cemento -->
    <path d="M 260 150 L 220 260" stroke="#78350f" stroke-width="8" stroke-linecap="round"/>
    <path d="M 200 250 L 240 250 L 220 285 Z" fill="#64748b"/>

    <!-- Ground Mound of Wet Concrete -->
    <ellipse cx="200" cy="285" rx="65" ry="25" fill="#475569"/>
    <ellipse cx="200" cy="280" rx="50" ry="18" fill="#64748b"/>

    <!-- Meme Text: TRABAJANDO DURO -->
    <text x="200" y="335" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#000000" stroke-width="7" paint-order="stroke fill">CHAMBEANDO 👷‍♂️🐾</text>
  </g>
</svg>`
  }
];

stickers.forEach((s) => {
  const filePath = path.join(outputDir, s.filename);
  fs.writeFileSync(filePath, s.svg.trim(), 'utf8');
  console.log('Created:', s.filename);
});

console.log('All 18 stickers created successfully!');
