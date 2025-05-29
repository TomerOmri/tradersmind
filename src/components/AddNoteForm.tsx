import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTradeStore } from "../store/tradeStore";

interface AddNoteFormProps {
  tradeId: string;
}

export default function AddNoteForm({ tradeId }: AddNoteFormProps) {
  const { t } = useTranslation();
  const addNote = useTradeStore((state) => state.addNote);
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addNote(tradeId, text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("trade.addNote")}
          className="flex-1 rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm resize-none"
          rows={2}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-colors duration-150"
        >
          {t("actions.add")}
        </button>
      </div>
    </form>
  );
}
