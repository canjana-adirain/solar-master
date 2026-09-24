# Solar Master React Dashboard

Maintainable React + Material UI conversion of the original single-file Solar Master dashboard.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Before publishing or deploying

This project currently uses a browser-side demo login. It is not a secure administrator login: do not rely on it to protect a live Firebase Realtime Database. Set up Firebase Authentication and server-enforced Realtime Database Security Rules before connecting public builds to real data or enabling cloud writes. Review the sample dataset before making the repository public.

The Firebase web configuration is client-visible even if moved to Vite environment variables. Do not put service account JSON, private keys, or other server secrets in this React project.

## Publish with GitHub Pages

Push this Vite project to a GitHub repository, then open **Settings → Pages** and select **GitHub Actions** as the build and deployment source. After the Firebase access controls above are in place, open **Actions → Deploy to GitHub Pages → Run workflow**. The workflow builds the `dist` folder with the correct path for the repository and publishes it to GitHub Pages. It runs manually, so pushing code alone does not publish the site.

The Firebase web configuration is in `src/services/cloud.js`. The values in `src/constants.js` are hashes for the browser-side demo login, not Firebase credentials. Hosting on GitHub Pages does not change who can access Firebase; Realtime Database Security Rules enforce that.

## Project structure

- `src/components/common` — shared headings and download controls
- `src/components/dashboard` — focused dashboard cards, charts, dialog and table
- `src/hooks` — authentication and saved-round state
- `src/pages` — dashboard and data-upload screens
- `src/services` — Firebase cloud synchronization
- `src/utils` — analytics, formatting, export and workbook parsing
- `src/data` — original sample portfolio data

The UI uses Material UI components and responsive `sx` breakpoints. Chart.js is loaded as a package instead of being bundled inline. Excel import/export uses SheetJS, and PDF exports use html2canvas + jsPDF.

The React app intentionally uses the original HTML dashboard's `solarmaster_rounds_v1` and `solarmaster_active_round_v1` browser-storage keys. Existing saved rounds and their analysis periods therefore remain available after migration. Data saved by the first React conversion under the temporary `v2` keys is migrated automatically when no original `v1` data exists.
