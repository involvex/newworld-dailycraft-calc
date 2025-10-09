import { useCallback } from "react";
import { ITEM_MAPPINGS } from "../constants";
import { analyzeInventoryImage } from "../services/geminiService";
import { AnalyzedItem, Item } from "../types";

interface UseInventoryOCRProps {
  setOCREditText: (_text: string) => void;
  setShowOCREdit: (_show: boolean) => void;
  setIsProcessingOCR: (_isProcessing: boolean) => void;
  geminiApiKey: string | undefined; // New prop
  debugOCRPreview: boolean | undefined; // New prop
  onOCRComplete?: (_result: string) => void; // New optional prop
  items: Record<string, Item>;
}

const useInventoryOCR = ({
  setOCREditText,
  setShowOCREdit,
  setIsProcessingOCR,
  geminiApiKey, // Destructure new prop
  debugOCRPreview, // Destructure new prop
  onOCRComplete, // Destructure new prop
  items
}: UseInventoryOCRProps) => {
  const findBestItemMatch = (itemNameRaw: string): string | null => {
    let matchedItemId: string | null = null;
    let bestMatchScore = 0;
    const lowerItemName = itemNameRaw.toLowerCase().trim();

    const exactMapping = (ITEM_MAPPINGS as Record<string, string>)[
      lowerItemName
    ];
    if (exactMapping) {
      return exactMapping;
    }

    for (const item of Object.values(items)) {
      const itemNameLower = item.name.toLowerCase();
      const score = calculateMatchScore(lowerItemName, itemNameLower);
      if (score > bestMatchScore && score > 0.85) {
        matchedItemId = item.id;
        bestMatchScore = score;
      }
    }
    return matchedItemId;
  };

  const calculateMatchScore = (text1: string, text2: string): number => {
    if (text1 === text2) return 1.0;
    if (text1.includes(text2) || text2.includes(text1)) return 0.9;
    const distance = getLevenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    return 1 - distance / maxLength;
  };

  const getLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));
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

  const processImage = useCallback(
    async (imageSrc: string) => {
      try {
        console.log("processImage: Setting setIsProcessingOCR(true)");
        setIsProcessingOCR(true);
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D context for canvas");
        ctx.drawImage(img, 0, 0);

        if (debugOCRPreview) {
          // Use debugOCRPreview prop
          const debugImg = document.getElementById(
            "ocr-debug-image"
          ) as HTMLImageElement;
          if (debugImg) {
            debugImg.src = canvas.toDataURL("image/png");
          } else {
            const newDebugImg = document.createElement("img");
            newDebugImg.id = "ocr-debug-image";
            newDebugImg.src = canvas.toDataURL("image/png");
            newDebugImg.style.position = "fixed";
            newDebugImg.style.top = "10px";
            newDebugImg.style.left = "10px";
            newDebugImg.style.zIndex = "9999";
            newDebugImg.style.border = "5px solid red";
            newDebugImg.style.width = "50%";
            document.body.appendChild(newDebugImg);
          }
          setShowOCREdit(true);
          setOCREditText(
            "Debug preview is active. Close this modal to continue analysis."
          );

          // Wait for the modal to be closed by checking if the modal is still open
          await new Promise<void>(resolve => {
            const checkModalClosed = () => {
              // Check if the modal is still showing by looking for modal-specific elements
              const modal = document.querySelector(".fixed.inset-0.z-50"); // Modal overlay
              if (
                !modal ||
                modal.classList.contains("hidden") ||
                window.getComputedStyle(modal).display === "none"
              ) {
                resolve();
              } else {
                setTimeout(checkModalClosed, 500);
              }
            };
            checkModalClosed();
          });
        }

        const base64Image = canvas.toDataURL("image/png").split(",")[1];

        if (!geminiApiKey) {
          // Use geminiApiKey prop
          throw new Error(
            "Gemini API Key is not configured. Please go to Settings and enter your API Key."
          );
        }
        console.log(
          "analyzing image using gemini api with API_KEY :" + geminiApiKey
        );
        const analyzedItems: AnalyzedItem[] = await analyzeInventoryImage(
          base64Image,
          geminiApiKey
        ); // Use geminiApiKey prop

        const foundItems: Record<string, number> = {};
        for (const item of analyzedItems) {
          const matchedId = findBestItemMatch(item.itemName);
          if (matchedId) {
            foundItems[matchedId] =
              (foundItems[matchedId] || 0) + item.quantity;
          }
        }

        const totalFound = Object.keys(foundItems).length;
        let suggestions: string;
        if (totalFound > 0) {
          suggestions =
            `🎯 Found ${totalFound} items!\n\n` +
            Object.entries(foundItems)
              .map(([id, qty]) => {
                const item = items[id];
                return `${item ? item.name : id}: ${qty.toLocaleString()}`;
              })
              .join("\n") +
            "\n\n💡 Review and edit if needed.";
        } else {
          suggestions = "📝 No items detected automatically.";
        }

        if (onOCRComplete) {
          onOCRComplete(suggestions);
        } else {
          setOCREditText(suggestions);
          setShowOCREdit(true);
        }
      } catch (error) {
        console.error("AI OCR Error:", error);
        const errorMsg =
          error instanceof Error ? error.message : "An unknown error occurred.";
        if (onOCRComplete) {
          onOCRComplete(`Error: ${errorMsg}`);
        } else {
          setOCREditText(errorMsg);
          setShowOCREdit(true);
        }
      } finally {
        console.log("processImage: Setting setIsProcessingOCR(false)");
        setIsProcessingOCR(false);
      }
    },
    [
      geminiApiKey,
      debugOCRPreview,
      setIsProcessingOCR,
      setOCREditText,
      setShowOCREdit,
      onOCRComplete,
      items
    ]
  );

  const captureAndProcessScreenshot = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.runPSScript("fokusnewworldscreenshot.ps1");
      const imageSrc = "screenshot.png?t=" + new Date().getTime();
      await processImage(imageSrc);
    }
  }, [processImage]);

  const processClipboardImage = useCallback(async () => {
    if (window.electronAPI) {
      const imageSrc = await window.electronAPI.readClipboardImage();
      if (imageSrc) {
        await processImage(imageSrc);
      } else {
        if (onOCRComplete) {
          onOCRComplete("No image found in clipboard.");
        } else {
          setOCREditText("No image found in clipboard.");
          setShowOCREdit(true);
        }
      }
    }
  }, [processImage, setOCREditText, setShowOCREdit, onOCRComplete]);

  const parseManualInventory = (text: string): Record<string, number> => {
    const foundItems: Record<string, number> = {};
    const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
    for (const line of lines) {
      const match = line.match(
        /^(.+?)\s*[:xX]?\s*(\d{1,6}(?:[.,]\d{1,3})?)\s*$/
      );
      if (match) {
        const itemNameRaw = match[1].trim();
        const quantityStr = match[2].replace(/[.,]/g, "");
        const quantity = parseInt(quantityStr, 10);
        if (!isNaN(quantity) && quantity > 0) {
          const matchedId = findBestItemMatch(itemNameRaw);
          if (matchedId) {
            foundItems[matchedId] = (foundItems[matchedId] || 0) + quantity;
          }
        }
      }
    }
    return foundItems;
  };
  const captureAndProcessScreenshotForQuickNote = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.runPSScript("fokusnewworldscreenshot.ps1");
      const imageSrc = "screenshot.png?t=" + new Date().getTime();
      await processImage(imageSrc);
    }
  }, [processImage]);

  return {
    captureAndProcessScreenshot,
    processClipboardImage,
    parseManualInventory,
    captureAndProcessScreenshotForQuickNote
  };
};

export default useInventoryOCR;
