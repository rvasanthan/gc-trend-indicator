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
