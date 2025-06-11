import { useTranslation } from "react-i18next";
import {
  SunIcon,
  MoonIcon,
  LanguageIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { useEffect, useState, useRef, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { exportState, importState } from "../store/storeUtils";

export default function Header() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "he" ? "en" : "he";
    i18n.changeLanguage(newLang);
  };

  const handleExport = () => {
    const state = exportState();
    const blob = new Blob([state], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradermind-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        importState(content);
        alert("Data imported successfully!");
      } catch (error) {
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path === "/trades" && location.pathname === "/")
    );
  };

  const NavLinks = () => (
    <>
      <Link
        to="/trades"
        className={`text-sm font-medium ${
          isActive("/trades")
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {t("header.trades")}
      </Link>
      <Link
        to="/process"
        className={`text-sm font-medium ${
          isActive("/process")
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {t("header.process")}
      </Link>
      <Link
        to="/reports"
        className={`text-sm font-medium ${
          isActive("/reports")
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {t("header.reports")}
      </Link>
      <Link
        to="/journal"
        className={`text-sm font-medium ${
          isActive("/journal")
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {t("header.journal")}
      </Link>
      <Link
        to="/memory"
        className={`text-sm font-medium ${
          isActive("/memory")
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {t("header.memory")}
      </Link>
    </>
  );

  const SettingsMenu = () => (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:bg-gray-700 rounded-lg">
        <Cog6ToothIcon className="h-5 w-5" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${
            i18n.language === "he"
              ? "left-0 origin-top-left"
              : "right-0 origin-top-right"
          } transform-gpu`}
        >
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={toggleTheme}
                  className={`${
                    active
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm whitespace-nowrap ${
                    i18n.language === "he" ? "flex-row-reverse" : ""
                  }`}
                >
                  {theme === "dark" ? (
                    <SunIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        i18n.language === "he" ? "ml-2" : "mr-2"
                      }`}
                    />
                  ) : (
                    <MoonIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        i18n.language === "he" ? "ml-2" : "mr-2"
                      }`}
                    />
                  )}
                  {t("settings.theme")} -{" "}
                  {theme === "dark" ? t("settings.light") : t("settings.dark")}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={toggleLanguage}
                  className={`${
                    active
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm whitespace-nowrap ${
                    i18n.language === "he" ? "flex-row-reverse" : ""
                  }`}
                >
                  <LanguageIcon
                    className={`h-5 w-5 flex-shrink-0 ${
                      i18n.language === "he" ? "ml-2" : "mr-2"
                    }`}
                  />
                  {t("settings.language")} -{" "}
                  {i18n.language === "he" ? "English" : "עברית"}
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleExport}
                  className={`${
                    active
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm whitespace-nowrap ${
                    i18n.language === "he" ? "flex-row-reverse" : ""
                  }`}
                >
                  <ArrowUpTrayIcon
                    className={`h-5 w-5 flex-shrink-0 ${
                      i18n.language === "he" ? "ml-2" : "mr-2"
                    }`}
                  />
                  {t("settings.exportData")}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleImport}
                  className={`${
                    active
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm whitespace-nowrap ${
                    i18n.language === "he" ? "flex-row-reverse" : ""
                  }`}
                >
                  <ArrowDownTrayIcon
                    className={`h-5 w-5 flex-shrink-0 ${
                      i18n.language === "he" ? "ml-2" : "mr-2"
                    }`}
                  />
                  {t("settings.importData")}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm relative">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {t("app.title")}
            </h1>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLinks />
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <SettingsMenu />
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:bg-gray-700 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Transition
          show={isMobileMenuOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <nav className="md:hidden mt-4 flex flex-col gap-4">
            <NavLinks />
          </nav>
        </Transition>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </header>
  );
}
