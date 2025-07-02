import cv2
import easyocr
import re

def parse_storage_ocr(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.medianBlur(img, 3)
    img = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(img)
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    reader = easyocr.Reader(['en'], verbose=False)
    results = reader.readtext(img, min_size=5, text_threshold=0.3)
    
    # Create a list of text blocks with positions
    text_blocks = []
    for bbox, text, conf in results:
        if conf > 0.3:
            # Get center position of text block
            center_x = (bbox[0][0] + bbox[2][0]) / 2
            center_y = (bbox[0][1] + bbox[2][1]) / 2
            text_blocks.append({
                'text': text,
                'x': center_x,
                'y': center_y,
                'conf': conf
            })
    
    found_items = {}
    
    # Look for category patterns and find nearby numbers
    category_patterns = {
        'Smelting': ['SMKI:TIN', 'SMELTING'],
        'Weaving': ['WRAVING', 'WKAVNG', 'WEAVING'],
        'Woodworking': ['WO(I)WORKING', 'WO(I)WORKIVG', 'WOODWORKING'],
        'Leatherworking': ['I.FATHF RWORKING', 'FNTHKRWORKING', 'LEATHERWORKING']
    }
    
    for category, patterns in category_patterns.items():
        category_total = 0
        
        for pattern in patterns:
            # Find blocks matching this pattern
            for block in text_blocks:
                if any(p.lower() in block['text'].lower() for p in patterns):
                    # Look for numbers in nearby blocks (within 100 pixels)
                    for num_block in text_blocks:
                        distance = ((block['x'] - num_block['x'])**2 + (block['y'] - num_block['y'])**2)**0.5
                        if distance < 100:  # Within 100 pixels
                            # Extract numbers from this block
                            numbers = re.findall(r'(\d+(?:\.\d+)?)', num_block['text'])
                            for num_str in numbers:
                                num = float(num_str)
                                if 10 <= num <= 1000:  # Reasonable range for materials
                                    category_total += int(num)
                                    print(f"Found {category}: {int(num)} near '{block['text']}'")
        
        if category_total > 0:
            found_items[f'{category}_Materials'] = category_total
    
    # Look for specific items with quantities
    item_patterns = [
        (r'(\d+)\s*Starmetal', 'Starmetal_Ore'),
        (r'(\d+)\s*Iron(?!\s*Ingot)', 'Iron_Ore'),
        (r'(\d+)\s*Steel', 'Steel_Ingot'),
        (r'(\d+)\s*Orichalcum', 'Orichalcum_Ore'),
        (r'(\d+)\s*Mythril', 'Mythril_Ore'),
        (r'(\d+)\s*Reagent', 'Reagents'),
        (r'(\d+)\s*Charcoal', 'Charcoal'),
        (r'(\d+)\s*Flux', 'Flux')
    ]
    
    all_text = ' '.join([block['text'] for block in text_blocks])
    for pattern, item_name in item_patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        if matches:
            total = sum(int(match) for match in matches)
            if total > 0:
                found_items[item_name] = total
    
    return found_items

if __name__ == "__main__":
    print("=== IMPROVED OCR DETECTION ===")
    items = parse_storage_ocr("image.png")
    for item, qty in items.items():
        print(f"{item}: {qty}")