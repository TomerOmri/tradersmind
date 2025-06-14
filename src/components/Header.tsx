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
      <Menu.Button className="group relative p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:bg-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 ease-in-out">
        <Cog6ToothIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 translate-y-1"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-1"
      >
        <Menu.Items
          className={`absolute mt-3 w-56 origin-top divide-y divide-gray-100 dark:divide-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 ${
            i18n.language === "he"
              ? "left-0 origin-top-left"
              : "right-0 origin-top-right"
          }`}
        >
          {/* Theme and Language Section */}
          <div className="p-1.5">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("settings.preferences")}
            </div>
            <div className="space-y-1 mt-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleTheme}
                    className={`${
                      active
                        ? "bg-gray-50 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      i18n.language === "he"
                        ? "flex-row-reverse text-right"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 p-1 rounded-md ${
                        active
                          ? "bg-gray-100 dark:bg-gray-600"
                          : "bg-gray-100 dark:bg-gray-600"
                      } ${i18n.language === "he" ? "ml-2.5" : "mr-2.5"}`}
                    >
                      {theme === "dark" ? (
                        <SunIcon className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <MoonIcon className="h-3.5 w-3.5 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {t("settings.theme")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {theme === "dark"
                          ? t("settings.light")
                          : t("settings.dark")}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleLanguage}
                    className={`${
                      active
                        ? "bg-gray-50 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      i18n.language === "he"
                        ? "flex-row-reverse text-right"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 p-1 rounded-md ${
                        active
                          ? "bg-gray-100 dark:bg-gray-600"
                          : "bg-gray-100 dark:bg-gray-600"
                      } ${i18n.language === "he" ? "ml-2.5" : "mr-2.5"}`}
                    >
                      <LanguageIcon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {t("settings.language")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {i18n.language === "he" ? "English" : "עברית"}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="p-1.5">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("settings.dataManagement")}
            </div>
            <div className="space-y-1 mt-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleExport}
                    className={`${
                      active
                        ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        : "text-gray-700 dark:text-gray-300 dark:bg-gray-700 hover:bg-green-50/50 dark:hover:bg-green-900/20"
                    } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      i18n.language === "he"
                        ? "flex-row-reverse text-right"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 p-1 rounded-md ${
                        active
                          ? "bg-green-100 dark:bg-green-800/50"
                          : "bg-gray-100 dark:bg-gray-600"
                      } ${i18n.language === "he" ? "ml-2.5" : "mr-2.5"}`}
                    >
                      <ArrowUpTrayIcon className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {t("settings.exportData")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {t("settings.exportDescription")}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleImport}
                    className={`${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-300 dark:bg-gray-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                    } group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      i18n.language === "he"
                        ? "flex-row-reverse text-right"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 p-1 rounded-md ${
                        active
                          ? "bg-blue-100 dark:bg-blue-800/50"
                          : "bg-gray-100 dark:bg-gray-600"
                      } ${i18n.language === "he" ? "ml-2.5" : "mr-2.5"}`}
                    >
                      <ArrowDownTrayIcon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {t("settings.importData")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {t("settings.importDescription")}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
            </div>
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
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-700 dark:hover:text-gray-200 dark:bg-gray-700 rounded-lg"
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
