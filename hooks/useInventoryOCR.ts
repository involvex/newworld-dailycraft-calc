import { useCallback } from 'react';
import { ITEMS } from '../data/items';
import { ITEM_MAPPINGS } from '../constants';
import Tesseract from 'tesseract.js';

declare global {
  interface Window {
    electronAPI?: {
      getDesktopSources: () => Promise<any[]>;
      onTriggerOCR: (callback: () => void) => void;
      onShowSettings: (callback: () => void) => void;
      onShowAbout: (callback: () => void) => void;
    };
  }
}

interface UseInventoryOCRProps {
  setOCREditText: (text: string) => void;
  setShowOCREdit: (show: boolean) => void;
  setIsProcessingOCR: (isProcessing: boolean) => void;
}

const useInventoryOCR = ({
  setOCREditText,
  setShowOCREdit,
  setIsProcessingOCR,
}: UseInventoryOCRProps) => {
  const parseInventoryOCR = useCallback((ocrText: string) => {
    const foundItems: Record<string, number> = {};
    const lines = ocrText.split(/[\n\r]+/).filter(line => line.trim().length > 0);

    // Enhanced regex patterns for different formats
    const patterns = [
      // Standard format: "Item Name: 123" or "Item Name 123"
      /^(.+?)\s*[:xX]?\s*(\d{1,6}(?:[.,]\d{1,3})?)\s*$/,
      // Format with quantity first: "123 Item Name" or "123x Item Name"
      /^(\d{1,6}(?:[.,]\d{1,3})?)\s*[xX]?\s*(.+?)\s*$/,
      // Format with parentheses: "Item Name (123)"
      /^(.+?)\s*\((\d{1,6}(?:[.,]\d{1,3})?)\)\s*$/
    ];

    for (const line of lines) {
      const cleanLine = line.trim().replace(/[^\w\s:.,()xX]/g, '');
      
      // Skip obvious non-item lines
      if (cleanLine.length < 3 || cleanLine.length > 60) continue;
      if (/^(inventory|storage|guild|company|house|shed|chest|container)/i.test(cleanLine)) continue;
      if (/^(fps|cpu|gpu|ram|ping|ms)/i.test(cleanLine)) continue;

      let itemNameRaw = '';
      let quantityStr = '';
      let matched = false;

      // Try each pattern
      for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          if (pattern === patterns[1]) { // Quantity first format
            quantityStr = match[1];
            itemNameRaw = match[2];
          } else {
            itemNameRaw = match[1];
            quantityStr = match[2];
          }
          matched = true;
          break;
        }
      }

      if (!matched) continue;

      // Clean and validate quantity
      const cleanQuantityStr = quantityStr.replace(/[.,]/g, '');
      const quantity = parseInt(cleanQuantityStr, 10);

      if (isNaN(quantity) || quantity <= 0 || quantity > 999999) {
        continue;
      }

      // Clean item name
      itemNameRaw = itemNameRaw.trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();

      if (itemNameRaw.length < 2) continue;

      let matchedItemId: string | null = null;
      let bestMatchScore = 0;

      // Enhanced matching with scoring
      for (const [key, itemId] of Object.entries(ITEM_MAPPINGS)) {
        const lowerKey = key.toLowerCase();
        const score = calculateMatchScore(itemNameRaw, lowerKey);
        
        if (score > bestMatchScore && score > 0.7) { // Require 70% match
          matchedItemId = itemId;
          bestMatchScore = score;
        }
      }

      // Fallback to ITEMS lookup if no mapping found
      if (!matchedItemId && bestMatchScore < 0.7) {
        for (const item of Object.values(ITEMS)) {
          const itemNameLower = item.name.toLowerCase();
          const score = calculateMatchScore(itemNameRaw, itemNameLower);
          
          if (score > bestMatchScore && score > 0.6) { // Lower threshold for direct item names
            matchedItemId = item.id;
            bestMatchScore = score;
          }
        }
      }

      if (matchedItemId) {
        foundItems[matchedItemId] = (foundItems[matchedItemId] || 0) + quantity;
      }
    }
    return foundItems;
  }, []);

  // Helper function to calculate string similarity
  const calculateMatchScore = (text1: string, text2: string): number => {
    if (text1 === text2) return 1.0;
    if (text1.includes(text2) || text2.includes(text1)) return 0.9;
    
    // Levenshtein distance based scoring
    const distance = getLevenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    return 1 - (distance / maxLength);
  };

  const getLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const captureAndProcessScreenshot = useCallback(async () => {
    // Implement your screenshot capture and processing logic here
    try {
      setIsProcessingOCR(true);
      
      // Check if we're in Electron
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      let stream;
      
      if (isElectron && window.electronAPI) { // Added null check for window.electronAPI
        // Use Electron's desktopCapturer
        const sources = await window.electronAPI.getDesktopSources();
        console.log('Available sources:', sources.map((s: any) => s.name)); // Explicitly type 's'
        
        const primaryScreen = sources.find((source: any) => // Explicitly type 'source'
          source.name.toLowerCase().includes('screen') ||
          source.name.toLowerCase().includes('entire') ||
          source.id.includes('screen')
        ) || sources[0]; // Fallback to first source
        
        if (primaryScreen) {
          console.log('Using source:', primaryScreen.name);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              ...( { chromeMediaSource: 'desktop', chromeMediaSourceId: primaryScreen.id } as any), // Cast to any
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            }
          });
        } else {
          throw new Error(`No screen source found. Available: ${sources.map((s: any) => s.name).join(', ')}`); // Explicitly type 's'
        }
      } else {
        // Use web API
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { 
            width: { ideal: 1920, max: 1920 }, 
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 1, max: 5 }
          },
          audio: false
        });
      }
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(reject);
        video.onerror = reject;
        setTimeout(reject, 5000);
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) { // Null check
        throw new Error('Could not get 2D context for canvas');
      }
      
      ctx.drawImage(video, 0, 0);
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      
      // Focus on inventory area - crop to center portion where inventory typically is
      const cropX = Math.floor(canvas.width * 0.2);
      const cropY = Math.floor(canvas.height * 0.3);
      const cropWidth = Math.floor(canvas.width * 0.6);
      const cropHeight = Math.floor(canvas.height * 0.4);
      
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      if (!croppedCtx) { // Null check
        throw new Error('Could not get 2D context for cropped canvas');
      }
      
      croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Enhanced image preprocessing for better OCR
      const imageData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);
      const data = imageData.data;
      
      // Apply enhanced preprocessing with adaptive thresholding
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        
        // Convert to grayscale using luminance formula
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Adaptive thresholding - adjust based on local contrast
        let threshold: number;
        if (gray > 180) {
          threshold = 255; // Very bright - keep white
        } else if (gray > 120) {
          threshold = gray > 140 ? 255 : 0; // Medium brightness - threshold
        } else if (gray > 80) {
          threshold = 0; // Dark text - make black
        } else {
          threshold = 0; // Very dark - keep black
        }
        
        // Apply slight contrast enhancement
        const enhanced = threshold === 255 ? 255 : Math.max(0, threshold - 20);
        
        data[i] = data[i + 1] = data[i + 2] = enhanced;
        data[i + 3] = 255; // Full opacity
      }
      croppedCtx.putImageData(imageData, 0, 0);
      
      // Scale up significantly for better OCR accuracy
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = cropWidth * 3; // Increased scaling
      scaledCanvas.height = cropHeight * 3;
      const scaledCtx = scaledCanvas.getContext('2d');
      
      if (!scaledCtx) {
        throw new Error('Could not get 2D context for scaled canvas');
      }
      
      // Use better interpolation for text
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = 'high';
      scaledCtx.drawImage(croppedCanvas, 0, 0, cropWidth * 3, cropHeight * 3);
      
      // Enhanced Tesseract configuration for inventory text
      const { data: { text } } = await Tesseract.recognize(scaledCanvas.toDataURL('image/png'), 'eng', {
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :.,()-\'',
        tessedit_ocr_engine_mode: '2', // Neural nets LSTM engine
        preserve_interword_spaces: '1',
        user_defined_dpi: '300', // High DPI for better accuracy
        tessedit_write_images: '0', // Don't save debug images
        textord_min_linesize: '2.5' // Minimum line size
      } as any);
      
      // Enhanced text filtering and cleaning
      const cleanedText = text.split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Length checks
          if (line.length < 3 || line.length > 50) return false;
          
          // Must contain at least one digit
          if (!/\d/.test(line)) return false;
          
          // Filter out UI elements and game interface text
          const lowerLine = line.toLowerCase();
          const filterWords = [
            'fps', 'cpu', 'gpu', 'ram', 'ping', 'ms', 'inventory', 'decorate',
            'smelting', 'leatherworking', 'fishing', 'cooking', 'arcana',
            'weaponsmithing', 'armoring', 'jewelcrafting', 'engineering',
            'furnishing', 'stonecutting', 'weaving', 'storage', 'shed',
            'chest', 'container', 'guild', 'company', 'house', 'level',
            'xp', 'experience', 'skill', 'weight', 'capacity', 'encumbered',
            'overweight', 'fast', 'travel', 'territory', 'settlement',
            'faction', 'pvp', 'war', 'outpost', 'rush'
          ];
          
          return !filterWords.some(word => lowerLine.includes(word));
        })
        .join('\n');

      // Attempt to parse items using the improved parseInventoryOCR
      const parsedItems = parseInventoryOCR(cleanedText);
      const totalFound = Object.keys(parsedItems).length;

      let suggestions: string;
      if (totalFound > 0) {
        suggestions = `🎯 Found ${totalFound} items from your inventory!\n\n` +
          Object.entries(parsedItems).map(([id, qty]) => {
            const item = ITEMS[id];
            return `${item ? item.name : id}: ${qty.toLocaleString()}`;
          }).join('\n') +
          '\n\n💡 Review and edit quantities if needed, then click "Apply to Inventory".';
      } else {
        // Provide better fallback suggestions
        suggestions = `📝 No items detected automatically. Enter your items manually:\n\n` +
          `Examples:\n` +
          `Iron Ore: 1800\n` +
          `Orichalcum Ore: 635\n` +
          `Starmetal Ore: 86\n` +
          `Steel Ingot: 72\n` +
          `Thick Hide: 450\n` +
          `Fiber: 2100\n\n` +
          `💡 Use format: "Item Name: Quantity" (one per line)`;
      }

      setOCREditText(suggestions);
      setShowOCREdit(true);
    } catch (error) {
      console.error('OCR Error:', error);
      const isElectronCheck = typeof window !== 'undefined' && window.electronAPI;
      
      let errorMsg: string;
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          errorMsg = '🚫 Screen capture permission denied. Please allow screen capture and try again.';
        } else if (error.message.includes('NotFoundError')) {
          errorMsg = '📺 No screen source found. Make sure New World is open and visible.';
        } else if (error.message.includes('AbortError')) {
          errorMsg = '⏰ Screen capture was cancelled or timed out. Try again.';
        } else {
          errorMsg = isElectronCheck
            ? '❌ OCR scanning failed. Ensure New World inventory is open and visible on screen.'
            : '❌ Screen capture failed. Make sure your browser tab is visible and try again.';
        }
      } else {
        errorMsg = '❌ Unexpected error during OCR scanning.';
      }
      
      setOCREditText(errorMsg + '\n\n📝 Enter your items manually:\n\n' +
        'Iron Ore: 1800\n' +
        'Orichalcum Ore: 635\n' +
        'Starmetal Ore: 86\n' +
        'Steel Ingot: 72\n\n' +
        '💡 Use format: "Item Name: Quantity" (one per line)');
      setShowOCREdit(true);
    } finally {
      setIsProcessingOCR(false);
    }
  }, [parseInventoryOCR, setOCREditText, setShowOCREdit, setIsProcessingOCR]);

  return {
    captureAndProcessScreenshot,
    parseInventoryOCR,
    ocrEditText: '', // Provide a default value or fetch from state
    setOCREditText,
    setShowOCREdit,
  };
};

export default useInventoryOCR;
