# 🦇 Hauntly — Ethereal Whispers & 3D Celestial Coven

<div align="center">

[![Live App](https://img.shields.io/badge/🔮_Enter_the_Crypt-hauntly--eight.vercel.app-9333ea?style=for-the-badge&logo=vercel&logoColor=white)](https://hauntly-eight.vercel.app/login)
[![Watch Demo](https://img.shields.io/badge/▶️_Watch_Demo-YouTube-red?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/R1wulqck6Q8?si=J9hIICmrX_XGkWod)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_&_RLS-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-Spectral_AI-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

*Where nocturnal spirits converse in the shadows, traverse a 3D midnight Earth, and commune through Google Gemini AI.*

**[🔮 Try Hauntly Live](https://hauntly-eight.vercel.app/login)** • **[🎬 Video Demo](https://youtu.be/R1wulqck6Q8?si=J9hIICmrX_XGkWod)** • **[⚡ Quick Summon](#-quick-summon)**

</div>

---

## 🎬 Video Demonstration

Watch Hauntly in action — exploring the 3D midnight globe, summoning companions by Hauntly ID, and channeling spectral Gemini AI:

<div align="center">

[![Hauntly Video Demo](https://img.youtube.com/vi/R1wulqck6Q8/maxresdefault.jpg)](https://youtu.be/R1wulqck6Q8?si=J9hIICmrX_XGkWod "Hauntly - Click to Watch on YouTube")

**[▶️ Click here to watch the full demonstration on YouTube](https://youtu.be/R1wulqck6Q8?si=J9hIICmrX_XGkWod)**

</div>

---

## 🔮 Live Portal

Step through the veil directly in your browser:

🔗 **[https://hauntly-eight.vercel.app/login](https://hauntly-eight.vercel.app/login)**

- **Instant Entry**: Sign in with any account or create your spirit persona in seconds.
- **Direct Whispers**: Search any spirit by `@username` or `#HAUNT-ID` and start whispering instantly.
- **3D Midnight Earth**: Pin your coordinates and locate coven sanctuaries across the globe.

---

## 🌌 Spectral Features

### 🌍 3D Midnight Earth & Sanctuaries
- **Deep Space Starfield**: A pure nocturnal void blanketed with twinkling pinpoint stars.
- **Obsidian Earth Surface**: Pitch-black oceans, charcoal landmasses, and delicate glowing borders.
- **Coven Sanctuaries & GPS Pins**: Pinpoint active spirits and ancient haunted landmarks (Bran Castle, Salem Witch House, Paris Catacombs).
- **Gothic Celestial Compass**: Real-time rotating celestial rose with single-click reset to North.

### 💬 Direct Whispers & Coven Circles
- **Instant 1-on-1 Whispers**: No friend-request gatekeeping. Find any companion by `@username` or unique `#HAUNT-ID` (e.g. `#HAUNT-VAMP7`, `#HAUNT-8X29K`) and whisper immediately.
- **Symmetric Encryption & Alignment**: Your whispers glow violet on the right; companion echoes arrive on the left in real time.
- **Coven Group Circles**: Multi-member rooms with real-time emoji reactions, typing indicators, and presence.
- **Realtime Mesh**: Dual-engine architecture combining Supabase Realtime channels with instant local `BroadcastChannel` synchronization.

### 🔮 Google Gemini Spectral AI
- **Context Ritual Menu**: Right-click or long-press any transmission to summon spectral AI tools:
  - **Spectral Translation**: Decipher into 10 world languages or authentic *Gothic Spectral Dialect*.
  - **Message Summarisation**: Condenses sprawling incantations into occult bullet points.
  - **Ghost Rewrite**: Transmutes mundane text into *Gothic Horror*, *Vampire Lord*, or *Macabre Rhymes*.
  - **Smart Quick Replies**: Contextual responses crafted to keep the midnight dialogue flowing.

### 🛡️ Hardened Supabase Architecture
- **Row Level Security (RLS)**: Conversations and messages are strictly sealed — only verified participants can read or transmit.
- **Canonical Deduplication**: Unique database indexing guarantees zero duplicate conversation threads.
- **Offline Resilient**: Seamless localStorage failover guarantees full functionality anywhere, anytime.

---

## ⚡ Tech Stack

| Realm | Artifact | Purpose |
|---|---|---|
| **Core** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | Ultra-responsive component architecture & lightning HMR |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type contracts across real-time conduits |
| **Aesthetic** | [Tailwind CSS v4](https://tailwindcss.com/) | Ethereal violet & obsidian nocturnal design system |
| **Backend & Auth** | [Supabase](https://supabase.com/) | Realtime PostgreSQL, Auth, and strict Row Level Security |
| **3D Planetary Engine** | [MapLibre GL JS](https://maplibre.org/) | Deep-space 3D spherical Earth projection |
| **Spectral AI** | [Google Gemini API](https://ai.google.dev/) | `gemini-1.5-flash` contextual translation & text generation |

---

## ⚡ Quick Summon

### 1. Clone & Inscribe
```bash
git clone https://github.com/anurag/Hauntly.git
cd Hauntly
npm install
```

### 2. Configure Environment (Optional)
Copy [.env.example](.env.example) to `.env`:
```bash
cp .env.example .env
```
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-key # Or enter directly in-app
```
*(Hauntly includes automatic offline fallback — runs instantly out-of-the-box even without cloud keys!)*

### 3. Awaken the Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** to enter the realm.

---

## 🧪 Verification & Tests

```bash
# Direct messaging, whisper delivery & canonical keys (29/29 passed)
npx tsx scripts/test-direct-messaging-flow.ts

# Google Gemini AI translation & ghost rewrite (20/20 passed)
npm run test:gemini

# 3D Earth Globe services & sanctuary coordinates (7/7 passed)
npm run test:globe
```

---

<div align="center">

**[🔮 Enter Hauntly Live](https://hauntly-eight.vercel.app/login)** • **[🎬 Watch Video Demo](https://youtu.be/R1wulqck6Q8?si=J9hIICmrX_XGkWod)**

*Crafted with nocturnal passion for spirits conversing across the globe. 🕯️*

</div>
