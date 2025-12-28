import sqlite3
import os

def export_to_sqlite(data, db_path='output/visa_data.db'):
    """
    Export data to a SQLite database.
    
    Args:
        data: List of dictionaries
        db_path: Path to the SQLite database file
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS visa_bulletin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        year INTEGER,
        month TEXT,
        month_num INTEGER,
        india_1st TEXT,
        india_2nd TEXT,
        india_3rd TEXT,
        india_1st_filing TEXT,
        india_2nd_filing TEXT,
        india_3rd_filing TEXT,
        UNIQUE(year, month_num)
    )
    ''')
    
    # Insert or replace data
    for entry in data:
        cursor.execute('''
        INSERT OR REPLACE INTO visa_bulletin (
            title, year, month, month_num, 
            india_1st, india_2nd, india_3rd,
            india_1st_filing, india_2nd_filing, india_3rd_filing
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            entry.get('title'),
            entry.get('year'),
            entry.get('month'),
            entry.get('month_num'),
            entry.get('india_1st'),
            entry.get('india_2nd'),
            entry.get('india_3rd'),
            entry.get('india_1st_filing'),
            entry.get('india_2nd_filing'),
            entry.get('india_3rd_filing')
        ))
    
    conn.commit()
    conn.close()
    print(f"Data exported to SQLite database at {db_path}")
