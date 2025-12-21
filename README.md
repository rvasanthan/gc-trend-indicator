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