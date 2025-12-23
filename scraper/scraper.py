from bs4 import BeautifulSoup
import requests


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
    import re
    
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
        print("Could not find Employment-Based Preference Cases table")
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
