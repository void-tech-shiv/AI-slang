# AI Slang Translator — Phase 1 MVP

AI Slang is a local-first Indian slang translation MVP. The first milestone proves the core flow:

**Hindi/Hinglish message → FastAPI → context-aware slang translation → natural Telugu output**

## Phase 1 includes

- Next.js 16.4 frontend
- Responsive translation UI
- FastAPI backend
- `/translate` endpoint
- OpenAI Responses API integration
- Automatic demo fallback when no API key is configured
- Tone + regional style controls
- Starter slang dataset
- Health endpoint
- CORS configured for local development

## Project structure

```text
AI-slang/
├── frontend/
├── backend/
├── docs/
├── .gitignore
└── README.md
```

## 1. Run the backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Add your OpenAI API key to `backend/.env` if you want real AI translation. Without a key, the backend runs in demo mode with starter slang mappings.

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## 2. Run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional frontend env:

```bash
cp .env.example .env.local
```

## API example

`POST /translate`

```json
{
  "text": "Bhai kya scene hai?",
  "source_language": "Hinglish",
  "target_language": "Telugu",
  "region": "Vijayawada",
  "tone": "slang"
}
```

Response shape:

```json
{
  "original": "Bhai kya scene hai?",
  "translated": "Em scene ra?",
  "emotion": "casual",
  "provider": "openai"
}
```

## Phase roadmap

- **Phase 1:** translator MVP ✅
- **Phase 2:** real-time 1-to-1 chat with per-receiver translation ✅
- **Phase 3:** users, auth, chat history, preferences
- **Phase 4:** voice translation
- **Phase 5:** couple mode, gaming mode, regional slang packs
- **Phase 6:** Android app using the same backend

## Phase 2 real-time demo

Open `http://localhost:3000/chat` in two tabs. Join the same room with different language/region preferences. Messages are translated independently for each receiver.

## Security

Never commit `.env`, API keys, or secrets. The browser talks to the FastAPI backend; the OpenAI API key stays server-side.
