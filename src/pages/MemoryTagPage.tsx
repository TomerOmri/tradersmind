import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { he, enUS } from "date-fns/locale";
import {
  XMarkIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import MemoryGrid from "../components/MemoryGrid";
import { useMemoryStore } from "../store/memoryStore";
import { useStickyStore } from "../store/stickyStore";
import type { StickyNote } from "../store/stickyStore";
import StickyNoteModal from "../components/StickyNoteModal";

export default function MemoryTagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { memories } = useMemoryStore();
  const { notes, addNote, removeNote } = useStickyStore();
  const locale = i18n.language === "he" ? he : enUS;
  const isRTL = i18n.dir() === "rtl";

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
  const tagNotes = notes
    .filter((note) => note.tag === displayTag)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleAddNote = (text: string) => {
    if (displayTag) {
      addNote(displayTag, text);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <Link
          to="/memory"
          className={`absolute top-6 ${
            isRTL ? "right-6" : "left-6"
          } text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`}
        >
          {isRTL ? (
            <ChevronRightIcon className="h-6 w-6" />
          ) : (
            <ChevronLeftIcon className="h-6 w-6" />
          )}
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {displayTag}
          </h1>
          <div className="flex justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {memoryCount} {t("memory.memories")}
            </span>
            <span>•</span>
            <span>
              {tagNotes.length} {t("memory.notes")}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Notes Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {t("memory.stickyNotes")}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({tagNotes.length})
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {tagNotes.map((note) => (
            <div
              key={note.id}
              className={`flex items-center gap-3 p-2.5 bg-gray-900 dark:bg-black rounded-md relative group ${
                isRTL ? "text-right" : "text-left"
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <p className="flex-1 min-w-0 text-sm text-gray-100 dark:text-gray-200 whitespace-pre-wrap break-words leading-snug">
                {note.text}
              </p>
              <button
                onClick={() => removeNote(note.id)}
                className="text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Memory Grid */}
      {displayTag && <MemoryGrid tag={displayTag} />}

      {/* Add Note Modal */}
      <StickyNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNote}
      />
    </div>
  );
}
