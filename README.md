# Dots & Lines Multiplayer

This is a multiplayer Dots & Lines game that runs as a static site and uses
Supabase Realtime to sync moves between players. You can deploy it directly to
Netlify.

## Features

- Room codes for easy multiplayer sessions.
- Adjustable board size (default 10x10, up to 20x20).
- Up to 10 players with turn order and scoring.
- Customizable player names and live scoreboard.

## Configure Supabase

1. Create a Supabase project.
2. Enable Realtime for the project.
3. Copy your project URL and anon key.
4. Update `config.js` with your credentials.

> **Tip:** For production, consider turning on Row Level Security and limiting
> Realtime channels. This demo uses broadcast + presence only.

## Run locally

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy to Netlify

1. Push this repo to GitHub.
2. Create a new Netlify site and connect the repo.
3. Set the publish directory to the root (`/`).
4. Deploy.
