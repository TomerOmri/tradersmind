import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useMemoryStore } from "../store/memoryStore";
import { format } from "date-fns";
import { he, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface TagCount {
  tag: string;
  count: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memoryText: string;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  memoryText,
}: DeleteModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("memory.deleteConfirm")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {memoryText}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            {t("actions.cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
          >
            {t("actions.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProceduralMemory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { memories, addMemory, deleteMemory } = useMemoryStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newText, setNewText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memoryId: string;
    text: string;
  }>({
    isOpen: false,
    memoryId: "",
    text: "",
  });
  const locale = i18n.language === "he" ? he : enUS;

  // Calculate tag counts
  const tagCounts: TagCount[] = Array.from(
    memories.reduce((acc, memory) => {
      memory.tags.forEach((tag) => {
        acc.set(tag, (acc.get(tag) || 0) + 1);
      });
      return acc;
    }, new Map<string, number>())
  )
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const filteredMemories = memories.filter((memory) =>
    selectedTags.length === 0
      ? true
      : selectedTags.some((tag) => memory.tags.includes(tag))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenImage) return;

      if (e.key === "Escape") {
        setFullscreenImage(null);
      } else if (e.key === "ArrowLeft") {
        navigateImage("prev");
      } else if (e.key === "ArrowRight") {
        navigateImage("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage, currentImageIndex, filteredMemories]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;

          if (file.size > 5 * 1024 * 1024) {
            alert(t("errors.imageTooLarge"));
            return;
          }

          setPreviewUrl(URL.createObjectURL(file));
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [t]);

  const handleAddTag = () => {
    if (newTag && !availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
      setSelectedTags([...selectedTags, newTag]);
      setNewTag("");
    }
  };

  const handleSubmit = async () => {
    if (!previewUrl || !newText || selectedTags.length === 0) return;

    // Find the original tag cases from availableTags
    const originalCaseTags = selectedTags.map(
      (tag) =>
        availableTags.find((t) => t.toLowerCase() === tag.toLowerCase()) || tag
    );

    addMemory({
      imageUrl: previewUrl,
      text: newText,
      tags: originalCaseTags,
    });

    setPreviewUrl(null);
    setNewText("");
    setSelectedTags([]);
  };

  const handleImageClick = (imageData: string) => {
    setFullscreenImage(imageData);
    setCurrentImageIndex(
      filteredMemories.findIndex((m) => m.imageData === imageData)
    );
  };

  const navigateImage = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (currentImageIndex - 1 + filteredMemories.length) %
          filteredMemories.length
        : (currentImageIndex + 1) % filteredMemories.length;
    setCurrentImageIndex(newIndex);
    setFullscreenImage(filteredMemories[newIndex].imageData);
  };

  // Get all unique tags from memories
  const allTags = Array.from(
    new Set(memories.flatMap((memory) => memory.tags))
  ).filter((tag) => !availableTags.includes(tag));

  // Add any new tags to available tags
  if (allTags.length > 0) {
    setAvailableTags([...availableTags, ...allTags]);
  }

  const handleDeleteClick = (id: string, text: string) => {
    setDeleteModal({
      isOpen: true,
      memoryId: id,
      text,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMemory(deleteModal.memoryId);
  };

  const handleTagClick = (tag: string) => {
    const formattedTag = tag.toLowerCase().replace(/\s+/g, "_");
    navigate(`/memory/${formattedTag}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t("errors.imageTooLarge"));
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            {/* Image Preview and Text Input */}
            <div className="flex-1">
              <div className="flex gap-4">
                {previewUrl ? (
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="rounded-lg w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      document.getElementById("imageUpload")?.click()
                    }
                    className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      {t("actions.addImage")}
                      <span className="text-[10px] mt-1 opacity-75">
                        CTRL/CMD+V
                      </span>
                    </div>
                  </div>
                )}
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={t("memory.description")}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  rows={3}
                />
              </div>
            </div>

            {/* Tags Input */}
            <div className="flex flex-col gap-2 md:w-64">
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const isSelected = selectedTags.includes(tag);
                      setSelectedTags(
                        isSelected
                          ? selectedTags.filter((t) => t !== tag)
                          : [...selectedTags, tag]
                      );
                    }}
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedTags.includes(tag)
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t("trade.newTag")}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!previewUrl || !newText || selectedTags.length === 0}
                className="w-full px-3 py-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title={
                  !previewUrl
                    ? t("memory.needImage")
                    : !newText
                    ? t("memory.needDescription")
                    : selectedTags.length === 0
                    ? t("memory.needTag")
                    : ""
                }
              >
                {t("memory.save")}
              </button>
            </div>
          </div>
        </div>

        {/* Tag Menu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t("memory.categories")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tagCounts.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">{tag}</span>
                <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-4 text-white">
            <p className="text-lg max-w-3xl mx-auto text-center">
              {filteredMemories[currentImageIndex].text}
            </p>
          </div>
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full p-1"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <button
            onClick={() => navigateImage("prev")}
            className="absolute left-4 text-white hover:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full p-1"
          >
            <ChevronLeftIcon className="h-12 w-12 text-white" />
          </button>
          <button
            onClick={() => navigateImage("next")}
            className="absolute right-4 text-white hover:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full p-1"
          >
            <ChevronRightIcon className="h-12 w-12" />
          </button>
          <img
            src={fullscreenImage}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain mt-16"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {currentImageIndex + 1} / {filteredMemories.length}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, memoryId: "", text: "" })
        }
        onConfirm={handleDeleteConfirm}
        memoryText={deleteModal.text}
      />
    </>
  );
}
