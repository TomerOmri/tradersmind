import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("watch.symbol")}
            </label>
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700"
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
                    : "bg-gray-100 text-gray-800"
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
                    : "bg-gray-100 text-gray-800"
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
                    : "bg-gray-100 text-gray-800"
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
                    : "bg-gray-100 text-gray-800"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {noteToEdit ? t("actions.edit") : t("actions.addNote")}
        </h2>
        <form onSubmit={handleSubmit} className={isRTL ? "rtl" : "ltr"}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("watch.status")}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatus("SETUP_SUCCESS")}
                className={`px-3 py-1.5 text-sm ${
                  status === "SETUP_SUCCESS"
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("watch.statuses.setupSuccess")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("TIP")}
                className={`px-3 py-1.5 text-sm ${
                  status === "TIP"
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("watch.statuses.tip")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("WATCHING")}
                className={`px-3 py-1.5 text-sm ${
                  status === "WATCHING"
                    ? "text-yellow-600 dark:text-yellow-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("watch.statuses.watching")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("FAILED")}
                className={`px-3 py-1.5 text-sm ${
                  status === "FAILED"
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("watch.statuses.failed")}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("watch.notes")}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: WatchStatus) => {
    switch (status) {
      case "SETUP_SUCCESS":
        return (
          <span className="px-2 py-1 text-xs text-green-600 dark:text-green-400">
            {t("watch.statuses.setupSuccess")}
          </span>
        );
      case "TIP":
        return (
          <span className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
            {t("watch.statuses.tip")}
          </span>
        );
      case "WATCHING":
        return (
          <span className="px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400">
            {t("watch.statuses.watching")}
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-1 text-xs text-red-600 dark:text-red-400">
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
        <div className="w-full max-w-[2000px] mx-auto">
          <div
            className={`flex justify-between items-center mb-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("watch.title")}
            </h1>
            <button
              onClick={() => setIsAddingWatch(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4" />
              {t("actions.addWatch")}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="w-10 px-2" />
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.status")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.symbol")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {t("watch.lastUpdated")}
                  </th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {watches.map((watch) => (
                  <>
                    <tr
                      key={watch.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-2">
                        <button
                          onClick={() => toggleExpand(watch.id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          {expanded[watch.id] ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {watch.notes.length > 0 &&
                            getStatusBadge(
                              watch.notes[watch.notes.length - 1].status
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{watch.symbol}</span>
                          {watch.notes.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                              {watch.notes.length}{" "}
                              {isRTL
                                ? watch.notes.length === 1
                                  ? t("watch.noteCount").split("|")[0]
                                  : t("watch.noteCount").split("|")[1]
                                : t("watch.noteCount")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(watch.lastUpdated), "MMM d, yyyy")}
                      </td>
                      <td className="px-2">
                        <button
                          onClick={() => removeWatch(watch.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {expanded[watch.id] && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 bg-gray-50 dark:bg-gray-900"
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
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 ${
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
                                {watch.notes.map((note) => (
                                  <div
                                    key={note.id}
                                    className={`flex items-start bg-white dark:bg-gray-800 p-3 rounded-md`}
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
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                      >
                                        <PencilIcon className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeNote(watch.id, note.id)
                                        }
                                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      >
                                        <TrashIcon className="h-3 w-3" />
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
                  </>
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
