from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime


def fetch_page(url):
    """
    Fetch HTML content from a URL.
    
    Args:
        url: Target URL
        
    Returns:
        BeautifulSoup object or None if request fails
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'html.parser')
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def get_visa_bulletin_links(soup):
    """
    Extract all visa bulletin links from the main visa bulletin page.
    
    Args:
        soup: BeautifulSoup object of the main visa bulletin page
        
    Returns:
        List of tuples (bulletin_url, bulletin_title)
    """
    links = []
    
    # Find all links that contain "visa-bulletin" in the href
    for link in soup.find_all('a', href=True):
        href = link['href']
        text = link.get_text(strip=True)
        
        # Look for links to specific bulletins (contain year and month)
        if 'visa-bulletin' in href.lower() and re.search(r'(january|february|march|april|may|june|july|august|september|october|november|december)', text, re.IGNORECASE):
            # Make absolute URL if needed
            if href.startswith('/'):
                href = 'https://travel.state.gov' + href
            elif not href.startswith('http'):
                continue
            
            links.append((href, text))
    
    return links


def parse_html(soup, selectors):
    """
    Parse HTML content using CSS selectors.
    
    Args:
        soup: BeautifulSoup object
        selectors: Dictionary of field_name: css_selector
        
    Returns:
        Dictionary with extracted data
    """
    data = {}
    for field, selector in selectors.items():
        element = soup.select_one(selector)
        data[field] = element.get_text(strip=True) if element else None
    return data


def extract_final_action_dates_table(soup):
    """
    Extract the table data below "FINAL ACTION DATES FOR EMPLOYMENT-BASED PREFERENCE CASES".
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        List of dictionaries containing table data
    """
    # Find all tables in the document
    all_tables = soup.find_all('table')
    
    # Look for a table whose preceding text contains the employment-based header
    target_table = None
    for table in all_tables:
        # Get some preceding text to check
        prev_text = ""
        prev_sibling = table.find_previous(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'strong'])
        if prev_sibling:
            # Get text from this element and nearby elements
            for elem in prev_sibling.find_all_previous(limit=5):
                prev_text += elem.get_text() + " "
            prev_text += prev_sibling.get_text()
        
        # Check if this text mentions employment-based preference cases
        if re.search(r'EMPLOYMENT-BASED\s+PREFERENCE\s+CASES', prev_text, re.IGNORECASE):
            # Also verify this table has Employment-based data by checking first column
            first_row = table.find('tr')
            if first_row:
                first_cell = first_row.find(['td', 'th'])
                if first_cell and 'Employment' in first_cell.get_text():
                    target_table = table
                    break
    
    if not target_table:
        return []
    
    # Extract table data
    rows = target_table.find_all('tr')
    if not rows:
        return []
    
    # Get headers from first row
    headers = []
    header_row = rows[0]
    for cell in header_row.find_all(['th', 'td']):
        headers.append(cell.get_text(strip=True))
    
    # Extract data rows
    table_data = []
    for row in rows[1:]:
        cells = row.find_all(['td', 'th'])
        if cells:
            row_data = {}
            for i, cell in enumerate(cells):
                header = headers[i] if i < len(headers) else f"Column_{i}"
                row_data[header] = cell.get_text(strip=True)
            table_data.append(row_data)
    
    return table_data


def extract_filing_dates_table(soup):
    """
    Extract the table data below "DATES FOR FILING OF EMPLOYMENT-BASED VISA APPLICATIONS".
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        List of dictionaries containing table data
    """
    # Find all tables in the document
    all_tables = soup.find_all('table')
    
    # Look for a table whose preceding text contains the filing dates header
    target_table = None
    for table in all_tables:
        # Get some preceding text to check
        prev_text = ""
        prev_sibling = table.find_previous(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'strong'])
        if prev_sibling:
            # Get text from this element and nearby elements
            for elem in prev_sibling.find_all_previous(limit=5):
                prev_text += elem.get_text() + " "
            prev_text += prev_sibling.get_text()
        
        # Check if this text mentions filing of employment-based visa applications
        if re.search(r'FILING\s+OF\s+EMPLOYMENT-BASED\s+VISA\s+APPLICATIONS', prev_text, re.IGNORECASE):
            # Also verify this table has Employment-based data by checking first column
            first_row = table.find('tr')
            if first_row:
                first_cell = first_row.find(['td', 'th'])
                if first_cell and 'Employment' in first_cell.get_text():
                    target_table = table
                    break
    
    if not target_table:
        return []
    
    # Extract table data
    rows = target_table.find_all('tr')
    if not rows:
        return []
    
    # Get headers from first row
    headers = []
    header_row = rows[0]
    for cell in header_row.find_all(['th', 'td']):
        headers.append(cell.get_text(strip=True))
    
    # Extract data rows
    table_data = []
    for row in rows[1:]:
        cells = row.find_all(['td', 'th'])
        if cells:
            row_data = {}
            for i, cell in enumerate(cells):
                header = headers[i] if i < len(headers) else f"Column_{i}"
                row_data[header] = cell.get_text(strip=True)
            table_data.append(row_data)
    
    return table_data


def extract_india_dates(soup, bulletin_title):
    """
    Extract INDIA dates for 1st, 2nd, and 3rd preference from Employment-Based tables.
    Extracts both Final Action Dates and Filing Dates.
    
    Args:
        soup: BeautifulSoup object
        bulletin_title: Title of the bulletin (e.g., "Visa Bulletin for January 2026")
        
    Returns:
        Dictionary with bulletin info and INDIA dates (both final action and filing)
    """
    # Extract month and year from bulletin title
    month_year = extract_month_year(bulletin_title)
    
    # Get the full employment-based table data for Final Action Dates
    final_action_data = extract_final_action_dates_table(soup)
    
    # Get the filing dates table data
    filing_dates_data = extract_filing_dates_table(soup)
    
    if not final_action_data and not filing_dates_data:
        return None
    
    # Find INDIA column and extract 1st, 2nd, 3rd preference dates
    result = {
        'month': month_year.get('month', 'Unknown'),
        'month_num': month_year.get('month_num', 0),
        'year': month_year.get('year', 'Unknown'),
        'bulletin_title': bulletin_title,
        'india_1st': None,
        'india_2nd': None,
        'india_3rd': None,
        'india_1st_filing': None,
        'india_2nd_filing': None,
        'india_3rd_filing': None
    }
    
    # Extract Final Action Dates
    if final_action_data:
        for row in final_action_data:
            preference = row.get('Employment-based', '').strip()
            india_date = row.get('INDIA', '').strip()
            
            if preference == '1st':
                result['india_1st'] = india_date
            elif preference == '2nd':
                result['india_2nd'] = india_date
            elif preference == '3rd':
                result['india_3rd'] = india_date
    
    # Extract Filing Dates
    if filing_dates_data:
        for row in filing_dates_data:
            preference = row.get('Employment-based', '').strip()
            india_date = row.get('INDIA', '').strip()
            
            if preference == '1st':
                result['india_1st_filing'] = india_date
            elif preference == '2nd':
                result['india_2nd_filing'] = india_date
            elif preference == '3rd':
                result['india_3rd_filing'] = india_date
    
    return result


def extract_month_year(bulletin_title):
    """
    Extract month and year from bulletin title.
    
    Args:
        bulletin_title: Title like "Visa Bulletin for January 2026"
        
    Returns:
        Dictionary with month and year
    """
    months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    
    result = {'month': None, 'year': None}
    
    # Search for month name
    for month_name, month_num in months.items():
        if month_name in bulletin_title.lower():
            result['month'] = month_name.capitalize()
            result['month_num'] = month_num
            break
    
    # Search for year (4 digits)
    year_match = re.search(r'20\d{2}', bulletin_title)
    if year_match:
        result['year'] = int(year_match.group())
    
    return result
