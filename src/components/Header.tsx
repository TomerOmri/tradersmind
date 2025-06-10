import { useTranslation } from "react-i18next";
import { SunIcon, MoonIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { Menu } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const location = useLocation();

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

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path === "/trades" && location.pathname === "/")
    );
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("app.title")}
            </h1>
            <nav className="flex items-center gap-6">
              <Link
                to="/trades"
                className={`text-sm font-medium ${
                  isActive("/trades")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Trades
              </Link>
              <Link
                to="/process"
                className={`text-sm font-medium ${
                  isActive("/process")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Process
              </Link>
              <Link
                to="/reports"
                className={`text-sm font-medium ${
                  isActive("/reports")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("reports.title")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LanguageIcon className="h-6 w-6" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {theme === "dark" ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
