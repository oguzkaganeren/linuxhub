import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const ProcessesPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const loading = status === "idle" || !sysInfo;
  const error =
    status === "failed" ? "Could not load process information." : null;

  // Create a memoized sorted list of processes
  const processes = React.useMemo(() => {
    if (!sysInfo?.processes) return [];
    return [...sysInfo.processes].sort(
      (a, b) => b.cpu_usage_percent - a.cpu_usage_percent
    );
  }, [sysInfo?.processes]);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-0 overflow-hidden animate-pulse">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-200/80 dark:bg-gray-800/50">
                <tr>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
                  </th>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  </th>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                  </th>
                  <th className="p-3 text-right">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 ml-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 15 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-200 dark:border-gray-700/50"
                  >
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-10 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-10 text-red-500">
          <AppIcon name="error" className="w-8 h-8 mr-2" />
          <span>{error}</span>
        </div>
      );
    }

    return (
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <tr>
              <th className="p-3 font-semibold">{t("pid")}</th>
              <th className="p-3 font-semibold">{t("process_name")}</th>
              <th className="p-3 font-semibold">{t("status")}</th>
              <th className="p-3 font-semibold text-right">
                {t("cpu_usage_short")}
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr
                key={p.pid}
                className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0"
              >
                <td className="p-3 font-mono">{p.pid}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 font-mono text-right">
                  {p.cpu_usage_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Panel title={t("processes")}>
      <BlurredCard className="p-0 overflow-hidden">
        {renderContent()}
      </BlurredCard>
    </Panel>
  );
};

export default ProcessesPanel;
