# Viralzaps Website

## Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Interactive Elements**: 
  - FAQ accordion
  - Testimonial slider
  - Mobile navigation menu
  - Smooth scrolling navigation
  - Pricing toggle (Monthly/Annual)

## Project Structure

```
viralzap/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # JavaScript for interactivity
└── README.md       # This file
```

## Local development

| What | Command | URL (default) |
|------|---------|----------------|
| **Viralzaps** (frontend/site) | `npm start` or `npm run serve` | http://localhost:3000 |
| **Backend** (API) | `npm run backend` | http://localhost:4000 |
| **Both** (frontend + backend) | `npm run dev` | 3000 + 4000 |

From the project root: run `npm start` for the site, and `npm run backend` (in another terminal or via `npm run dev`) for the API.

**Backend URL on localhost:** set once in **`api-base-url.js`** (`VIRALZAPS_LOCAL_API_BASE_URL`). The app uses that value everywhere; if ports 4000–4010 are probed, the range is derived from that URL’s port.

**If the browser says “This site can’t be reached”:** nothing is listening yet. Start the server first (`npm start`), then open **http://localhost:3000** (use `http`, not `https`, unless you’ve set up TLS). Do not rely on double‑clicking `index.html` for login or Firebase—use a local server.

## Getting Started

1. In a terminal: `cd` to this project folder, run `npm start`, then open **http://localhost:3000** in your browser.
2. Opening `index.html` directly (`file://`) may load the page, but **Firebase auth and many features require `http://localhost`**.
3. No build step for the static frontend; `npm start` uses `serve` on port 3000.

## Sections Included

- Hero section with call-to-action
- Features showcase (Find Trending Channels, Analyze Competition, Create Content)
- Platform capabilities (Deep Research, Video Generation, Voice Generation)
- Tools grid (8 different tools)
- Testimonials slider
- Credit breakdown
- Pricing plans (Starter, Professional, Ultimate)
- FAQ section
- Footer with navigation links

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

All colors, fonts, and styling can be customized through CSS variables in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --text-primary: #1f2937;
    /* ... more variables */
}
```

## Notes

- This is a frontend-only implementation
- All interactive features work without a backend
- Images and icons use CSS/emoji placeholders (can be replaced with actual assets)

