<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Sketch to Color

A Vite/React app that converts uploaded sketches or images into printable coloring-page variations using Gemini image generation.

Demo URL: https://tgdscott.github.io/coloring-pages/

View the original AI Studio app: https://ai.studio/apps/3ea30f14-cb44-452b-839d-e720fa876755

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Optional: set `GEMINI_API_KEY` in `.env.local` for local generation.
3. Run the app:
   `npm run dev`

For GitHub Pages demos, the preview screen includes a Gemini key field that saves only in the visitor's browser.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy.yml`. It builds the Vite app and deploys `dist` to GitHub Pages whenever `main` changes.

For the public project URL `https://tgdscott.github.io/coloring-pages/`, the production Vite base path is configured as `/coloring-pages/`.

### One-time GitHub setting

In the repository, go to **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. After that, pushes to `main` should deploy automatically.
