import cv2
import easyocr
import numpy as np

def analyze_storage_area(image_path):
    # Load image
    img = cv2.imread(image_path)
    height, width = img.shape[:2]
    
    # Crop to top-right area where storage items should be
    # Assuming storage area is in the right half, top portion
    crop_x = width // 2
    crop_y = 0
    crop_w = width // 2
    crop_h = height // 2
    
    cropped = img[crop_y:crop_y+crop_h, crop_x:crop_x+crop_w]
    
    # Convert to grayscale
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    
    # Try different preprocessing approaches
    approaches = [
        ("Original", gray),
        ("Gaussian Blur", cv2.GaussianBlur(gray, (3,3), 0)),
        ("Median Blur", cv2.medianBlur(gray, 3)),
        ("CLAHE", cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8)).apply(gray)),
        ("Threshold", cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1])
    ]
    
    reader = easyocr.Reader(['en'], verbose=False)
    
    all_results = {}
    
    for name, processed_img in approaches:
        print(f"\n=== {name.upper()} ===")
        try:
            results = reader.readtext(processed_img, min_size=1, text_threshold=0.1)
            
            texts = []
            for bbox, text, conf in results:
                if conf > 0.1 and len(text.strip()) > 0:
                    texts.append(f"'{text.strip()}' ({conf:.2f})")
            
            if texts:
                print("Detected text:")
                for text in texts[:20]:  # Show first 20 results
                    print(f"  {text}")
            else:
                print("No text detected")
                
            all_results[name] = results
            
        except Exception as e:
            print(f"Error with {name}: {e}")
    
    # Look for ore-related text in all results
    print(f"\n=== SEARCHING FOR ORES ===")
    ore_keywords = ['starmetal', 'star', 'metal', 'orichalcum', 'ori', 'iron', 'mythril', 'ore', 'ingot']
    
    for approach_name, results in all_results.items():
        found_ores = []
        for bbox, text, conf in results:
            text_lower = text.lower().strip()
            if any(keyword in text_lower for keyword in ore_keywords):
                found_ores.append(f"'{text}' ({conf:.2f})")
        
        if found_ores:
            print(f"{approach_name}: {', '.join(found_ores)}")

if __name__ == "__main__":
    analyze_storage_area("image.png")