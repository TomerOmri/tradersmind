import { useTranslation } from "react-i18next";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { format } from "date-fns";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useState } from "react";
import { useJournalStore } from "../store/journalStore";
import "../styles/journal.css";

const MenuBar = ({ editor }: { editor: any }) => {
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (!editor) return null;

  const colors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#808080",
    "#800000",
    "#808000",
    "#008000",
    "#800080",
    "#008080",
    "#000080",
  ];

  return (
    <div className="border-b dark:border-gray-700 p-2 mb-4 flex flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded ${
          editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
      >
        <span className="font-bold">B</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded ${
          editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
      >
        <span className="italic">I</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded ${
          editor.isActive("underline") ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
      >
        <span className="underline">U</span>
      </button>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded ${
          editor.isActive({ textAlign: "left" })
            ? "bg-gray-200 dark:bg-gray-700"
            : ""
        }`}
      >
        ←
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded ${
          editor.isActive({ textAlign: "center" })
            ? "bg-gray-200 dark:bg-gray-700"
            : ""
        }`}
      >
        ↔
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded ${
          editor.isActive({ textAlign: "right" })
            ? "bg-gray-200 dark:bg-gray-700"
            : ""
        }`}
      >
        →
      </button>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          🎨
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded shadow-lg z-10 grid grid-cols-5 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: color, border: "1px solid gray" }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="absolute top-full right-0 mt-1 z-10">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => {
                editor.chain().focus().insertContent(emoji.native).run();
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default function Journal() {
  const { t, i18n } = useTranslation();
  const { entries, addEntry, deleteEntry } = useJournalStore();

  const handleDelete = (id: string) => {
    if (window.confirm(t("journal.deleteConfirm"))) {
      deleteEntry(id);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: t("journal.placeholder"),
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      Highlight,
      Underline,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
        dir: i18n.dir(),
        style: "color: var(--default-text-color)",
      },
    },
  });

  const saveEntry = () => {
    if (editor?.isEmpty) return;

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: editor?.getHTML() || "",
    };

    addEntry(newEntry);
    editor?.commands.clearContent();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <style>
        {`
          :root {
            --default-text-color: #000000;
          }
          .dark {
            --default-text-color: #ffffff;
          }
        `}
      </style>
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <MenuBar editor={editor} />
          <div
            className={`border-0 rounded-b-lg ${
              i18n.dir() === "rtl" ? "text-right" : "text-left"
            }`}
          >
            <EditorContent editor={editor} />
          </div>
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={saveEntry}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              {t("journal.save")}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t("journal.entries")}
        </h2>

        {entries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            {t("journal.noEntries")}
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(entry.date), "PPP")}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title={t("journal.delete")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: entry.content }}
                dir={i18n.dir()}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
