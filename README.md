# GC Trend Indicator

A Python web scraper that extracts data and exports it to CSV or JSON formats.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the scraper:
   ```bash
   python main.py
   ```

## Deployment

### GitHub Pages (Recommended)
The UI is configured to deploy automatically to GitHub Pages via GitHub Actions.
1. Go to your repository settings on GitHub.
2. Navigate to **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Push your changes to the `main` branch.

### Vercel / Netlify
1. Connect your repository to Vercel or Netlify.
2. Set the **Root Directory** to `web`.
3. Set the **Build Command** to `npm run build`.
4. Set the **Output Directory** to `dist`.
5. Note: You may need to change `base: '/gc-trend-indicator/'` to `base: '/'` in [web/vite.config.js](web/vite.config.js) if you are using a custom domain or a platform that doesn't use the repository name in the URL.

## Project Structure

- `main.py` - Entry point for the scraper
- `scraper/` - Web scraping modules
- `requirements.txt` - Python dependencies
- `output/` - Generated CSV/JSON files

## Dependencies

- **BeautifulSoup4** - HTML parsing
- **Requests** - HTTP requests
- **Selenium** - Browser automation for JavaScript-heavy sites
- **Pandas** - Data manipulation and export
- **LXML** - XML/HTML processing