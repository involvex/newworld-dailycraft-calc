import { useState, useEffect } from "react";
import { QuickNote } from "../types";
import { ITEMS } from "../data/items";

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (_notes: QuickNote[]) => void;
  savedNotes: QuickNote[];
  onManualOCR: () => void;
  showPrices: boolean;
  priceData: Record<string, { price: number }>;
  findBestItemMatch: (itemName: string) => string | null;
}

export function QuickNoteModal({
  isOpen,
  onClose,
  initialContent,
  onSave,
  savedNotes,
  onManualOCR,
  showPrices,
  priceData,
  findBestItemMatch
}: QuickNoteModalProps) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleSave = () => {
    const newNote: QuickNote = {
      id: new Date().toISOString(),
      content,
      timestamp: new Date().toISOString()
    };
    onSave([newNote, ...savedNotes]);
    setContent("");
    onClose();
  };

  const handleDelete = (id: string) => {
    const updatedNotes = savedNotes.filter(note => note.id !== id);
    onSave(updatedNotes);
  };

  const handleExport = () => {
    const textToCopy = savedNotes
      .map(
        note =>
          `[${new Date(note.timestamp).toLocaleString()}]\n${note.content}`
      )
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(textToCopy);
  };

  const formatNoteWithPrices = (noteContent: string) => {
    if (!priceData || !showPrices) return noteContent;

    const lines = noteContent.split("\n");
    return lines
      .map(line => {
        const match = line.match(/^(.*?):\s*([\d,]+)$/);
        if (match) {
          const itemName = match[1].trim();
          const quantity = parseInt(match[2].replace(/,/g, ""), 10);

          const matchedId = findBestItemMatch(itemName);

          if (matchedId && priceData[matchedId]) {
            const price = priceData[matchedId].price;
            const totalPrice = price * quantity;
            return `${line} (@ ${price.toFixed(2)} each = ${totalPrice.toFixed(
              2
            )} total)`;
          }
        }
        return line;
      })
      .join("\n");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-yellow-300">Quick Note</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 text-red-100 rounded hover:bg-gray-700"
          >
            ❌
          </button>
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="OCR results will appear here..."
          className="w-full h-40 p-2 mt-4 text-white bg-gray-700 rounded"
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
          >
            💾 Save Note
          </button>
          <button
            onClick={() => setContent("")}
            className="px-4 py-2 font-bold text-white bg-red-600 rounded hover:bg-red-700"
          >
            🗑️ Clear
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            📋 Export to Clipboard
          </button>
        </div>

        <div className="flex-1 mt-6 overflow-y-auto">
          <h3 className="mb-2 text-lg font-semibold text-white">Saved Notes</h3>
          {savedNotes.length === 0 ? (
            <p className="text-gray-400">No saved notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {savedNotes.map(note => (
                <li key={note.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex items-start justify-between">
                    <pre className="font-sans text-sm text-gray-300 whitespace-pre-wrap">
                      {formatNoteWithPrices(note.content)}
                    </pre>
                    <div className="flex flex-col gap-2 pl-2">
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                      <button
                        onClick={onManualOCR}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Manual OCR
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(note.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickNoteModal;
