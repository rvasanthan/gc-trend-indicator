"""
GC Trend Indicator - Web Scraper
Main entry point for the scraper application.
"""

from scraper.scraper import fetch_page, get_visa_bulletin_links, extract_india_dates
from scraper.exporter import export_to_csv, export_to_json
import time


def main():
    """Main scraper function."""
    print("GC Trend Indicator - Starting scraper...")
    print("=" * 60)
    
    # Start from main visa bulletin page
    main_url = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
    print(f"Fetching main visa bulletin page: {main_url}")
    soup = fetch_page(main_url)
    
    if not soup:
        print("Failed to fetch main visa bulletin page")
        return
    
    # Get all visa bulletin links
    print("Finding all visa bulletin links...")
    bulletin_links = get_visa_bulletin_links(soup)
    print(f"Found {len(bulletin_links)} visa bulletin links")
    
    # Collect data from all bulletins (only 2012 and later)
    all_data = []
    
    for i, (url, title) in enumerate(bulletin_links, 1):
        # Check the year from the title before processing
        import re
        year_match = re.search(r'20\d{2}', title)
        if year_match:
            year = int(year_match.group())
            if year < 2012:
                print(f"\n[{i}/{len(bulletin_links)}] Skipping: {title} (before 2012)")
                continue
        
        print(f"\n[{i}/{len(bulletin_links)}] Processing: {title}")
        print(f"URL: {url}")
        
        # Fetch the bulletin page
        bulletin_soup = fetch_page(url)
        
        if bulletin_soup:
            # Extract INDIA dates for 1st, 2nd, 3rd preference (both final action and filing)
            india_data = extract_india_dates(bulletin_soup, title)
            
            if india_data:
                all_data.append(india_data)
                print(f"  ✓ Final Action Dates:")
                print(f"     India 1st: {india_data['india_1st']}")
                print(f"     India 2nd: {india_data['india_2nd']}")
                print(f"     India 3rd: {india_data['india_3rd']}")
                print(f"  ✓ Filing Dates:")
                print(f"     India 1st: {india_data['india_1st_filing']}")
                print(f"     India 2nd: {india_data['india_2nd_filing']}")
                print(f"     India 3rd: {india_data['india_3rd_filing']}")
            else:
                print(f"  ✗ Could not extract data")
        else:
            print(f"  ✗ Failed to fetch bulletin")
        
        # Be polite to the server - add a small delay
        if i < len(bulletin_links):
            time.sleep(1)
    
    # Sort data by year and month
    all_data.sort(key=lambda x: (x.get('year', 0), x.get('month_num', 0) if 'month_num' in x else 0))
    
    # Export data
    if all_data:
        print("\n" + "=" * 60)
        print(f"Successfully extracted data from {len(all_data)} bulletins")
        export_to_csv(all_data)
        export_to_json(all_data)
        # Also export to web public folder for the dashboard
        export_to_json(all_data, 'web/public/data.json')
        print("Data exported to output/ and web/public/data.json")
    else:
        print("\nNo data extracted")
    
    print("=" * 60)
    print("Scraper complete!")


if __name__ == "__main__":
    main()
