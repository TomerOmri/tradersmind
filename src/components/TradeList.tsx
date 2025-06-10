import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  useTradeStore,
  type TradeAction,
  type Trade,
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
import TradeDashboard from "./TradeDashboard";
import GeneralSettings from "./GeneralSettings";

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
  showPnL?: boolean;
}

function TradeTable({
  trades,
  expanded,
  toggleExpand,
  onAddAction,
  onEditAction,
  onRemoveTrade,
  onRemoveAction,
  showPnL = false,
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

  const calculateRiskPercentage = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    // Find the most recent buy action
    const lastBuyAction = [...actions]
      .reverse()
      .find((action) => action.type === "buy");
    if (!lastBuyAction || !lastBuyAction.stopLoss) return 0;

    const riskPercentage =
      ((lastBuyAction.price - lastBuyAction.stopLoss) / lastBuyAction.price) *
      100;
    return riskPercentage;
  };

  if (!trades.length) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          {t("trade.noTrades")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="w-10 px-2" />
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.symbol")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.status")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.lastAction")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.shares")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.avgPrice")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.riskPerTrade")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.totalUSD")}
            </th>
            {showPnL && (
              <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.pnl")}
              </th>
            )}
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.setup")}
            </th>
            <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t("trade.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {trades.map((trade) => (
            <React.Fragment key={trade.id}>
              <tr
                className={`transition-colors duration-150 ${
                  trade.isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <td className="px-2 py-4 w-10">
                  <button
                    onClick={() => toggleExpand(trade.id)}
                    className="p-1.5 rounded-full hover:bg-gray-500 dark:hover:bg-gray-700 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
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
                  {trade.isActive ? (
                    <span className="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                      {t("status.open")}
                    </span>
                  ) : (
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
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {format(
                    new Date(trade.actions[trade.actions.length - 1].date),
                    "dd/MM/yyyy HH:mm"
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {calculateTotalShares(trade.actions)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  ${calculateAveragePrice(trade.actions).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {trade.isActive ? (
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${(() => {
                        const risk = calculateRiskPercentage(trade.actions);
                        if (risk === 0)
                          return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300";
                        if (risk <= 2)
                          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
                        if (risk <= 4)
                          return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100";
                        if (risk <= 6)
                          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200";
                        if (risk <= 8)
                          return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200";
                        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
                      })()}`}
                    >
                      {calculateRiskPercentage(trade.actions).toFixed(1)}%
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  $
                  {calculateTotalUSD(trade.actions).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
                {showPnL && (
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    $
                    {calculatePnL(trade.actions).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {trade.setupType ? t(`setup.${trade.setupType}`) : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => onAddAction(trade.id)}
                      className="mx-2 p-1.5 rounded-full text-primary-600 dark:text-primary-400 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
                      title="Add action"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveTrade(trade.id)}
                      className="p-1.5 rounded-full text-red-600 dark:bg-gray-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
                      title="Remove trade"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {expanded[trade.id] && (
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td colSpan={showPnL ? 9 : 8} className="px-6 py-4 w-full">
                    <div className="space-y-6 w-full">
                      <div className="w-full">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Actions
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full">
                          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Price
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Shares
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Stop Loss
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Target
                                </th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Notes
                                </th>
                                <th className="px-6 py-3" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {trade.actions.map((action) => (
                                <tr
                                  key={action.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                                >
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {format(
                                      new Date(action.date),
                                      "dd/MM/yyyy HH:mm"
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-sm">
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
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${action.price.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {action.quantity}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {action.stopLoss
                                      ? `$${action.stopLoss.toFixed(2)}`
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {action.targetPrice
                                      ? `$${action.targetPrice.toFixed(2)}`
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {action.notes || "-"}
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() =>
                                          onEditAction(trade.id, action)
                                        }
                                        className="p-1.5 rounded-full text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          onRemoveAction(trade.id, action.id)
                                        }
                                        className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
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

                      <div className="w-full">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Notes
                        </div>
                        <div className="space-y-3 w-full">
                          {!trade.notes || trade.notes.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                  className="flex items-start justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full"
                                >
                                  <div className="space-y-1.5">
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                      {note.text}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {format(
                                        new Date(note.date),
                                        "dd/MM/yyyy HH:mm"
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeNote(trade.id, note.id)
                                    }
                                    className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50"
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
  );
}

export default function TradeList() {
  const { t } = useTranslation();
  const { trades, removeTrade, removeAction, addTrade } = useTradeStore();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<{
    tradeId: string;
    action: TradeAction;
  } | null>(null);
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [selectedTradeForNewAction, setSelectedTradeForNewAction] = useState<
    string | null
  >(null);

  const toggleExpand = (tradeId: string) => {
    setExpanded((prev) => ({ ...prev, [tradeId]: !prev[tradeId] }));
  };

  const openTrades = trades.filter((trade) => trade.isActive);
  const closedTrades = trades.filter((trade) => !trade.isActive);

  if (!trades.length) {
    return (
      <div className="space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t("app.title")}
          </h1>
          <GeneralSettings />
        </div>
        <TradeDashboard />
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {t("trade.noTrades")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-center">
        <GeneralSettings />
      </div>
      <TradeDashboard />

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("trade.openPositions")}
        </h2>
        <TradeTable
          trades={openTrades}
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

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("trade.closedPositions")}
        </h2>
        <TradeTable
          trades={closedTrades}
          expanded={expanded}
          toggleExpand={toggleExpand}
          onAddAction={setSelectedTradeForNewAction}
          onEditAction={(tradeId, action) =>
            setSelectedAction({ tradeId, action })
          }
          onRemoveTrade={removeTrade}
          onRemoveAction={removeAction}
          showPnL
        />
      </div>

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
