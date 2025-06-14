import { useState } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { ItemStorage } from "../store/localForageInstances";
import { PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import AddTradeButton from "./AddTradeButton";

interface GeneralSettings {
  accountSize: number;
  riskPerTrade: number;
}

interface GeneralSettingsStore {
  accountSize: number;
  riskPerTrade: number;
  setAccountSize: (size: number) => Promise<void>;
  setRiskPerTrade: (risk: number) => Promise<void>;
  loadSettings: () => Promise<void>;
}

// Create storage instance for general settings
const settingsStorage = new ItemStorage<GeneralSettings>(
  "general-settings",
  "config"
);

export const useGeneralSettingsStore = create<GeneralSettingsStore>(
  (set, get) => ({
    accountSize: 0,
    riskPerTrade: 1,

    setAccountSize: async (size) => {
      const currentSettings = {
        accountSize: get().accountSize,
        riskPerTrade: get().riskPerTrade,
      };
      const updatedSettings = { ...currentSettings, accountSize: size };
      await settingsStorage.setItem("settings", updatedSettings);
      set({ accountSize: size });
    },

    setRiskPerTrade: async (risk) => {
      const currentSettings = {
        accountSize: get().accountSize,
        riskPerTrade: get().riskPerTrade,
      };
      const updatedSettings = { ...currentSettings, riskPerTrade: risk };
      await settingsStorage.setItem("settings", updatedSettings);
      set({ riskPerTrade: risk });
    },

    loadSettings: async () => {
      const settings = await settingsStorage.getItem("settings");
      if (settings) {
        set({
          accountSize: settings.accountSize,
          riskPerTrade: settings.riskPerTrade,
        });
      }
    },
  })
);

// Load settings on store initialization
useGeneralSettingsStore.getState().loadSettings();

function SettingItem({
  label,
  value,
  isEditing,
  tempValue,
  onTempValueChange,
  prefix,
  suffix,
  inputWidth = "w-28",
  type = "text",
}: {
  label: string;
  value: string;
  isEditing: boolean;
  tempValue: string;
  onTempValueChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  inputWidth?: string;
  type?: "text" | "number";
}) {
  const valueClasses = "font-medium text-[#feb062]";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}:</span>
      {isEditing ? (
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-[#feb062] text-xs">{prefix}</span>
            </div>
          )}
          <input
            type={type}
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            className={`${inputWidth} ${
              prefix ? "pl-4" : "pl-2"
            } pr-6 py-0.5 text-sm bg-gray-800/30 text-[#feb062] border border-[#feb062]/20 rounded focus:outline-none focus:border-[#feb062]/40`}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <span className="text-[#feb062] text-xs">{suffix}</span>
            </div>
          )}
        </div>
      ) : (
        <span className={valueClasses}>
          {prefix}
          {value}
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function GeneralSettings() {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const { accountSize, riskPerTrade, setAccountSize, setRiskPerTrade } =
    useGeneralSettingsStore();
  const [tempAccountSize, setTempAccountSize] = useState(
    accountSize.toString()
  );
  const [tempRiskPerTrade, setTempRiskPerTrade] = useState(
    riskPerTrade.toString()
  );

  const handleSave = async () => {
    const newAccountSize = parseFloat(tempAccountSize) || 0;
    const newRiskPerTrade = parseFloat(tempRiskPerTrade) || 1;
    await setAccountSize(newAccountSize);
    await setRiskPerTrade(newRiskPerTrade);
    setIsEditing(false);
  };

  const isRTL = i18n.dir() === "rtl";

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${
        isRTL ? "justify-end" : "justify-start"
      }`}
    >
      <AddTradeButton />

      <SettingItem
        label={t("settings.accountSize")}
        value={accountSize.toLocaleString()}
        isEditing={isEditing}
        tempValue={tempAccountSize}
        onTempValueChange={setTempAccountSize}
        prefix={t("settings.currencySymbol")}
        type="number"
      />
      <SettingItem
        label={t("settings.riskPerTrade")}
        value={riskPerTrade.toString()}
        isEditing={isEditing}
        tempValue={tempRiskPerTrade}
        onTempValueChange={setTempRiskPerTrade}
        suffix={t("settings.percentageSymbol")}
        inputWidth="w-20"
        type="number"
      />
      <button
        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        className="p-1 hover:bg-[#feb062]/10 rounded dark:bg-gray-700 transition-colors duration-150"
      >
        {isEditing ? (
          <CheckIcon className="h-4 w-4 text-[#feb062] dark:bg-gray-700" />
        ) : (
          <PencilIcon className="h-4 w-4 text-[#feb062] dark:bg-gray-700" />
        )}
      </button>
    </div>
  );
}
