import json
from typing import Dict, List
from parse_inventory import parse_inventory_ocr, format_inventory_summary

def create_inventory_json(inventory_data: Dict[str, int]) -> str:
    """Convert inventory data to JSON format for the crafting calculator."""
    
    # Map item names to their IDs (based on your items.ts structure)
    item_id_mapping = {
        'Starmetal Ore': 'starmetalOre',
        'Iron Ore': 'ironOre',
        'Orichalcum Ore': 'orichalcumOre',
        'Mythril Ore': 'mythrilOre',
        'Steel Ingot': 'steelIngot',
        'Iron Ingot': 'ironIngot',
        'Starmetal Ingot': 'starmetalIngot',
        'Orichalcum Ingot': 'orichalcumIngot',
        'Reagents': 'reagents',
        'Obsidian Flux': 'obsidianFlux',
        'Sand Flux': 'sandFlux',
        'Charcoal': 'charcoal',
        'Silk': 'silk',
        'Leather': 'leather',
        'Timber': 'timber',
        'Lumber': 'lumber'
    }
    
    inventory_json = {}
    for item_name, quantity in inventory_data.items():
        item_id = item_id_mapping.get(item_name, item_name.lower().replace(' ', ''))
        inventory_json[item_id] = quantity
    
    return json.dumps(inventory_json, indent=2)

def suggest_crafting_options(inventory: Dict[str, int]) -> List[str]:
    """Suggest what can be crafted with current inventory."""
    suggestions = []
    
    if inventory.get('Starmetal Ore', 0) >= 4:
        ore_count = inventory['Starmetal Ore']
        ingots_possible = ore_count // 4
        suggestions.append(f"Can craft {ingots_possible} Starmetal Ingot(s) (need 4 ore each)")
    
    if inventory.get('Reagents', 0) > 0:
        suggestions.append(f"Have {inventory['Reagents']} Reagent(s) for advanced crafting")
    
    return suggestions

def main():
    # Your OCR data
    inventory_ocr = """INVFNTORY 1162.9/1893.5 GEAR SETS d you inuntory and do not contibuto to 65 Search @ 2 Modium 22.2 725 50.0 RASIC FOOI) 22.8 10.0 100 GS Spear 2} 71] RKAGKNTS 1.7 0 23.0 13.0 SMKI:TNG; 100 # 1.2 Evade FhT 21 723 Iuo 124.0 Iuo StA 5 80 Dex 5 INT 350 FOC 105 01 78 CON 152/ PHYS 1,742.5 198,386.65 928 / 2,500 ELEM 1,659.5 ENTEA chat ESC Back purt"""
    
    storage_ocr = """I} Ilut GPU INVENTORY 1194.1/1893.5 STORAGE SHED 4684.8/ 6575.0 Scarch 4 Search Modjum 22.2 1.2 0 , I.FNTHKRWORKING; 151.7 0 SMKI:TIN; 3.6 WRAVING; 62.0 23.0 93 98 2.2 3 WO(I)WORKING 684.8 03 0 123,6 F 101 20 00 (RAFT MODS 1,965.1 Sta DEX 5 INT 350 FOc 105 CON 152 PHYS 1,742 198,377.65 943 /2,500 Evortol (Horo) Teko Al ElEM 65 ENTEA chat ESC Back"""
    
    # Parse inventory
    inventory_items = parse_inventory_ocr(inventory_ocr)
    storage_items = parse_inventory_ocr(storage_ocr)
    
    # Combine inventory and storage
    all_items = {**inventory_items, **storage_items}
    
    print("=== PARSED INVENTORY ===")
    print(format_inventory_summary(inventory_items, storage_items))
    
    print("\n=== JSON FOR CRAFTING CALCULATOR ===")
    print(create_inventory_json(all_items))
    
    print("\n=== CRAFTING SUGGESTIONS ===")
    suggestions = suggest_crafting_options(all_items)
    for suggestion in suggestions:
        print(f"• {suggestion}")

if __name__ == "__main__":
    main()