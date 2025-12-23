"""
GC Trend Indicator - Web Scraper
Main entry point for the scraper application.
"""

from scraper.scraper import fetch_page, extract_final_action_dates_table
from scraper.exporter import export_to_csv, export_to_json


def main():
    """Main scraper function."""
    print("GC Trend Indicator - Starting scraper...")
    
    # Scrape visa bulletin
    url = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-january-2026.html"
    soup = fetch_page(url)
    
    if soup:
        # Extract FINAL ACTION DATES FOR EMPLOYMENT-BASED PREFERENCE CASES table
        data = extract_final_action_dates_table(soup)
        
        if data:
            # Export data
            export_to_csv(data)
            export_to_json(data)
            print(f"Extracted {len(data)} rows from the table")
        else:
            print("No data extracted")
    
    print("Scraper complete!")


if __name__ == "__main__":
    main()
