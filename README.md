# 🌴🔥 Fortnite Survivor

A drinking-game tracker for you and 3 friends, built to run as a free static site on GitHub Pages.

## How the game works (as built)

- Play a round of Fortnite. Whatever kills you get is how many **drinks** you get to hand out at the end of the round, to anyone you want.
- Each drink = **1 vote** against the person who gets it. They have until the next round starts to finish it.
- Everyone has **3 secret missions** each round, visible only on their own screen. Pull one off mid-match and you can instantly slip **3 votes** onto whoever you choose, no kills required — it's a sneaky shortcut, separate from your normal kill drinks.
- You pick how the whole thing ends in Setup: a set number of games, first to a number of wins, a time limit, or "until someone taps out" (manual end).
- When the game ends, whoever has the **most total votes** loses and takes the punishment.

If you want any of that to work differently once you actually play it (e.g. missions giving 3 *kills* instead of 3 direct votes), it's a small change in `assets/store.js` — see the `completeMission` function.

## Pages

- `setup.html` — squad names + how the game ends. Starting a game here resets votes, wins, and deals fresh missions.
- `index.html` — the shared dashboard: four tiki torches (taller flame = more votes against that player), round status, and the close-round / end-game controls.
- `player.html?id=1` through `?id=4` — each player's private screen: their secret missions, kill entry, drink distribution, and their own "drinks I still owe" checklist. Bookmark your own link on your phone.

## Step 1 — Put it on GitHub Pages

1. Create a new GitHub repo (e.g. `fortnite-survivor`).
2. Upload everything in this folder to the repo (keep the folder structure: `assets/`, `apps-script/`, the `.html` files).
3. In the repo, go to **Settings → Pages**, set **Source** to your main branch, root folder. Save.
4. GitHub gives you a URL like `https://yourname.github.io/fortnite-survivor/`. That's your site.
5. Send each friend their own link: `.../player.html?id=1`, `?id=2`, `?id=3`, `?id=4`.

## Step 2 — Connect it to a Google Sheet (so everyone's screen updates live)

Without this step, the site still works, but only on one browser/device at a time (it just uses local storage) — fine for testing, not for four phones at once.

1. Open **apps-script/Code.gs** in this project.
2. Go to [sheets.google.com](https://sheets.google.com) → create a new blank spreadsheet.
3. In the sheet, **Extensions → Apps Script**, delete the placeholder code, paste in the contents of `Code.gs`.
4. **Deploy → New deployment → Web app**. Set "Execute as: Me" and "Who has access: Anyone." Deploy, and click through the Google permission warning (normal for your own scripts).
5. Copy the web app URL (ends in `/exec`).
6. Open `assets/config.js` and paste it in:
   ```js
   window.SURVIVOR_CONFIG = {
     sheetsWebAppUrl: "https://script.google.com/macros/s/AKfycb.../exec",
   };
   ```
7. Push that change to GitHub. Reload the site — the footer should now say **"● synced"** instead of "● local-only."

The whole game state lives as one JSON blob in cell A1 of a "GameState" tab in that spreadsheet, if you ever want to peek at it or back it up.

## Customizing

- **Secret missions**: edit the `MISSION_POOL` array at the top of `assets/store.js`.
- **Colors/fonts**: all design tokens are CSS variables at the top of `assets/style.css`.
- **Logo**: it's hand-drawn SVG in `assets/brand.js`, not a reproduction of Epic's actual Fortnite logo (avoids using their trademarked artwork) — feel free to restyle it.
