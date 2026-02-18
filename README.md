# Fitracker (React + TypeScript + Netlify + Railway MongoDB)

A responsive exercise/food progress tracker with:
- Manual date/time logging.
- Food, exercise, whey grams, creatine grams inputs.
- Image upload (stored as base64 in MongoDB).
- Calendar-based daily review.
- Bar chart showing food vs exercise log activity.
- PDF export in day-by-day format.

## Tech stack
- React + TypeScript (Vite)
- Netlify Functions backend
- MongoDB on Railway

## 1) Configure environment variables

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Set your Railway Mongo string:

```env
MONGODB_URI=mongodb://mongo:<PASSWORD>@shortline.proxy.rlwy.net:56142
MONGODB_DB_NAME=fitracker
```

> Keep credentials in environment variables only (easy to rotate API/DB keys later).

## 2) Install and run locally

```bash
npm install
npm run dev
```

For Netlify local function simulation use:

```bash
npx netlify dev
```

## 3) Deploy

### Frontend on Netlify
- Connect this repo.
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Add `MONGODB_URI` and `MONGODB_DB_NAME` in Netlify environment variables.

### MongoDB on Railway
Use your existing Railway MongoDB service and provide the public/private URI via env vars.

## PDF output format
Each record is exported like:

```text
DATE: MM/DD/YYYY
DAY N
FOOD
EXERCISE
IMAGE
WHEY GRAMS
CREATINE GRAMS
---
```

## Important UI detail
"Upload Progress" is intentionally placed below food, exercise, and image fields as requested.
