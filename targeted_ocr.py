import cv2
import easyocr
import re

def extract_storage_items(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.medianBlur(img, 3)
    img = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(img)
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    reader = easyocr.Reader(['en'], verbose=False)
    results = reader.readtext(img, min_size=3, text_threshold=0.2)
    
    # Get all text with positions
    text_blocks = []
    for bbox, text, conf in results:
        if conf > 0.2:
            center_x = (bbox[0][0] + bbox[2][0]) / 2
            center_y = (bbox[0][1] + bbox[2][1]) / 2
            text_blocks.append({
                'text': text.strip(),
                'x': center_x,
                'y': center_y,
                'conf': conf
            })
    
    # Sort by position (top to bottom, left to right)
    text_blocks.sort(key=lambda b: (b['y'], b['x']))
    
    found_items = {}
    
    # Look for ore patterns in the text blocks
    ore_patterns = [
        (r'(\d+)\s*Starmetal', 'Starmetal Ore'),
        (r'(\d+)\s*Orichalcum', 'Orichalcum Ore'),
        (r'(\d+)\s*Iron(?!\s*Ingot)', 'Iron Ore'),
        (r'(\d+)\s*Mythril', 'Mythril Ore'),
        (r'(\d+)\s*Steel', 'Steel Ingot'),
        (r'(\d+)\s*Charcoal', 'Charcoal'),
        (r'(\d+)\s*Flux', 'Flux')
    ]
    
    # Check each text block for ore patterns
    for block in text_blocks:
        text = block['text']
        for pattern, item_name in ore_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                quantity = int(match.group(1))
                found_items[item_name] = quantity
                print(f"Found: {item_name} = {quantity} (from '{text}')")
    
    # Look for number-name pairs in adjacent blocks
    for i, block in enumerate(text_blocks):
        if block['text'].isdigit():
            quantity = int(block['text'])
            # Look at next few blocks for ore names
            for j in range(i+1, min(i+3, len(text_blocks))):
                next_block = text_blocks[j]
                text = next_block['text'].lower()
                
                # Check distance (should be close)
                distance = ((block['x'] - next_block['x'])**2 + (block['y'] - next_block['y'])**2)**0.5
                if distance < 100:  # Within 100 pixels
                    if 'starmetal' in text or 'star' in text:
                        found_items['Starmetal Ore'] = quantity
                        print(f"Found: Starmetal Ore = {quantity} (from '{block['text']}' + '{next_block['text']}')")
                    elif 'orichalcum' in text or 'ori' in text:
                        found_items['Orichalcum Ore'] = quantity
                        print(f"Found: Orichalcum Ore = {quantity} (from '{block['text']}' + '{next_block['text']}')")
                    elif 'iron' in text and 'ingot' not in text:
                        found_items['Iron Ore'] = quantity
                        print(f"Found: Iron Ore = {quantity} (from '{block['text']}' + '{next_block['text']}')")
                    elif 'mythril' in text:
                        found_items['Mythril Ore'] = quantity
                        print(f"Found: Mythril Ore = {quantity} (from '{block['text']}' + '{next_block['text']}')")
    
    return found_items

if __name__ == "__main__":
    print("=== TARGETED ORE DETECTION ===")
    items = extract_storage_items("image.png")
    print("\n=== SUMMARY ===")
    for item, qty in items.items():
        print(f"{item}: {qty}")