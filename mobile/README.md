# AI Slang Android app

Phase 6 adds a React Native / Expo Android client that uses the same FastAPI `/translate` endpoint as the web app.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

On a physical phone, change `EXPO_PUBLIC_API_URL` to your laptop's LAN address, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

For the Android emulator, the built-in fallback is `http://10.0.2.2:8000`.

## Development build

This project targets Expo SDK 58. Use a development build for SDK 58 testing:

```bash
npx expo run:android
```

## Build an installable APK with EAS

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The `preview` profile in `eas.json` uses `android.buildType = apk`. EAS needs your Expo account and Android signing credentials.

## Current mobile features

- Natural slang translation
- Auto source-language mode
- Hindi / Hinglish / Telugu / English target choices
- Vijayawada / Hyderabad / Delhi / Mumbai / General regional modes
- Slang, casual, Gen-Z, funny, romantic, aggressive tones
- Standard, Couple, Gaming, Meme modes
- Emotion + original message display
- Same FastAPI backend as the web app

Next mobile additions can reuse the existing backend WebSocket chat and voice endpoints.
