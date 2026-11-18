# 🦇 Hauntly - Spooky Social Messaging

> *Where spirits converse in the shadows, fortified by Supabase and wrapped in a premium dark gothic aesthetic.*

Hauntly is a nocturnal social messaging web application crafted with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and the official **Supabase** JavaScript client.

---

## 🔮 Features

- **Premium Dark Gothic Design**: Obsidian `#07040c` backgrounds, deep violet velvet accents, ethereal glowing borders, spectral particle animations, and clean typography.
- **Official Supabase Client**: Zero-mock, production-ready integration with `@supabase/supabase-js`.
- **Email & Password Authentication**: Full sign up and sign in rituals with password strength indicators ("Faint Spirit" to "Ancient Sovereign") and email confirmation notices.
- **Sign In with Google (OAuth)**: Native Supabase OAuth redirection flow with offline consent.
- **Sign In with Apple (OAuth)**: Native Supabase Apple OAuth integration.
- **Auth Callback & Session Handling**: Dynamic `/auth/callback` page that seamlessly verifies tokens, handles error redirects, and preserves active sessions in `localStorage`.
- **Protected Dashboard**: Guards private routes, auto-redirecting unauthenticated wanderers, displaying session status, soul metadata, and real-time JWT indicators.
- **Interactive Messaging Preview**: "The Crypt", "Midnight Séance", and "Eerie Whispers" channels with live spectral transmission testing.
- **Built-in Diagnostics & Setup Portal**: Live conduit checker, redirect URL copy utilities, and step-by-step OAuth configuration instructions.

---

## ⚡ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Backend & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)

---

## 📁 Project Architecture

```
Hauntly/
├── .env.example                # Safe environment variable template
├── .env                        # Local development variables (git-ignored)
├── .gitignore                  # Git ignore rules protecting keys & secrets
├── public/
│   └── favicon.svg             # Glowing violet gothic skull icon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx            # Gothic login form
│   │   │   ├── SignupForm.tsx           # Gothic signup form with rune fortifier
│   │   │   ├── SocialAuthButtons.tsx    # Google and Apple OAuth trigger buttons
│   │   │   └── ProtectedRoute.tsx       # Route guard with ethereal veil spinner
│   │   ├── dashboard/
│   │   │   ├── GothicChatPreview.tsx    # Core messaging sandbox
│   │   │   ├── OAuthSetupGuide.tsx      # In-app interactive provider guide
│   │   │   ├── SupabaseDiagnostics.tsx  # Auth health & redirect helper
│   │   │   └── UserProfileCard.tsx      # Soul identity & session card
│   │   ├── layout/
│   │   │   ├── Navbar.tsx               # Top navigation with gothic branding
│   │   │   └── Footer.tsx               # Atmospheric nocturnal footer
│   │   └── ui/
│   │       ├── GothicBadge.tsx          # Arcane glowing status badges
│   │       ├── GothicButton.tsx         # Violet glow buttons with variants
│   │       ├── GothicCard.tsx           # Obsidian frosted glass cards
│   │       ├── GothicInput.tsx          # Gothic form inputs with glow focus
│   │       └── MysticalBackground.tsx   # Ambient mist and radial purple glows
│   ├── contexts/
│   │   └── AuthContext.tsx              # Supabase session provider & listener
│   ├── lib/
│   │   └── supabase.ts                  # Official Supabase client singleton
│   ├── pages/
│   │   ├── LandingPage.tsx              # Sanctuary landing page
│   │   ├── LoginPage.tsx                # Crypt entrance
│   │   ├── SignupPage.tsx               # Soul inscription
│   │   ├── AuthCallbackPage.tsx         # OAuth token exchange & error catcher
│   │   └── DashboardPage.tsx            # The Coven Chamber (Protected)
│   ├── types/
│   │   └── auth.ts                      # Supabase auth TypeScript definitions
│   ├── App.tsx                          # App routing & provider shell
│   ├── index.css                        # Gothic animations, fonts & scrollbars
│   └── main.tsx                         # Entry point
└── vite.config.ts                       # Vite configuration
```

