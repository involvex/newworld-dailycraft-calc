import cv2
import easyocr
import re

def debug_ocr(image_path):
    # Load and preprocess image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.medianBlur(img, 3)
    img = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(img)
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Use EasyOCR
    reader = easyocr.Reader(['en'], verbose=False)
    results = reader.readtext(img, min_size=5, text_threshold=0.3)
    
    print("=== FULL OCR TEXT ===")
    all_text = ' '.join([text for _, text, conf in results if conf > 0.3])
    print(all_text)
    
    print("\n=== INDIVIDUAL TEXT BLOCKS ===")
    for i, (bbox, text, conf) in enumerate(results):
        if conf > 0.3:
            print(f"{i}: '{text}' (confidence: {conf:.2f})")
    
    print("\n=== NUMBERS FOUND ===")
    numbers = re.findall(r'\b\d+\b', all_text)
    print(f"All numbers: {numbers}")
    
    print("\n=== POTENTIAL ITEMS ===")
    # Look for number + word patterns
    patterns = re.findall(r'\b(\d+)\s+([A-Za-z]+)', all_text)
    for num, word in patterns:
        if int(num) > 0 and len(word) > 2:
            print(f"{word}: {num}")

if __name__ == "__main__":
    debug_ocr("image.png")