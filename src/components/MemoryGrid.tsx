import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  XMarkIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useMemoryStore } from "../store/memoryStore";
import { format } from "date-fns";
import { he, enUS } from "date-fns/locale";

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

interface MemoryGridProps {
  tag: string;
  stickyMessage?: string;
}

export default function MemoryGrid({ tag, stickyMessage }: MemoryGridProps) {
  const { t, i18n } = useTranslation();
  const { memories, deleteMemory } = useMemoryStore();
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

  const filteredMemories = memories.filter((memory) =>
    memory.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenImage) return;

      if (e.key === "ArrowLeft") {
        navigateImage("prev");
      } else if (e.key === "ArrowRight") {
        navigateImage("next");
      } else if (e.key === "Escape") {
        setFullscreenImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage, currentImageIndex]);

  return (
    <>
      <div className="container mx-auto p-4">
        {stickyMessage && (
          <div className="sticky top-0 z-10 bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4 shadow">
            <p className="text-yellow-800 dark:text-yellow-200">
              {stickyMessage}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">
              {t("memory.noMemories")}
            </p>
          ) : (
            filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={memory.imageData}
                    alt=""
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => handleImageClick(memory.imageData)}
                  />
                  <button
                    onClick={() => handleDeleteClick(memory.id, memory.text)}
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5 hover:bg-red-600 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    {memory.text}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {memory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(memory.createdAt), "PPP", { locale })}
                  </div>
                </div>
              </div>
            ))
          )}
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
            <ChevronLeftIcon className="h-12 w-12" />
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
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full p-1">
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
