import React, { useState, useRef, useEffect } from "react";
import { useTagStore } from "../store/tagStore";
import { PlusIcon, XMarkIcon, TagIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface TagManagerProps {
  tradeId: string;
}

const PRESET_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
];

export default function TagManager({ tradeId }: TagManagerProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addTag, addTradeTag, removeTradeTag, getTagsForTrade } =
    useTagStore();

  const tradeTags = getTagsForTrade(tradeId);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdding(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const color =
      PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    const newTag = addTag(newTagName.trim(), color);
    addTradeTag(tradeId, newTag.id);
    setIsAdding(false);
    setNewTagName("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence>
        {tradeTags.map((tag) => (
          <motion.span
            key={tag.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${tag.color} hover:shadow-sm`}
          >
            {tag.name}
            <button
              onClick={() => removeTradeTag(tradeId, tag.id)}
              className="ms-2.5 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors dark:bg-gray-800"
            >
              <XMarkIcon className="h-2.5 w-2.5" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="relative" ref={dropdownRef}>
        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="block w-32 rounded-lg border-0 py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 dark:bg-gray-800/90 backdrop-blur-sm"
                placeholder={t("trade.newTag")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                  if (e.key === "Escape") setIsAdding(false);
                }}
              />
              <TagIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-md text-gray-900 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={t("trade.addTag")}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
