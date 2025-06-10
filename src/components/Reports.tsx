import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  getDay,
} from "date-fns";
import { he, enUS } from "date-fns/locale";
import { useReportStore } from "../store/reportStore";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface DayCardProps {
  date: Date;
  currentMonth: Date;
  locale: Locale;
}

const DayCard = ({ date, currentMonth, locale }: DayCardProps) => {
  const { t } = useTranslation();
  const getDayStats = useReportStore((state) => state.getDayStats);
  const stats = getDayStats(date);
  const isCurrentMonth = isSameMonth(date, currentMonth);

  if (!isCurrentMonth) {
    return (
      <div className="h-32 bg-gray-800/50 rounded-lg p-3">
        <span className="text-gray-500">{format(date, "d")}</span>
      </div>
    );
  }

  return (
    <div
      className={`h-32 bg-gray-800 rounded-lg p-3 flex flex-col ${
        stats.totalTrades > 0 ? "ring-1 ring-primary-500/30" : ""
      }`}
    >
      <span className="text-gray-400 mb-2">{format(date, "d")}</span>
      {stats.totalTrades > 0 && (
        <>
          <span
            className={`text-lg font-medium ${
              stats.pnl >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            ${stats.pnl.toLocaleString()}
          </span>
          {stats.percentageChange && (
            <span
              className={`text-xs ${
                stats.pnl >= 0 ? "text-green-500/70" : "text-red-500/70"
              }`}
            >
              {stats.percentageChange > 0 ? "+" : ""}
              {stats.percentageChange.toFixed(2)}%
            </span>
          )}
          <span className="text-sm text-gray-500 mt-1">
            {stats.totalTrades} {t("reports.trades")}
          </span>
          <div className="flex gap-1 mt-auto text-xs">
            <span className="text-green-500">{stats.wins}</span>
            <span className="text-gray-500">/</span>
            <span className="text-red-500">{stats.losses}</span>
          </div>
        </>
      )}
    </div>
  );
};

interface WeeklySummaryProps {
  days: Date[];
  locale: Locale;
}

const WeeklySummary = ({ days, locale }: WeeklySummaryProps) => {
  const { t } = useTranslation();
  const getDayStats = useReportStore((state) => state.getDayStats);

  const weekStats = days.reduce(
    (acc, date) => {
      const dayStats = getDayStats(date);
      return {
        totalTrades: acc.totalTrades + dayStats.totalTrades,
        wins: acc.wins + dayStats.wins,
        losses: acc.losses + dayStats.losses,
        pnl: acc.pnl + dayStats.pnl,
      };
    },
    { totalTrades: 0, wins: 0, losses: 0, pnl: 0 }
  );

  if (weekStats.totalTrades === 0) return null;

  const winRate =
    weekStats.totalTrades > 0
      ? ((weekStats.wins / weekStats.totalTrades) * 100).toFixed(1)
      : "0";

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-gray-400 text-sm mb-2">{t("reports.weekSummary")}</h4>
      <div className="space-y-2">
        <div
          className={`text-lg font-medium ${
            weekStats.pnl >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          ${weekStats.pnl.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">
          {weekStats.totalTrades} {t("reports.trades")}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-1">
            <span className="text-green-500">{weekStats.wins}</span>
            <span className="text-gray-500">/</span>
            <span className="text-red-500">{weekStats.losses}</span>
          </div>
          <span className="text-gray-500">({winRate}%)</span>
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  const { i18n, t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const locale = i18n.language === "he" ? he : enUS;
  const isRTL = i18n.dir() === "rtl";
  const getMonthStats = useReportStore((state) => state.getMonthStats);
  const monthStats = getMonthStats(currentMonth);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Add days from previous month to start the calendar on Sunday
  const firstDayOfMonth = getDay(days[0]);
  const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) =>
    subMonths(days[0], 1).setDate(
      endOfMonth(subMonths(days[0], 1)).getDate() - firstDayOfMonth + i + 1
    )
  );

  // Add days from next month to complete the calendar
  const lastDayOfMonth = getDay(days[days.length - 1]);
  const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) =>
    addMonths(days[0], 1).setDate(i + 1)
  );

  const allDays = [...previousMonthDays, ...days, ...nextMonthDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col bg-gray-900 ${
        isRTL ? "rtl" : "ltr"
      }`}
    >
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {format(currentMonth, "MMMM yyyy", { locale })}
              </h2>
              {monthStats.totalTrades > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-sm ${
                      monthStats.pnl >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${monthStats.pnl.toLocaleString()}
                  </span>
                  {monthStats.percentageChange && (
                    <span
                      className={`text-xs ${
                        monthStats.pnl >= 0
                          ? "text-green-500/70"
                          : "text-red-500/70"
                      }`}
                    >
                      ({monthStats.percentageChange > 0 ? "+" : ""}
                      {monthStats.percentageChange.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-4">
          <div className="col-span-7">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm text-gray-400">
                  {t(`reports.days.${day.toLowerCase()}`)}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-4">
                  {week.map((day) => (
                    <DayCard
                      key={day.toString()}
                      date={new Date(day)}
                      currentMonth={currentMonth}
                      locale={locale}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {t("reports.weeklySummary")}
            </h3>
            {weeks.map((week, index) => (
              <WeeklySummary key={index} days={week} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
