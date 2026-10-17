# AI Slang — Translate like locals talk

AI Slang is a multilingual Indian conversation app focused on **natural slang, emotion and regional tone**, not textbook translation.

Example:

> `Bhai kya scene hai?` → `Em scene ra?`

The repository now contains a Next.js web app, FastAPI backend and an Expo/React Native Android client.

## What is implemented

### Phase 1 — Translator MVP ✅
- Next.js + Tailwind translator UI
- FastAPI `/translate`
- OpenAI Responses API integration
- Demo fallback when no API key is configured
- Hindi / Hinglish / Telugu / English options
- Tone + regional style controls
- Starter slang dataset

### Phase 2 — Real-time translated chat ✅
- FastAPI WebSockets
- Room-based real-time chat
- Per-receiver language, region and tone
- Original + localized message display
- Presence events

### Phase 3 — Accounts + persistence ✅
- Register/login with JWT
- Argon2 password hashing
- User translation preferences
- MongoDB persistence with async PyMongo
- In-memory fallback for zero-setup development
- Chat history endpoint

### Phase 4 — Voice translation ✅
- Browser microphone recording
- OpenAI speech-to-text endpoint
- Slang translation after transcription
- Browser speech synthesis playback

### Phase 5 — Context + special modes ✅
- Recent conversation context passed to translation
- Couple Mode
- Gaming Mode
- Meme Mode
- Regional slang hints for Vijayawada, Hyderabad, Delhi and Mumbai

### Phase 6 — Android app source ✅
- Expo / React Native mobile client
- Same FastAPI backend
- Target-language, regional, tone and conversation-mode selectors
- APK build profile with EAS

## Repository structure

```text
AI-slang/
├── backend/        # FastAPI, AI, auth, MongoDB, WebSockets, voice
├── frontend/       # Next.js web app
├── mobile/         # Expo / React Native Android client
├── docs/           # starter slang dataset
├── .gitignore
└── README.md
```

## Run backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure `backend/.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
FRONTEND_ORIGIN=http://localhost:3000
MONGODB_URI=
MONGODB_DB=ai_slang
JWT_SECRET=replace-with-a-long-random-secret
```

`MONGODB_URI` can stay empty for local in-memory development.

Start backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## Run web app

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell copy command:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

Useful routes:
- `/` translator
- `/chat` real-time translated chat
- `/account` account + language preferences
- `/voice` voice translation

## Run Android app

```bash
cd mobile
npm install
cp .env.example .env
```

For a physical Android phone, set `EXPO_PUBLIC_API_URL` to the laptop's LAN IP, not `localhost`.

Development build:

```bash
npx expo run:android
```

Installable APK through EAS:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The `preview` EAS profile builds an `.apk`. Expo login/signing credentials are required for the cloud build.

## API example

`POST /translate`

```json
{
  "text": "Bhai kal class bunk kare?",
  "source_language": "Hinglish",
  "target_language": "Telugu",
  "region": "Vijayawada",
  "tone": "slang",
  "mode": "standard",
  "context": []
}
```

## Security

- Never commit `.env`, API keys, JWT secrets or database credentials.
- OpenAI calls happen on the FastAPI server, not directly from browser/mobile code.
- Production should use a strong `JWT_SECRET`, HTTPS/WSS, restrictive CORS and persistent MongoDB.

## Next production milestones

The foundation is complete. The next work should be production deployment, mobile real-time chat/voice UI, push notifications, stronger room authorization, moderation/rate limiting, tests and slang-dataset expansion.
