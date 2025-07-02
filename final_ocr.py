import cv2
import easyocr
import re

def parse_new_world_storage(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.medianBlur(img, 3)
    img = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(img)
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    reader = easyocr.Reader(['en'], verbose=False)
    results = reader.readtext(img, min_size=5, text_threshold=0.3)
    
    all_text = ' '.join([text for _, text, conf in results if conf > 0.3])
    print(f"Raw text: {all_text[:300]}...")
    
    found_items = {}
    
    # Parse based on actual patterns seen in OCR
    patterns = [
        # Weaving materials: WKAVNG; 160.3 and WRAVING; 52.3
        (r'WKAVNG[;\s]*(\d+)', 'Weaving_Materials_1'),
        (r'WRAVING[;\s]*(\d+)', 'Weaving_Materials_2'),
        
        # Woodworking: WO(I)WORKIVG 684.8
        (r'WO\(I\)WORK[IV]+G[;\s]*(\d+)', 'Woodworking_Materials'),
        
        # Leatherworking: I.FATHF RWORKING (look for nearby numbers)
        (r'I\.FATHF\s+RWORKING', 'Leatherworking_Pattern'),
        
        # Smelting: SMKI:TIN
        (r'SMKI:TIN[;\s]*(\d+)', 'Smelting_Materials'),
        
        # Individual items
        (r'(\d+)\s*Starmetal', 'Starmetal_Ore'),
        (r'(\d+)\s*Iron(?!\s*Ingot)', 'Iron_Ore'),
        (r'(\d+)\s*Steel', 'Steel_Ingot'),
        (r'(\d+)\s*Reagent', 'Reagents'),
        (r'(\d+)\s*Charcoal', 'Charcoal')
    ]
    
    for pattern, item_name in patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        if matches:
            if item_name == 'Leatherworking_Pattern':
                # Special handling for leatherworking - look for nearby numbers
                pos = all_text.lower().find('i.fathf rworking')
                if pos != -1:
                    nearby = all_text[max(0, pos-50):pos+100]
                    nums = re.findall(r'\b(\d+)\b', nearby)
                    valid_nums = [int(n) for n in nums if 10 <= int(n) <= 500]
                    if valid_nums:
                        found_items['Leatherworking_Materials'] = max(valid_nums)
            else:
                total = sum(int(match) for match in matches if match.isdigit())
                if total > 0:
                    found_items[item_name] = total
    
    # Combine weaving materials
    weaving_total = 0
    if 'Weaving_Materials_1' in found_items:
        weaving_total += found_items.pop('Weaving_Materials_1')
    if 'Weaving_Materials_2' in found_items:
        weaving_total += found_items.pop('Weaving_Materials_2')
    if weaving_total > 0:
        found_items['Weaving_Materials'] = weaving_total
    
    return found_items

if __name__ == "__main__":
    print("=== FINAL OCR DETECTION ===")
    items = parse_new_world_storage("image.png")
    for item, qty in items.items():
        print(f"{item}: {qty}")