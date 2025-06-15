import { useState } from "react";
import React from "react";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import {
  useWatchStore,
  type WatchStatus,
  type WatchNote,
} from "../store/watchStore";

function AddWatchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [symbol, setSymbol] = useState("");
  const [statuses, setStatuses] = useState<WatchStatus[]>([]);
  const addWatch = useWatchStore((state) => state.addWatch);
  const isRTL = i18n.dir() === "rtl";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      addWatch(symbol.toUpperCase().trim(), statuses);
      setSymbol("");
      setStatuses([]);
      onClose();
    }
  };

  const toggleStatus = (status: WatchStatus) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("watch.addWatch")}
        </h2>
        <form onSubmit={handleSubmit} className={isRTL ? "rtl" : "ltr"}>
          <div className="mb-4">
            <label
              htmlFor="symbol"
              className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
            >
              {t("watch.symbol")}
            </label>
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700"
              placeholder="AAPL"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("watch.status")}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleStatus("SETUP_SUCCESS")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  statuses.includes("SETUP_SUCCESS")
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800 dark:text-gray-300 dark:bg-gray-700"
                }`}
              >
                {t("watch.statuses.setupSuccess")}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus("TIP")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  statuses.includes("TIP")
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800 dark:text-gray-300 dark:bg-gray-700"
                }`}
              >
                {t("watch.statuses.tip")}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus("WATCHING")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  statuses.includes("WATCHING")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800 dark:text-gray-300 dark:bg-gray-700"
                }`}
              >
                {t("watch.statuses.watching")}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus("FAILED")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  statuses.includes("FAILED")
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800 dark:text-gray-300 dark:bg-gray-700"
                }`}
              >
                {t("watch.statuses.failed")}
              </button>
            </div>
          </div>
          <div
            className={`flex justify-end gap-3 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              {t("actions.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddNoteModal({
  watchId,
  noteToEdit,
  onClose,
}: {
  watchId: string;
  noteToEdit?: WatchNote;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState(noteToEdit?.content || "");
  const [status, setStatus] = useState<WatchStatus>(
    noteToEdit?.status || "WATCHING"
  );
  const { addNote, updateNote } = useWatchStore();
  const isRTL = i18n.dir() === "rtl";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      if (noteToEdit) {
        updateNote(watchId, noteToEdit.id, { content: content.trim(), status });
      } else {
        addNote(watchId, content.trim(), status);
      }
      setContent("");
      setStatus("WATCHING");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl transform transition-all">
        <div
          className={`flex items-center justify-between mb-6 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {noteToEdit ? t("actions.edit") : t("actions.addNote")}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className={isRTL ? "rtl" : "ltr"}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("watch.status")}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatus("SETUP_SUCCESS")}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  status === "SETUP_SUCCESS"
                    ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}
              >
                {t("watch.statuses.setupSuccess")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("TIP")}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  status === "TIP"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}
              >
                {t("watch.statuses.tip")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("WATCHING")}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  status === "WATCHING"
                    ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}
              >
                {t("watch.statuses.watching")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("FAILED")}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  status === "FAILED"
                    ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}
              >
                {t("watch.statuses.failed")}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t("watch.notes")}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={4}
              placeholder={t("trade.addNote")}
            />
          </div>
          <div
            className={`flex justify-end gap-3 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {noteToEdit ? t("actions.save") : t("actions.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Process() {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isAddingWatch, setIsAddingWatch] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    watchId: string;
    note?: WatchNote;
  } | null>(null);
  const { watches, removeWatch, removeNote } = useWatchStore();
  const isRTL = i18n.dir() === "rtl";

  const sortedWatches = [...watches].sort((a, b) => {
    const aLatestNote = a.notes[0]?.createdAt
      ? new Date(a.notes[0].createdAt).getTime()
      : 0;
    const bLatestNote = b.notes[0]?.createdAt
      ? new Date(b.notes[0].createdAt).getTime()
      : 0;
    return bLatestNote - aLatestNote;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: WatchStatus) => {
    switch (status) {
      case "SETUP_SUCCESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
            {t("watch.statuses.setupSuccess")}
          </span>
        );
      case "TIP":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
            {t("watch.statuses.tip")}
          </span>
        );
      case "WATCHING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
            {t("watch.statuses.watching")}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
            {t("watch.statuses.failed")}
          </span>
        );
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 ${
        isRTL ? "rtl" : "ltr"
      }`}
    >
      <main className="flex-1 w-full px-4 py-8">
        <div className="w-full max-w-[2000px] mx-auto space-y-8">
          <div
            className={`flex justify-between items-center ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={() => setIsAddingWatch(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4" />
              {t("actions.addWatch")}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-right">
                {t("watch.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
                {t("watch.description")}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="w-8 px-1" />
                  <th
                    className={`w-24 px-3 py-3.5 text-sm font-medium text-gray-500 dark:text-gray-400 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.status")}
                  </th>
                  <th
                    className={`w-32 px-3 py-3.5 text-sm font-medium text-gray-500 dark:text-gray-400 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.symbol")}
                  </th>
                  <th
                    className={`px-3 py-3.5 text-sm font-medium text-gray-500 dark:text-gray-400 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.latestNote")}
                  </th>
                  <th className="w-16 px-1" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedWatches.map((watch) => (
                  <React.Fragment key={watch.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-1">
                        <button
                          onClick={() => toggleExpand(watch.id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 transition-colors"
                        >
                          {expanded[watch.id] ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {watch.notes.length > 0 &&
                            getStatusBadge(watch.notes[0].status)}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {watch.symbol}
                          </span>
                          {watch.notes.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                              {watch.notes.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {watch.notes.length > 0 ? (
                          <div className="truncate max-w-xl text-gray-600 dark:text-gray-300">
                            {watch.notes[0].content}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            {t("watch.noNotes")}
                          </span>
                        )}
                      </td>

                      <td className="px-1">
                        <button
                          onClick={() => removeWatch(watch.id)}
                          className="p-1.5 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title={t("actions.delete")}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {expanded[watch.id] && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50"
                        >
                          <div className={`space-y-4 ${isRTL ? "rtl" : "ltr"}`}>
                            <div
                              className={`flex justify-between items-center ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {t("watch.notes")}
                              </h3>
                              <button
                                onClick={() =>
                                  setNoteModal({ watchId: watch.id })
                                }
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors ${
                                  isRTL ? "flex-row-reverse" : ""
                                }`}
                              >
                                <PlusIcon className="h-3 w-3" />
                                {t("actions.addNote")}
                              </button>
                            </div>
                            {watch.notes.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("watch.noNotes")}
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {[...watch.notes].reverse().map((note) => (
                                  <div
                                    key={note.id}
                                    className="flex items-start bg-white dark:bg-gray-800 p-4 rounded-lg  shadow-sm"
                                  >
                                    <div className="shrink-0 mx-3">
                                      {getStatusBadge(note.status)}
                                    </div>
                                    <div
                                      className={`flex-1 ${
                                        isRTL ? "text-right" : "text-left"
                                      }`}
                                    >
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        {note.content}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {format(
                                          new Date(note.createdAt),
                                          "MMM d, yyyy HH:mm"
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 mx-3">
                                      <button
                                        onClick={() =>
                                          setNoteModal({
                                            watchId: watch.id,
                                            note,
                                          })
                                        }
                                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        title={t("actions.edit")}
                                      >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeNote(watch.id, note.id)
                                        }
                                        className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title={t("actions.delete")}
                                      >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isAddingWatch && (
        <AddWatchModal
          isOpen={isAddingWatch}
          onClose={() => setIsAddingWatch(false)}
        />
      )}

      {noteModal && (
        <AddNoteModal
          watchId={noteModal.watchId}
          noteToEdit={noteModal.note}
          onClose={() => setNoteModal(null)}
        />
      )}
    </div>
  );
}
