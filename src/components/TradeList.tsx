import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  useTradeStore,
  type TradeAction,
  type Trade,
} from "../store/tradeStore";
import { useGeneralSettingsStore } from "./GeneralSettings";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AddActionModal from "./AddActionModal";
import EditActionModal from "./EditActionModal";
import AddNoteForm from "./AddNoteForm";
import TradeDashboard from "./TradeDashboard";
import GeneralSettings from "./GeneralSettings";
import ClosedPositions from "./ClosedPositions";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const accountSize = useGeneralSettingsStore((state) => state.accountSize);

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
    const totalShares = calculateTotalShares(actions);
    if (totalShares <= 0) return 0;

    // Find the most recent buy action for the current price
    const lastBuyAction = [...actions]
      .reverse()
      .find((action) => action.type === "buy");
    if (!lastBuyAction) return 0;

    return lastBuyAction.price * totalShares;
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

  const calculateTotalRiskUSD = (actions: TradeAction[] | undefined) => {
    if (!actions?.length) return 0;
    const lastBuyAction = [...actions]
      .reverse()
      .find((action) => action.type === "buy");
    if (!lastBuyAction || !lastBuyAction.stopLoss) return 0;

    const riskPerShare = lastBuyAction.price - lastBuyAction.stopLoss;
    return riskPerShare * lastBuyAction.quantity;
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
              <th className="w-24 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.shares")}
              </th>
              <th className="w-28 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.avgPrice")}
              </th>
              <th className="w-28 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.riskPerTrade")}
              </th>
              <th className="w-32 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.totalRiskUSD")}
              </th>
              <th className="w-32 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.totalUSD")}
              </th>
              <th className="w-24 px-6 py-4 text-start text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t("trade.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {trades.map((trade) => (
              <React.Fragment key={trade.id}>
                <tr
                  className={`transition-colors duration-150 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  <td className="px-2 py-4 w-10">
                    <button
                      onClick={() => toggleExpand(trade.id)}
                      className="p-1.5 rounded-full hover:bg-gray-500 dark:hover:bg-gray-700 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
                      title="Add action"
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
                      "dd/MM/yyyy"
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
                  <td className="px-6 py-4 text-sm">
                    {trade.isActive ? (
                      <span
                        className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          calculateTotalRiskUSD(trade.actions) > 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                        }`}
                      >
                        $
                        {calculateTotalRiskUSD(trade.actions).toLocaleString(
                          "en-US",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
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
                    {accountSize > 0 && (
                      <span className="ml-1 mr-1 text-gray-500 dark:text-gray-400">
                        (
                        {(
                          (calculateTotalUSD(trade.actions) / accountSize) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    )}
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
                  <tr className="bg-gray-50 dark:bg-gray-900 w-full">
                    <td colSpan={11} className="px-6 py-6">
                      <div className="space-y-8 w-full max-w-full">
                        <div className="w-full">
                          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex-shrink-0">
                              {t("trade.tradeActions")}
                            </div>
                            <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full shadow-sm">
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
                                            onRemoveAction(trade.id, action.id)
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

                        <div className="w-full">
                          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex-shrink-0">
                              {t("trade.tradeNotes")}
                            </div>
                            <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div className="space-y-4 w-full">
                            {!trade.notes || trade.notes.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
                                    className="flex items-start justify-between bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full group hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-150"
                                  >
                                    <div className="space-y-3 flex-1">
                                      {note.text && (
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                          {note.text}
                                        </p>
                                      )}
                                      {note.image && (
                                        <div className="relative">
                                          <img
                                            src={note.image}
                                            alt="Note attachment"
                                            className="max-h-48 w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                                            onClick={() =>
                                              note.image &&
                                              setSelectedImage(note.image)
                                            }
                                          />
                                        </div>
                                      )}
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
      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl w-full max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Full size"
          className="w-full h-full object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function TradeList() {
  const { t } = useTranslation();
  const { trades, removeTrade, removeAction } = useTradeStore();
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleExpand = (tradeId: string) => {
    setExpanded((prev) => ({ ...prev, [tradeId]: !prev[tradeId] }));
  };

  const openTrades = trades.filter((trade) => trade.isActive);

  if (!trades.length) {
    return (
      <div className="space-y-8">
        <div className="mb-6">
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
        <ClosedPositions />
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
