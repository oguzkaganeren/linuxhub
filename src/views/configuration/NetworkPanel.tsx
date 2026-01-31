import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const NetworkPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const networks = sysInfo?.networks || [];
  const loading = status === "idle";
  const error =
    status === "failed" ? "Could not load network information." : null;

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <BlurredCard key={i} className="p-4">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </BlurredCard>
          ))}
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
      <div className="space-y-4">
        {networks.map((net) => (
          <BlurredCard key={net.interface_name} className="p-4">
            <h3 className="font-bold text-lg mb-2">{net.interface_name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="font-semibold text-gray-500 dark:text-gray-400">
                  {t("mac_address")}
                </p>
                <p className="font-mono">{net.mac_address}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-500 dark:text-gray-400">
                  {t("data_received")}
                </p>
                <p>{formatBytes(net.total_received_bytes)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-500 dark:text-gray-400">
                  {t("data_sent")}
                </p>
                <p>{formatBytes(net.total_transmitted_bytes)}</p>
              </div>
            </div>
          </BlurredCard>
        ))}
      </div>
    );
  };

  return <Panel title={t("network_info")}>{renderContent()}</Panel>;
};

export default NetworkPanel;
