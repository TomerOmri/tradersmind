import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, FaceSmileIcon } from "@heroicons/react/24/outline";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface StickyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
}

export default function StickyNoteModal({
  isOpen,
  onClose,
  onAdd,
}: StickyNoteModalProps) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRTL = i18n.dir() === "rtl";

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const addEmoji = (emoji: any) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          {t("memory.addNewNote")}
        </h2>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("memory.notePlaceholder")}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none min-h-[100px] text-sm ${
              isRTL ? "text-right" : "text-left"
            }`}
            dir={isRTL ? "rtl" : "ltr"}
          />

          <div className="absolute bottom-2 left-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0">
              <Picker
                data={data}
                onEmojiSelect={addEmoji}
                theme={
                  document.documentElement.classList.contains("dark")
                    ? "dark"
                    : "light"
                }
              />
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("actions.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
