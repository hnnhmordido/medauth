# MedAuth Prototype

GitHub-ready React + Vite prototype for the MedAuth university project.

## Brand / colour scheme

The UI is based on the supplied MedAuth logo:

- Brand blue: `#0B63B6`
- Deep blue: `#084B99`
- Teal: `#00989F`
- Aqua: `#01A09D`
- Light background: `#F4F9FC`
- Main text: `#17324D`

The supplied logo is stored at `public/medauth-logo.png`.

## Included prototype flows

- Consumer home screen with no sign-up
- Scan simulation and manual code entry
- Match / No Match / Unable to Verify results
- Medicine details
- Suspicious medicine report form
- Online/offline demo state
- Professional demo login
- Manufacturer, pharmacist and admin demo dashboards
- Mobile-first responsive design

## Demo codes

| Code | Batch | Result |
|---|---|---|
| MED-001 | B1001 | Match |
| MED-002 | B2045 | No Match |
| MED-003 | B9912 | Unable to Verify / Not Yet Covered |

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial MedAuth prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Important

This is a university prototype only. It does not perform real medicine authentication and should not be used for clinical or regulatory decisions.