---

## 🔒 Security Best Practices

> [!IMPORTANT]
> **Zero Frontend Secrets**:
> - Only the **Supabase URL** and **Anon/Publishable Key** belong in `.env` (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
> - **NEVER** expose your Supabase `service_role` key in frontend code.
> - **NEVER** place Google Client Secrets or Apple Private Keys (`.p8`) into frontend environment files.
> - All OAuth Provider Secrets must strictly be configured inside your **Supabase Dashboard**.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Hauntly
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials from your [Supabase Project API Settings](https://supabase.com/dashboard/project/_/settings/api):
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Launch the Application
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## 🗝️ OAuth Provider Setup Guide

### 1. Configure Supabase Redirect URLs
1. In your **[Supabase Dashboard](https://supabase.com/)**, go to **Authentication &rarr; URL Configuration**.
2. Set **Site URL** to:
   ```
   http://localhost:5173
   ```
3. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/auth/callback
   ```
   *(For production, also add `https://your-domain.com/auth/callback`)*.

---

### 2. Google OAuth Configuration
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**.
2. Select or create your project &rarr; **APIs & Services &rarr; Credentials**.
3. Click **Create Credentials &rarr; OAuth client ID**.
4. Select **Web application**.
5. Under **Authorized redirect URIs**, enter your Supabase OAuth callback URL:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
6. Click **Create**, then copy your **Client ID** and **Client Secret**.
7. In **[Supabase Dashboard](https://supabase.com/) &rarr; Authentication &rarr; Providers &rarr; Google**:
   - Toggle **Enable Google provider** to **ON**.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

---

### 3. Apple OAuth Configuration
1. Go to **[Apple Developer Account](https://developer.apple.com/account/resources/identifiers/list)**.
2. **Register an App ID** (or select your existing primary App ID).
3. **Register a Services ID**:
   - Enable **Sign in with Apple**.
   - Click **Configure** next to Sign in with Apple.
   - Set **Primary App ID**.
   - Under **Domains and Subdomains**, enter: `<your-project-ref>.supabase.co`.
   - Under **Return URLs**, enter:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. **Generate a Private Key**:
   - Go to **Keys &rarr; Create a Key** with **Sign in with Apple** enabled.
   - Download the `.p8` key file. Note your **Key ID** and **Team ID**.
5. In **[Supabase Dashboard](https://supabase.com/) &rarr; Authentication &rarr; Providers &rarr; Apple**:
   - Toggle **Enable Apple provider** to **ON**.
   - Enter your **Services ID** (e.g. `com.hauntly.app.web`).
   - Paste the contents of your downloaded `.p8` file into **Secret Key**.
   - Enter your **Key ID** and **Team ID**.
   - Click **Save**.

---

## 🛠️ Testing the Authentication Flow

1. **Email / Password**:
   - Navigate to `/signup` and register a test account.
   - Notice the gothic rune fortitude indicator.
   - If Supabase email confirmation is enabled in your project, verify via the emailed link or test with an auto-confirmed user.
2. **Google OAuth**:
   - Click **Continue with Google** on `/login` or `/signup`.
   - Supabase redirects to Google consent &rarr; redirects to `/auth/callback` &rarr; sets session and opens `/dashboard`.
3. **Apple OAuth**:
   - Click **Continue with Apple** on `/login` or `/signup`.
   - Apple sign in modal &rarr; redirects to `/auth/callback` &rarr; opens `/dashboard`.
4. **Session Persistence**:
   - Refresh the page while logged into `/dashboard`. The session automatically restores via localStorage and Supabase JWT refresh.
5. **Protected Route Guard**:
   - Attempt to access `/dashboard` when logged out; you will be seamlessly redirected to `/login`.
6. **Sign Out**:
   - Click **Extinguish Session** in the dashboard or **Depart** in the navbar to clear the Supabase session.
