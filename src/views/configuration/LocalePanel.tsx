import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import toast from "react-hot-toast";

import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AddLocaleModal from "../../components/configuration/AddLocaleModal";
import LocaleContextMenu from "../../components/configuration/LocaleContextMenu";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { SystemLocale } from "../../types";

type ActiveTab = "system" | "detailed";

interface LocaleStatus {
  current: Record<string, string>;
  available_locales: string[];
  generated_locales: string[];
  reboot_required: boolean;
}

const localeIdToName = (id: string): string => {
  try {
    const cleanedId = id.split(".")[0];
    const [lang, region] = cleanedId.split("_");
    if (!lang) return id;

    const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(
      lang
    );

    if (region) {
      const regionName = new Intl.DisplayNames(["en"], { type: "region" }).of(
        region
      );
      return `${langName} (${regionName})`;
    }
    return langName || id;
  } catch (e) {
    return id;
  }
};

const RebootRequired: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-3 p-3 mb-4 text-sm font-semibold text-yellow-800 dark:text-yellow-200 bg-yellow-400/20 dark:bg-yellow-500/10 rounded-lg border border-yellow-400/30 dark:border-yellow-500/20"
  >
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p>A reboot is required for all changes to take full effect.</p>
  </motion.div>
);

const LocalePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("system");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    locale: SystemLocale;
  } | null>(null);

  const [localeStatus, setLocaleStatus] = useState<LocaleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [localesPerPage, setLocalesPerPage] = useState(5);

  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const calculateLocalesPerPage = () => {
      const chromeHeight = 420; // Title, reboot msg, buttons, tabs, padding...
      const itemHeight = 80; // Approximate height for a single locale item
      const availableHeight = window.innerHeight - chromeHeight;
      let count = Math.floor(availableHeight / itemHeight);
      count = Math.max(4, Math.min(10, count));
      setLocalesPerPage(count);
    };

    calculateLocalesPerPage();
    window.addEventListener("resize", calculateLocalesPerPage);

    return () => {
      window.removeEventListener("resize", calculateLocalesPerPage);
    };
  }, []);

  useEffect(() => {
    if (localeStatus) {
      const totalPages = Math.ceil(
        localeStatus.generated_locales.length / localesPerPage
      );
      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }
  }, [localesPerPage, localeStatus, currentPage]);

  const requestStatusUpdate = useCallback(() => {
    setLoading(true);
    invoke("get_locale_status").catch((e) => {
      setError(e.message || "An unknown error occurred.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let isInitialLoad = true;
    const unlistenPromise = listen("system-locale-info", (event) => {
      console.log("Locale event →", event.payload);
      const result = event.payload as {
        success: boolean;
        data?: LocaleStatus;
        message?: string;
      };

      if (result.success && result.data) {
        setLocaleStatus(result.data);
        setError(null);
        if (!isInitialLoad) {
          toast.success("Locale information updated.");
        }
      } else {
        setError(
          result.message || "Received invalid locale status from system."
        );
        if (!isInitialLoad) {
          toast.error("Failed to update locale info.");
        }
      }
      isInitialLoad = false;
      setLoading(false);
    });

    requestStatusUpdate();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [requestStatusUpdate]);

  const applyLocaleChange = useCallback(
    async (settings: Record<string, unknown>) => {
      const promise = invoke("set_system_locale", settings);
      toast.promise(promise, {
        loading: "Applying locale settings...",
        success: (res: any) => {
          if (res.success) {
            return res.message || "Settings applied successfully!";
          }
          throw new Error(res.message || "Failed to apply settings.");
        },
        error: (err) => `Error: ${err.message || "An unknown error occurred."}`,
      });
    },
    []
  );


  const handleSetFormat = (localeId: string) => {
    applyLocaleChange({
      lc_numeric: localeId,
      lc_time: localeId,
      lc_monetary: localeId,
      lc_paper: localeId,
      lc_name: localeId,
      lc_address: localeId,
      lc_telephone: localeId,
      lc_measurement: localeId,
      lc_identification: localeId,
    });
  };

  const handleSetDisplayAndFormat = (localeId: string) => {
    applyLocaleChange({ lang: localeId });
  };

  const handleAddLocale = useCallback(async (locale: SystemLocale) => {
    setAddModalOpen(false);
    const promise = invoke("generate_locale", { locale: locale.id });
    toast.promise(promise, {
      loading: `Generating locale ${locale.id}...`,
      success: (res: any) => {
        if (res.success) {
          return res.message || `Locale ${locale.id} generated!`;
        }
        throw new Error(res.message || "Failed to generate locale.");
      },
      error: (err) => `Error: ${err.message || "An unknown error occurred."}`,
    });
  }, []);

  const handleLocaleClick = (e: React.MouseEvent, locale: SystemLocale) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom, locale });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClickOutside, { once: true });
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const renderSystemLocales = () => {
    if (!localeStatus) return null;

    const displayLocaleId =
      localeStatus.current.lang || localeStatus.current.lc_messages;
    const formatLocaleId = localeStatus.current.lc_time;

    const systemLocalesWithRoles = localeStatus.generated_locales.map((id) => {
      const locale = { id, name: localeIdToName(id) };
      const roles = [];
      if (locale.id === displayLocaleId) roles.push(t("display_language"));
      if (locale.id === formatLocaleId) roles.push(t("formats"));
      return { ...locale, roles };
    });

    systemLocalesWithRoles.sort((a, b) => {
      if (a.roles.length !== b.roles.length) {
        return b.roles.length - a.roles.length;
      }
      return a.name.localeCompare(b.name);
    });

    const totalPages = Math.ceil(
      systemLocalesWithRoles.length / localesPerPage
    );
    const paginatedLocales = systemLocalesWithRoles.slice(
      (currentPage - 1) * localesPerPage,
      currentPage * localesPerPage
    );

    return (
      <>
        <div className="space-y-2">
          {paginatedLocales.map((locale) => {
            return (
              <button
                key={locale.id}
                onClick={(e) => handleLocaleClick(e, locale)}
                onContextMenu={(e) => handleLocaleClick(e, locale)}
                className="flex justify-between items-center p-4 rounded-lg w-full text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                <div>
                  <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {locale.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {locale.id}
                  </p>
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {locale.roles.join(", ")}
                </span>
              </button>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-semibold text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  const renderDetailedSettings = () => {
    if (!localeStatus) return null;

    const options = localeStatus.generated_locales.map((id) => ({
      value: id,
      label: `${localeIdToName(id)} (${id})`,
    }));
    const current = localeStatus.current;

    const settingsMap = [
      { key: "lang", label: t("language") },
      { key: "lc_ctype", label: "Character Classification" },
      { key: "lc_numeric", label: t("numbers") },
      { key: "lc_time", label: t("time") },
      { key: "lc_collate", label: t("collation_and_sorting") },
      { key: "lc_monetary", label: t("currency") },
      { key: "lc_messages", label: t("messages") },
      { key: "lc_paper", label: t("paper") },
      { key: "lc_name", label: t("names") },
      { key: "lc_address", label: t("address") },
      { key: "lc_telephone", label: t("telephone") },
      { key: "lc_measurement", label: t("measurement_units") },
      { key: "lc_identification", label: t("identification") },
    ];

    return (
      <div className="space-y-4">
        {settingsMap.map(({ key, label }) => (
          <div
            key={key}
            className="grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-0"
          >
            <label className="text-left md:text-right pr-4 text-gray-700 dark:text-gray-300">
              {label}:
            </label>
            <select
              value={current[key.toLowerCase()] || ""}
              onChange={(e) => applyLocaleChange({ [key]: e.target.value })}
              className="md:col-span-2 bg-gray-100 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none appearance-none"
            >
              <option value="">(Not Set)</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-10">Loading locale settings...</div>;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-10 gap-4 text-red-500">
          <AppIcon name="error" className="w-12 h-12" />
          <p className="font-semibold text-lg">{error}</p>
          <button
            onClick={requestStatusUpdate}
            className="mt-2 px-6 py-2 bg-red-500/20 text-red-500 font-semibold rounded-lg hover:bg-red-500/30 transition-all"
          >
            {t("retry")}
          </button>
        </div>
      );
    }
    return activeTab === "system"
      ? renderSystemLocales()
      : renderDetailedSettings();
  };

  return (
    <Panel title={t("locale_settings")}>
      <AnimatePresence>
        {localeStatus?.reboot_required && <RebootRequired />}
      </AnimatePresence>

      <div className="flex justify-end items-center gap-2 mb-4 -mt-4">
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-500 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors"
        >
          {t("add")}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeTab === "system"
              ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
              : "bg-transparent text-gray-600 dark:text-gray-400"
            }`}
        >
          {t("system_locales")}
        </button>
        <button
          onClick={() => setActiveTab("detailed")}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeTab === "detailed"
              ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
              : "bg-transparent text-gray-600 dark:text-gray-400"
            }`}
        >
          {t("detailed_settings")}
        </button>
      </div>

      <BlurredCard className="p-4 md:p-8 min-h-[300px]">
        {renderContent()}
      </BlurredCard>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddLocaleModal
            onAdd={handleAddLocale}
            onClose={() => setAddModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <LocaleContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            locale={contextMenu.locale}
            onSetDisplay={handleSetDisplayAndFormat}
            onSetFormat={handleSetFormat}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </Panel>
  );
};

export default LocalePanel;
