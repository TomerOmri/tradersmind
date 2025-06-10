import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTradeStore } from "../store/tradeStore";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AddNoteFormProps {
  tradeId: string;
}

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl w-full max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Full size"
          className="w-full h-full object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function AddNoteForm({ tradeId }: AddNoteFormProps) {
  const { t } = useTranslation();
  const addNote = useTradeStore((state) => state.addNote);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    // Reset error
    setError(null);

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError(t("errors.invalidImageType"));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setImage(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;

    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
        break;
      }
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    try {
      await addNote(tradeId, text, image || undefined);
      setText("");
      setImage(null);
      setImagePreview(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknown"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="flex gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          placeholder={t("trade.addNote")}
          className="flex-1 rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm resize-none"
          rows={2}
        />
        <button
          type="submit"
          disabled={!text.trim() && !image}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-colors duration-150"
        >
          {t("actions.addNewNote")}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
            <PhotoIcon className="h-5 w-5" />
            {t("actions.addImage")}
          </div>
        </label>

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-32 w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(imagePreview)}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-100 dark:bg-red-900 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </form>
  );
}
