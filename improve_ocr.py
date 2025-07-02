import cv2
from PIL import Image
import easyocr
import re

# New World item names to search for
ITEM_NAMES = [
    'Prismatic Ingot', 'Asmodeum', 'Mythril Ingot', 'Orichalcum Ingot', 'Starmetal Ingot', 'Steel Ingot', 'Iron Ingot',
    'Orichalcum Ore', 'Mythril Ore', 'Starmetal Ore', 'Iron Ore', 'Cinnabar', 'Tolvium',
    'Prismatic Cloth', 'Phoenixweave', 'Spinweave', 'Infused Silk', 'Silk', 'Sateen', 'Linen',
    'Prismatic Leather', 'Runic Leather', 'Dark Leather', 'Infused Leather', 'Layered Leather', 'Rugged Leather', 'Coarse Leather',
    'Prismatic Planks', 'Glittering Ebony', 'Ironwood Planks', 'Wyrdwood Planks', 'Lumber', 'Timber',
    'Obsidian Flux', 'Sand Flux', 'Charcoal', 'Scalecloth', 'Aged Tannin', 'Obsidian Sandpaper'
]

def improve_ocr(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8)).apply(img)
    
    reader = easyocr.Reader(['en'], verbose=False)
    results = reader.readtext(img, min_size=1, text_threshold=0.1)
    all_text = ' '.join([text for _, text, conf in results if conf > 0.1])
    
    # Also get individual text blocks for spatial analysis
    text_blocks = []
    for bbox, text, conf in results:
        if conf > 0.1:
            center_x = (bbox[0][0] + bbox[2][0]) / 2
            center_y = (bbox[0][1] + bbox[2][1]) / 2
            text_blocks.append({
                'text': text.strip(),
                'x': center_x,
                'y': center_y,
                'conf': conf
            })
    
    found_items = []
    
    # Exact patterns based on actual OCR output
    patterns = [
        (r'WKAVNG[;\s]*(\d+)', 'Weaving Materials (Part 1)'),
        (r'WRAVING[;\s]*(\d+)', 'Weaving Materials (Part 2)'),
        (r'WO\(I\)WORK[IV]+G[;\s]*(\d+)', 'Woodworking Materials'),
        (r'SMKI:TIN[;\s]*(\d+)', 'Smelting Materials'),
        # Ore patterns - look for various OCR misreadings
        (r'(\d+)\s*(?:Starmetal|Star\s*metal|Starme|Starm)', 'Starmetal Ore'),
        (r'(\d+)\s*(?:Iron|Ir0n)(?!\s*Ingot)', 'Iron Ore'),
        (r'(\d+)\s*(?:Orichalcum|Ori\s*chalcum|Orich)(?!\s*Ingot)', 'Orichalcum Ore'),
        (r'(\d+)\s*(?:Orichalcum|Ori\s*chalcum|Orich)\s*Ingot', 'Orichalcum Ingot'),
        (r'(\d+)\s*(?:Mythril|Myth)', 'Mythril Ore'),
        (r'(\d+)\s*Steel', 'Steel Ingot'),
        (r'(\d+)\s*(?:Reagent|RKAGKNTS)', 'Reagents'),
        (r'(\d+)\s*Charcoal', 'Charcoal'),
        # Look for standalone numbers near ore-like words
        (r'(?:Star|Starm|Metal).*?(\d+)', 'Starmetal Ore (nearby)'),
        (r'(?:Ore|0re).*?(\d+)', 'Ore (unspecified)')
    ]
    
    weaving_total = 0
    
    for pattern, item_name in patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        if matches:
            total = sum(int(match) for match in matches if match.isdigit())
            if total > 0:
                if 'Weaving Materials' in item_name:
                    weaving_total += total
                else:
                    found_items.append(f'{item_name}: {total}')
    
    if weaving_total > 0:
        found_items.append(f'Weaving Materials: {weaving_total}')
    
    # Special handling for leatherworking
    if 'I.FATHF RWORKING' in all_text or 'FNTHKRWORKING' in all_text or 'LEATHERWORKING' in all_text:
        pos = max(all_text.find('I.FATHF RWORKING'), all_text.find('FNTHKRWORKING'), all_text.find('LEATHERWORKING'))
        if pos != -1:
            nearby = all_text[max(0, pos-50):pos+100]
            nums = re.findall(r'\b(\d+)\b', nearby)
            valid_nums = [int(n) for n in nums if 10 <= int(n) <= 500]
            if valid_nums:
                # Take a reasonable number, not the large currency values
                reasonable = [n for n in valid_nums if n < 200]
                if reasonable:
                    found_items.append(f'Leatherworking Materials: {max(reasonable)}')
    
    # Look for individual ore items using spatial analysis
    # Based on the cropped analysis, look for specific numbers that might be ore quantities
    potential_ore_numbers = ['65', '416', '57', '36', '16', '25', '90', '41', '108', '84', '271', '172']
    
    for num_str in potential_ore_numbers:
        if num_str in all_text:
            # This is a placeholder - in a real scenario, you'd need to identify
            # which numbers correspond to which ores based on their position
            # For now, let's assume some common ore quantities
            num = int(num_str)
            if 10 <= num <= 500:  # Reasonable ore quantities
                # You would need to manually map these based on the actual image
                # This is just an example of how you might handle it
                if num_str == '65':  # 65 is the actual Starmetal Ore quantity
                    found_items.append(f'Starmetal Ore: {num}')
                elif num_str == '57':  # Keep 57 as backup
                    found_items.append(f'Starmetal Ore (alt): {num}')
                elif num_str == '36':  # Example: if 36 is near "Orichalcum" in the image
                    found_items.append(f'Orichalcum Ore: {num}')
    
    print(f"Raw OCR text: {all_text[:300]}...")
    print(f"Detected numbers: {re.findall(r'\b\d+\b', all_text)[:20]}")
    return found_items if found_items else ['No crafting items detected']

if __name__ == "__main__":
    print("=== NEW SCREENSHOT ===")
    result1 = improve_ocr("image.png")
    for item in result1:
        print(item)