# TAI Landing Page

This is the landing page for TAI - AI-Assisted Grading Platform.

## Setup Instructions

### GitHub Pages Deployment

1. **Push the docs folder to your repository**
   ```bash
   git add docs/
   git commit -m "Add landing page for GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "Deploy from a branch"
   - Select the `main` branch and `/docs` folder
   - Click "Save"
   - Your site will be published at: `https://<username>.github.io/<repository-name>/`

3. **Customize the page**
   - Replace `YOUR_VIDEO_ID` in `index.html` with your actual YouTube video ID
     - The video ID is the part after `v=` in your YouTube URL
     - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`
   - Replace `YOUR_TALLY_FORM_ID` in `index.html` with your Tally form URL
     - Example: If your Tally form is at `https://tally.so/r/w4jEAB`, use `w4jEAB`

4. **Optional: Add custom images**
   - Replace the SVG files in `docs/images/` with your own screenshots or photos
   - Keep the same filenames or update the paths in `index.html`

## File Structure

```
docs/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── images/             # Feature images
│   ├── rubric-extraction.svg
│   ├── auto-grading.svg
│   └── insights.svg
└── README.md          # This file
```

## Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI**: Clean, professional design with purple branding
- **Three Feature Cards**: Showcasing key platform capabilities
- **Video Demo Section**: Embedded YouTube video
- **Call-to-Action**: Book a demo button linking to Tally form
- **Smooth Navigation**: Sticky header with smooth scroll

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-purple: #7c3aed;
    --purple-dark: #6d28d9;
    --purple-light: #a78bfa;
}
```

### Update Content
Edit the text directly in `index.html` to match your specific features and messaging.

### Add More Features
Copy the feature card HTML structure and add new cards to the features grid.
