# Stack & Borrow

Bitcoin-backed loan calculator. Sats-first, tax-aware, with honest lender ranking.

## What's in this folder

```
stack-and-borrow/
├── index.html              ← page shell the browser loads
├── package.json            ← lists dependencies
├── vite.config.js          ← build config
├── public/
│   ├── favicon.svg         ← bitcoin logo
│   └── lenders.json        ← lender data — EDIT THIS to update rates
└── src/
    ├── main.jsx            ← starts the React app
    └── App.jsx             ← the entire calculator
```

## How to run it on your computer

You need Node.js installed. Get it from https://nodejs.org (the LTS version).

Open a terminal in this folder and type:

```
npm install
npm run dev
```

It will print a URL like `http://localhost:5173`. Open that in your browser.

To stop, press `Ctrl + C` in the terminal.

## How to build for production

```
npm run build
```

This creates a `dist/` folder with everything you need to upload to Cloudflare Pages, your StartOS, or any web host.

## How to update lender rates without touching code

1. Open `public/lenders.json` in any text editor
2. Change rates, terms, or whatever needs updating
3. Update the `lastUpdated` date at the top
4. Save the file
5. If running locally — refresh the browser. If on Cloudflare Pages — commit and push to GitHub, deploy is automatic.

## License

Your code, your call.
