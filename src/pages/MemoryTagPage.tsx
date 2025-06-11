import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { he, enUS } from "date-fns/locale";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import MemoryGrid from "../components/MemoryGrid";
import { useMemoryStore } from "../store/memoryStore";
import { useStickyStore } from "../store/stickyStore";
import type { StickyNote } from "../store/stickyStore";

export default function MemoryTagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { t, i18n } = useTranslation();
  const [newNote, setNewNote] = useState("");
  const { memories } = useMemoryStore();
  const { notes, addNote, removeNote, updateNote } = useStickyStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locale = i18n.language === "he" ? he : enUS;

  // Format tag for display (convert from URL format to display format)
  const displayTag = tag
    ?.replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Get the count of memories for this tag
  const memoryCount = memories.filter((memory) =>
    memory.tags.includes(displayTag || "")
  ).length;

  // Get notes for this tag
  const tagNotes = notes.filter((note) => note.tag === displayTag);

  const handleAddNote = () => {
    if (newNote.trim() && displayTag) {
      addNote(displayTag, newNote.trim());
      setNewNote("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [newNote]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link
            to="/memory"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4"
          >
            ← {t("memory.backToCategories")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayTag} ({memoryCount})
          </h1>
        </div>

        {/* Sticky Notes Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {t("memory.stickyNotes")}
            </h2>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({tagNotes.length})
            </span>
          </div>

          {/* Add Note Input */}
          <div className="flex gap-2 mb-4">
            <textarea
              ref={inputRef}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("memory.addStickyNote")}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm min-h-[2.5rem] resize-none"
              rows={1}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tagNotes.map((note) => (
              <div
                key={note.id}
                className={`${note.color} p-4 rounded-lg shadow-sm relative group`}
              >
                <button
                  onClick={() => removeNote(note.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                  {note.text}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(note.createdAt), "PPp", { locale })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Grid */}
      {displayTag && <MemoryGrid tag={displayTag} />}
    </div>
  );
}
