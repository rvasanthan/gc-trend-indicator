import json
import pandas as pd


def export_to_csv(data, filename='output/data.csv'):
    """
    Export data to CSV format.
    
    Args:
        data: List of dictionaries or pandas DataFrame
        filename: Output file path
    """
    df = pd.DataFrame(data) if isinstance(data, list) else data
    df.to_csv(filename, index=False)
    print(f"Data exported to {filename}")


def export_to_json(data, filename='output/data.json'):
    """
    Export data to JSON format.
    
    Args:
        data: List of dictionaries or pandas DataFrame
        filename: Output file path
    """
    if isinstance(data, pd.DataFrame):
        data = data.to_dict('records')
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Data exported to {filename}")
