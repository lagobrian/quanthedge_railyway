import csv
import os
import pandas as pd
from bs4 import BeautifulSoup
import re

def extract_text_from_html(html_content):
    """Extracts just the text from the first paragraph tag."""
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the first p tag
    first_p = soup.find('p')
    
    # Return just the text if a paragraph is found, otherwise return empty string
    if first_p:
        return first_p.get_text(strip=True)
    else:
        return ''

def clean_filename(text):
    """Create a clean filename from text"""
    # Replace spaces with hyphens
    text = re.sub(r'\s+', '-', text.lower())
    # Remove special characters
    text = re.sub(r'[^\w\-]', '', text)
    return text

def main():
    # Set paths
    substack_dir = os.path.join(os.getcwd(), "from_substack")
    posts_csv = os.path.join(substack_dir, 'posts.csv')
    posts_dir = os.path.join(substack_dir, 'posts')
    output_excel = os.path.join(substack_dir, 'posts_content.xlsx')
    
    print(f"Looking for CSV at: {posts_csv}")
    print(f"Looking for posts directory at: {posts_dir}")
    
    if not os.path.exists(posts_csv):
        print(f"Error: Posts CSV not found at {posts_csv}")
        return
    
    if not os.path.exists(posts_dir):
        print(f"Error: Posts directory not found at {posts_dir}")
        return
    
    # List files in the posts directory
    print(f"Files in posts directory: {len(os.listdir(posts_dir))}")
    
    # Read posts CSV
    df = pd.read_csv(posts_csv)
    print(f"Read {len(df)} rows from CSV")
    
    # Add content column
    df['content'] = ''
    df['first_paragraph'] = ''
    
    # Process each post
    processed = 0
    for index, row in df.iterrows():
        # Skip invalid rows
        if pd.isna(row['title']) or row['title'] == 'title':
            continue
            
        # Get HTML file path - try different possible formats
        try:
            post_id = str(row['post_id']).strip()
            title = str(row['title']).strip()
            
            # Try different filename formats
            possible_filenames = [
                f"{post_id}.{clean_filename(title)}.html",
                f"{post_id}.html"
            ]
            
            html_file = None
            for filename in possible_filenames:
                path = os.path.join(posts_dir, filename)
                if os.path.exists(path):
                    html_file = path
                    break
            
            if html_file and os.path.exists(html_file):
                print(f"Processing file: {html_file}")
                with open(html_file, 'r', encoding='utf-8') as html_f:
                    html_content = html_f.read()
                    
                    # Extract first paragraph
                    first_paragraph = extract_text_from_html(html_content)
                    df.at[index, 'first_paragraph'] = first_paragraph
                    
                    # Extract all text
                    soup = BeautifulSoup(html_content, 'html.parser')
                    # Remove scripts, styles, and other non-content elements
                    for tag in soup.find_all(['script', 'style', 'noscript', 'iframe']):
                        tag.decompose()
                    # Get all text
                    all_text = soup.get_text(separator='\n', strip=True)
                    df.at[index, 'content'] = all_text
                    
                    processed += 1
                    if processed % 10 == 0:
                        print(f"Processed {processed} posts")
            else:
                print(f"HTML file not found for post: {title} (ID: {post_id})")
                
        except Exception as e:
            print(f"Error processing {row.get('title', 'Unknown')}: {str(e)}")
    
    # Save to Excel
    print(f"Saving data to {output_excel}...")
    df.to_excel(output_excel, index=False)
    print(f"Successfully extracted text from {processed} posts and saved to {output_excel}")

if __name__ == "__main__":
    main()
