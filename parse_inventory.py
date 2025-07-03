import re
from typing import Dict, List, Tuple

def parse_inventory_ocr(ocr_text: str) -> Dict[str, int]:
    """Parse OCR text to extract New World inventory items and quantities."""
    
    # Clean up the OCR text
    text = ocr_text.replace('\n', ' ').replace('  ', ' ')
    
    # Enhanced item patterns with common OCR misreadings
    item_patterns = {
        'Iron Ore': [r'Iron\s*Ore[:\s]*(\d+)', r'lron\s*Ore[:\s]*(\d+)', r'Iron.*?Ore.*?(\d+)', r'(?:^|\s)Iron\s+(\d+)'],
        'Orichalcum Ore': [r'Orichalcum\s*Ore[:\s]*(\d+)', r'Ori.*?Ore[:\s]*(\d+)', r'Orich.*?Ore.*?(\d+)', r'(?:^|\s)Orichalcum\s+(\d+)'],
        'Starmetal Ore': [r'Starmetal\s*Ore[:\s]*(\d+)', r'Star.*?Ore[:\s]*(\d+)', r'Modium[:\s]*(\d+)', r'(?:^|\s)Starmetal\s+(\d+)', r'(?:^|\s)Modium\s+(\d+)'],
        'Steel Ingot': [r'Steel\s*Ingot[:\s]*(\d+)', r'Steel.*?Ingot.*?(\d+)', r'(?:^|\s)Steel\s+(\d+)'],
        'Mythril Ore': [r'Mythril\s*Ore[:\s]*(\d+)', r'Mythril.*?Ore.*?(\d+)'],
        'Iron Ingot': [r'Iron\s*Ingot[:\s]*(\d+)', r'lron\s*Ingot[:\s]*(\d+)', r'Iron.*?Ingot.*?(\d+)'],
        'Reagents': [r'RKAGKNTS[:\s]*(\d+)', r'REAGENTS[:\s]*(\d+)', r'Reagents[:\s]*(\d+)', r'(?:^|\s)Reagents\s+(\d+)'],
        'Silk': [r'Silk[:\s]*(\d+)', r'(?:^|\s)Silk\s+(\d+)'],
        'Leather': [r'Leather[:\s]*(\d+)', r'(?:^|\s)Leather\s+(\d+)'],
        'Timber': [r'Timber[:\s]*(\d+)', r'(?:^|\s)Timber\s+(\d+)'],
        'Lumber': [r'Lumber[:\s]*(\d+)', r'(?:^|\s)Lumber\s+(\d+)'],
        'Charcoal': [r'Charcoal[:\s]*(\d+)', r'(?:^|\s)Charcoal\s+(\d+)'],
        'Sand Flux': [r'Sand\s*Flux[:\s]*(\d+)', r'Sand.*?Flux.*?(\d+)'],
        'Obsidian Flux': [r'Obsidian\s*Flux[:\s]*(\d+)', r'Obsidian.*?Flux.*?(\d+)'],
        'Silver Ore': [r'Silver\s*Ore[:\s]*(\d+)', r'Silver.*?Ore.*?(\d+)'],
        'Gold Ore': [r'Gold\s*Ore[:\s]*(\d+)', r'Gold.*?Ore.*?(\d+)']
    }
    
    found_items = {}
    
    # Try to find items using patterns
    for item_name, patterns in item_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                quantity = int(match.group(1))
                found_items[item_name] = quantity
                break
    
    # Enhanced parsing for number patterns after item names
    number_patterns = [
        # Pattern: "Item Name: 1800" or "Item Name 1800"
        r'(Iron\s*Ore)[:\s]+(\d+)',
        r'(Orichalcum\s*Ore)[:\s]+(\d+)', 
        r'(Starmetal\s*Ore)[:\s]+(\d+)',
        r'(Steel\s*Ingot)[:\s]+(\d+)',
        # Handle OCR misreadings
        r'(lron\s*Ore)[:\s]+(\d+)',  # 'I' read as 'l'
        r'(Modium)[:\s]+(\d+)',      # Starmetal misread as Modium
        r'(RKAGKNTS)[:\s]+(\d+)',    # Reagents misread
    ]
    
    for pattern in number_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            item_text = match.group(1).strip()
            quantity = int(match.group(2))
            
            # Map OCR misreadings to correct item names
            if item_text.lower() in ['modium']:
                found_items['Starmetal Ore'] = quantity
            elif item_text.lower() in ['lron ore', 'iron ore']:
                found_items['Iron Ore'] = quantity
            elif item_text.lower() in ['orichalcum ore']:
                found_items['Orichalcum Ore'] = quantity
            elif item_text.lower() in ['steel ingot']:
                found_items['Steel Ingot'] = quantity
            elif item_text.lower() in ['rkagknts']:
                found_items['Reagents'] = quantity
    
    # Additional fallback for loose number matching
    if len(found_items) < 4:  # If we haven't found enough items
        # Look for patterns like "word number" in the text
        loose_matches = re.findall(r'([A-Za-z]+)\s+(\d+)', text)
        for word, num in loose_matches:
            if word.lower() in ['iron', 'modium', 'steel'] and int(num) > 10:
                if word.lower() == 'iron' and 'Iron Ore' not in found_items:
                    found_items['Iron Ore'] = int(num)
                elif word.lower() == 'modium' and 'Starmetal Ore' not in found_items:
                    found_items['Starmetal Ore'] = int(num)
                elif word.lower() == 'steel' and 'Steel Ingot' not in found_items:
                    found_items['Steel Ingot'] = int(num)
    
    return found_items

def format_inventory_summary(inventory: Dict[str, int], storage: Dict[str, int]) -> str:
    """Format inventory data for display."""
    result = []
    
    if inventory:
        result.append("=== INVENTORY ===")
        for item, qty in sorted(inventory.items()):
            result.append(f"{item}: {qty}")
    
    if storage:
        result.append("\n=== STORAGE ===")
        for item, qty in sorted(storage.items()):
            result.append(f"{item}: {qty}")
    
    return '\n'.join(result)

if __name__ == "__main__":
    # Your OCR data
    inventory_ocr = """INVFNTORY 1162.9/1893.5 GEAR SETS d you inuntory and do not contibuto to 65 Search @ 2 Modium 22.2 725 50.0 RASIC FOOI) 22.8 10.0 100 GS Spear 2} 71] RKAGKNTS 1.7 0 23.0 13.0 SMKI:TNG; 100 # 1.2 Evade FhT 21 723 Iuo 124.0 Iuo StA 5 80 Dex 5 INT 350 FOC 105 01 78 CON 152/ PHYS 1,742.5 198,386.65 928 / 2,500 ELEM 1,659.5 ENTEA chat ESC Back purt"""
    
    storage_ocr = """I} Ilut GPU INVENTORY 1194.1/1893.5 STORAGE SHED 4684.8/ 6575.0 Scarch 4 Search Modjum 22.2 1.2 0 , I.FNTHKRWORKING; 151.7 0 SMKI:TIN; 3.6 WRAVING; 62.0 23.0 93 98 2.2 3 WO(I)WORKING 684.8 03 0 123,6 F 101 20 00 (RAFT MODS 1,965.1 Sta DEX 5 INT 350 FOc 105 CON 152 PHYS 1,742 198,377.65 943 /2,500 Evortol (Horo) Teko Al ElEM 65 ENTEA chat ESC Back"""
    
    inventory_items = parse_inventory_ocr(inventory_ocr)
    storage_items = parse_inventory_ocr(storage_ocr)
    
    print(format_inventory_summary(inventory_items, storage_items))