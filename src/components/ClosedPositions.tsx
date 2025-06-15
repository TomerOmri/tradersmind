import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  useTradeStore,
  type Trade,
  type TradeAction,
} from "../store/tradeStore";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import AddActionModal from "./AddActionModal";
import EditActionModal from "./EditActionModal";
import AddNoteForm from "./AddNoteForm";
import TagManager from "./TagManager";
import { useTagStore } from "../store/tagStore";

interface ExpandedState {
  [key: string]: boolean;
}

interface TradeTableProps {
  trades: Trade[];
  expanded: ExpandedState;
  toggleExpand: (id: string) => void;
  onAddAction: (id: string) => void;
  onEditAction: (tradeId: string, action: TradeAction) => void;
  onRemoveTrade: (id: string) => void;
  onRemoveAction: (tradeId: string, actionId: string) => void;
}

function TradeTable({
  trades,
  expanded,
  toggleExpand,
  onAddAction,
  onEditAction,
  onRemoveTrade,
  onRemoveAction,
}: TradeTableProps) {
  const { t } = useTranslation();
  const removeNote = useTradeStore((state) => state.removeNote);

  const calculateTotalShares = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    return actions.reduce((acc, action) => {
      return acc + (action.type === "buy" ? action.quantity : -action.quantity);
    }, 0);
  };

  const calculateAveragePrice = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    const { totalCost, totalShares } = actions.reduce(
      (acc, action) => {
        if (action.type === "buy") {
          return {
            totalCost: acc.totalCost + action.price * action.quantity,
            totalShares: acc.totalShares + action.quantity,
          };
        }
        return acc;
      },
      { totalCost: 0, totalShares: 0 }
    );
    return totalShares > 0 ? totalCost / totalShares : 0;
  };

  const calculatePnL = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    return actions.reduce((acc, action) => {
      return (
        acc +
        (action.type === "sell"
          ? action.price * action.quantity
          : -action.price * action.quantity)
      );
    }, 0);
  };

  const calculateTotalUSD = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    return actions.reduce((acc, action) => {
      return acc + action.price * action.quantity;
    }, 0);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="w-10 px-2" />
              <th className="w-24 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.symbol")}
              </th>
              <th className="w-24 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.status")}
              </th>
              <th className="w-36 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.lastAction")}
              </th>
              <th className="w-32 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.pnl")}
              </th>
              <th className="flex-1 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.tags")}
              </th>
              <th className="w-16 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {trades.map((trade) => (
              <React.Fragment key={trade.id}>
                <tr
                  className={`transition-colors duration-150 ${
                    calculatePnL(trade.actions) >= 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                  }`}
                >
                  <td className="px-2 py-4 w-10">
                    <button
                      onClick={() => toggleExpand(trade.id)}
                      className="p-1.5 rounded-full hover:bg-gray-500 dark:hover:bg-gray-700 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
                      title="Toggle details"
                    >
                      {expanded[trade.id] ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {trade.symbol}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${
                        calculatePnL(trade.actions) >= 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                      }`}
                    >
                      {t(
                        calculatePnL(trade.actions) >= 0
                          ? "status.win"
                          : "status.loss"
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {format(
                      new Date(trade.actions[trade.actions.length - 1].date),
                      "dd/MM/yyyy"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <span
                      className={`inline-flex ${
                        calculatePnL(trade.actions) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                      style={{ direction: "ltr" }}
                    >
                      {calculatePnL(trade.actions) >= 0 ? "+" : "-"}$
                      {Math.abs(calculatePnL(trade.actions)).toLocaleString(
                        "en-US",
                        {
                          maximumFractionDigits: 0,
                        }
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <TagManager tradeId={trade.id} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onRemoveTrade(trade.id)}
                      className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
                      title={t("trade.deleteTrade")}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {expanded[trade.id] && (
                  <tr className="bg-gray-50 dark:bg-gray-900 w-full">
                    <td colSpan={9} className="px-6 py-6">
                      <div className="space-y-8 w-full max-w-full">
                        <div className="w-full">
                          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex-shrink-0">
                              {t("trade.tradeActions")}
                            </div>
                            <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                  <tr>
                                    <th className="w-36 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.date")}
                                    </th>
                                    <th className="w-24 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.type")}
                                    </th>
                                    <th className="w-28 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.price")}
                                    </th>
                                    <th className="w-24 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.shares")}
                                    </th>
                                    <th className="w-28 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.stopLoss")}
                                    </th>
                                    <th className="w-28 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.target")}
                                    </th>
                                    <th className="flex-1 px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {t("trade.notes")}
                                    </th>
                                    <th className="w-24 px-6 py-3" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                  {trade.actions.map((action) => (
                                    <tr
                                      key={action.id}
                                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                                    >
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                        {format(
                                          new Date(action.date),
                                          "dd/MM/yyyy"
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-sm">
                                        <span
                                          className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${
                                            action.type === "buy"
                                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                                              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                                          }`}
                                        >
                                          {t(`actions.${action.type}`)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        ${action.price.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {action.quantity}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {action.stopLoss
                                          ? `$${action.stopLoss.toFixed(2)}`
                                          : "-"}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {action.targetPrice
                                          ? `$${action.targetPrice.toFixed(2)}`
                                          : "-"}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {action.notes || "-"}
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex space-x-4">
                                          <button
                                            onClick={() =>
                                              onEditAction(trade.id, action)
                                            }
                                            className="mx-2 p-1.5 rounded-full text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
                                          >
                                            <PencilIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              onRemoveAction(
                                                trade.id,
                                                action.id
                                              )
                                            }
                                            className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className="w-full">
                          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex-shrink-0">
                              {t("trade.tradeNotes")}
                            </div>
                            <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div className="space-y-4 w-full">
                            {!trade.notes || trade.notes.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                {t("trade.noNotes")}
                              </p>
                            ) : (
                              trade.notes
                                .sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime()
                                )
                                .map((note) => (
                                  <div
                                    key={note.id}
                                    className="flex items-start justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full group hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-150"
                                  >
                                    <div className="space-y-2">
                                      <p className="text-sm text-gray-900 dark:text-gray-100">
                                        {note.text}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {format(
                                          new Date(note.date),
                                          "dd/MM/yyyy"
                                        )}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeNote(trade.id, note.id)
                                      }
                                      className="p-1.5 rounded-full text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))
                            )}
                            <AddNoteForm tradeId={trade.id} />
                          </div>
                        </div>
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
  );
}

export default function ClosedPositions() {
  const { t } = useTranslation();
  const { trades, removeTrade, removeAction } = useTradeStore();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedTradeForNewAction, setSelectedTradeForNewAction] = useState<
    string | null
  >(null);
  const [selectedAction, setSelectedAction] = useState<{
    tradeId: string;
    action: TradeAction;
  } | null>(null);
  const { getTagUsageCount } = useTagStore();

  const calculatePnL = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    return actions.reduce((acc, action) => {
      return (
        acc +
        (action.type === "sell"
          ? action.price * action.quantity
          : -action.price * action.quantity)
      );
    }, 0);
  };

  const toggleExpand = (tradeId: string) => {
    setExpanded((prev) => ({ ...prev, [tradeId]: !prev[tradeId] }));
  };

  // New helper functions for trade metrics
  const calculateTradeMetrics = (trades: Trade[]) => {
    const winningTrades = trades.filter(
      (trade) => calculatePnL(trade.actions) > 0
    );
    const losingTrades = trades.filter(
      (trade) => calculatePnL(trade.actions) <= 0
    );

    const winRate = (winningTrades.length / trades.length) * 100;
    const totalPnL = trades.reduce(
      (acc, trade) => acc + calculatePnL(trade.actions),
      0
    );

    const avgGain =
      winningTrades.length > 0
        ? winningTrades.reduce(
            (acc, trade) => acc + calculatePnL(trade.actions),
            0
          ) / winningTrades.length
        : 0;

    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce(
              (acc, trade) => acc + calculatePnL(trade.actions),
              0
            ) / losingTrades.length
          )
        : 0;

    const calculateTradeDuration = (trade: Trade) => {
      const firstAction = trade.actions[0];
      const lastAction = trade.actions[trade.actions.length - 1];
      return (
        (new Date(lastAction.date).getTime() -
          new Date(firstAction.date).getTime()) /
        (1000 * 60 * 60 * 24)
      );
    };

    const avgDaysWin =
      winningTrades.length > 0
        ? winningTrades.reduce(
            (acc, trade) => acc + calculateTradeDuration(trade),
            0
          ) / winningTrades.length
        : 0;

    const avgDaysLoss =
      losingTrades.length > 0
        ? losingTrades.reduce(
            (acc, trade) => acc + calculateTradeDuration(trade),
            0
          ) / losingTrades.length
        : 0;

    return {
      winRate,
      totalPnL,
      avgGain,
      avgLoss,
      avgDaysWin,
      avgDaysLoss,
    };
  };

  const closedTrades = trades.filter((trade) => !trade.isActive);

  // Group trades by month
  const tradesByMonth = closedTrades.reduce<{ [key: string]: Trade[] }>(
    (acc, trade) => {
      const lastAction = trade.actions[trade.actions.length - 1];
      const monthKey = format(
        startOfMonth(parseISO(lastAction.date)),
        "yyyy-MM"
      );
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(trade);
      return acc;
    },
    {}
  );

  // Sort months in descending order
  const sortedMonths = Object.keys(tradesByMonth).sort((a, b) =>
    b.localeCompare(a)
  );

  if (!closedTrades.length) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          {t("trade.noClosedTrades")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedMonths.map((month) => {
        const startDate = `${month}-01`;
        const endDate = format(
          new Date(
            new Date(startDate).getFullYear(),
            new Date(startDate).getMonth() + 1,
            0
          ),
          "yyyy-MM-dd"
        );
        const tagUsage = getTagUsageCount(startDate, endDate);

        return (
          <div key={month}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {format(parseISO(`${month}-01`), "MMMM yyyy")}
            </h2>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 flex flex-wrap gap-x-6">
              {(() => {
                const metrics = calculateTradeMetrics(tradesByMonth[month]);
                return (
                  <>
                    <span>
                      Win Rate:{" "}
                      <span
                        className={
                          metrics.winRate >= 50
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {metrics.winRate.toFixed(1)}%
                      </span>
                    </span>
                    <span>
                      P&L:{" "}
                      <span
                        className={
                          metrics.totalPnL >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {metrics.totalPnL >= 0 ? "+" : "-"}$
                        {Math.abs(metrics.totalPnL).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                    <span>
                      Avg Gain:{" "}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        $
                        {metrics.avgGain.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                    <span>
                      Avg Loss:{" "}
                      <span className="text-red-600 dark:text-red-400">
                        $
                        {metrics.avgLoss.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                    <span>
                      Avg Days Win:{" "}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {metrics.avgDaysWin.toFixed(1)}
                      </span>
                    </span>
                    <span>
                      Avg Days Loss:{" "}
                      <span className="text-red-600 dark:text-red-400">
                        {metrics.avgDaysLoss.toFixed(1)}
                      </span>
                    </span>
                    <div className="w-full mt-2 flex flex-wrap gap-2">
                      <span className="font-medium">
                        {t("trade.tagUsage")}:{" "}
                      </span>
                      {Object.entries(tagUsage).map(([tag, count]) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full text-xs"
                        >
                          <span className="px-2 py-0.5 font-medium bg-gray-900 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-r-full">
                            {count}
                          </span>
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-l-full">
                            {tag}
                          </span>
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <TradeTable
              trades={tradesByMonth[month]}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onAddAction={setSelectedTradeForNewAction}
              onEditAction={(tradeId, action) =>
                setSelectedAction({ tradeId, action })
              }
              onRemoveTrade={removeTrade}
              onRemoveAction={removeAction}
            />
          </div>
        );
      })}

      {selectedTradeForNewAction && (
        <AddActionModal
          tradeId={selectedTradeForNewAction}
          onClose={() => setSelectedTradeForNewAction(null)}
        />
      )}

      {selectedAction && (
        <EditActionModal
          tradeId={selectedAction.tradeId}
          action={selectedAction.action}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
}
