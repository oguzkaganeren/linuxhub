import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronRight } from "lucide-react";
import BlurredCard from "../../components/BlurredCard";
import HeaderCard from "../../components/configuration/HeaderCard";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setPrimaryColor } from "../../store/themeSlice";
import { install } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import { ConfigPanel, PackageStatus, Kernel } from "../../types";
import { colors } from "../../data/config";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

interface UpdateInfo {
  updates_available: boolean;
  pending_updates_count: number;
  last_update_date: string | null;
}

interface InstalledKernel {
  name: string;
  version: string;
  flavor: string;
}

const HomePanel: React.FC<{ setActivePanel: (panel: ConfigPanel) => void }> = ({
  setActivePanel,
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const packagesState = useAppSelector((state) => state.packages.packagesState);
  const language = useAppSelector((state) => state.app.language);

  const sysInfo = useAppSelector(selectSystemInfo);
  const systemStatus = useAppSelector(selectSystemStatus);

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [kernels, setKernels] = useState<Kernel[]>([]);
  const [otherInfoLoading, setOtherInfoLoading] = useState(true);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let translation =
        translations[language]?.[key] || translations["en"]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(`{${paramKey}}`, String(value));
        });
      }
      return translation;
    },
    [language]
  );

  const formatLastCheck = useCallback(
    (dateString: string | null) => {
      if (!dateString) return "never";
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = (now.getTime() - date.getTime()) / 1000;
        if (diffSeconds < 60) return "just now";
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400)
          return `${Math.floor(diffSeconds / 3600)}h ago`;
        return date.toLocaleDateString(language);
      } catch (e) {
        return "unknown";
      }
    },
    [language]
  );

  useEffect(() => {
    const fetchNonStreamingInfo = async () => {
      setOtherInfoLoading(true);
      try {
        // Update Info
        const updateResultJson: string = await invoke("check_system_updates");
        const updateResult = JSON.parse(updateResultJson);
        if (updateResult.check_success) {
          setUpdateInfo({
            updates_available: updateResult.updates_available,
            pending_updates_count: updateResult.pending_updates_count,
            last_update_date: updateResult.last_update_date,
          });
        }

        // Kernel Info
        const kernelResult: string = await invoke("get_system_kernels");
        const kernelData = JSON.parse(kernelResult);
        const runningVersion = kernelData.running_kernel;
        const kernelMap = new Map<string, Kernel>();
        (kernelData.installed_kernels as InstalledKernel[]).forEach((k) => {
          let releaseType: Kernel["releaseType"] = "stable";
          if (k.flavor === "lts") releaseType = "lts";
          const key = `${k.name}-${k.version}`;
          kernelMap.set(key, {
            version: k.version,
            pkg: k.name,
            releaseType,
            running: k.version === runningVersion,
          });
        });
        const combinedKernels = Array.from(kernelMap.values());
        combinedKernels.sort((a, b) => {
          if (a.running) return -1;
          if (b.running) return 1;
          return b.version.localeCompare(a.version, undefined, {
            numeric: true,
          });
        });
        setKernels(combinedKernels);
      } catch (err) {
        console.error("Failed to fetch non-streaming home panel info:", err);
      } finally {
        setOtherInfoLoading(false);
      }
    };
    fetchNonStreamingInfo();
  }, []);

  const recommendedSettings: {
    name: string;
    icon: string;
    panel: ConfigPanel;
  }[] = [
      { name: t("storage"), icon: "storage", panel: "storage" },
      { name: t("devices"), icon: "devices", panel: "devices" },
      {
        name: t("personalization"),
        icon: "personalization",
        panel: "personalization",
      },
    ];

  const loading = otherInfoLoading || systemStatus === "idle" || !sysInfo;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-md w-1/3 mb-6"></div>

        <div className="bg-gray-200/80 dark:bg-gray-800/50 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-6 md:gap-4 min-h-[96px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 flex-1">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-200/80 dark:bg-gray-800/50 rounded-2xl p-6 h-48"
            >
              <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const updateTitle = updateInfo?.updates_available
    ? t("updates_available_header", { count: updateInfo.pending_updates_count })
    : t("system_up_to_date");
  const updateSubtitle = `${t("last_check")}: ${formatLastCheck(
    updateInfo?.last_update_date ?? null
  )}`;

  const hostname = sysInfo.os_info?.host_name || "LinuxDesktop";
  const activeNetwork = sysInfo.networks?.find(
    (n) => n.interface_name !== "lo" && n.total_received_bytes > 0
  );
  const networkInfo = activeNetwork
    ? { name: activeNetwork.interface_name, status: t("connected") }
    : { name: "No Connection", status: t("internet_disconnected") };
  const disks = sysInfo.disks || [];

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("home")}
      </h1>

      <div className="bg-gray-100/80 dark:bg-gray-800/50 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-6 md:gap-4 min-h-[96px]">
        <HeaderCard icon="host" title={hostname} subtitle={t("hostname")} />
        <HeaderCard
          icon="network"
          title={networkInfo.name}
          subtitle={networkInfo.status}
        />
        <div
          onClick={() => setActivePanel("updates")}
          className="flex-1 cursor-pointer p-2 -m-2 rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <HeaderCard
            icon="updates"
            title={updateTitle}
            subtitle={updateSubtitle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("recommended_settings")}
          </h2>
          <ul className="space-y-2">
            {recommendedSettings.map((item) => (
              <li
                key={item.name}
                onClick={() => setActivePanel(item.panel)}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <AppIcon
                    name={item.icon}
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </li>
            ))}
          </ul>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("personalize_your_device")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => dispatch(setPrimaryColor(color))}
                style={{ backgroundColor: color }}
                className={`w-full h-20 rounded-lg transition-transform transform hover:scale-105 ${theme.primaryColor === color
                    ? "ring-4 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 ring-white"
                    : ""
                  }`}
              />
            ))}
            <div className="w-full h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-sm">
              {t("more_colors")}
            </div>
          </div>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t("storage")}</h2>
          <div className="space-y-4">
            {disks.length > 0 ? (
              disks.slice(0, 2).map((d) => {
                const totalGb = d.total_gb;
                const usedGb = totalGb - d.available_gb;
                const usage = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between font-semibold text-sm mb-1">
                      <span>
                        {d.mount_point} ({d.name})
                      </span>
                      <span>
                        {usedGb.toFixed(1)} GB / {totalGb.toFixed(1)} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-[var(--primary-color)] h-2.5 rounded-full"
                        style={{ width: `${usage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                {t("storage_info_unavailable")}
              </p>
            )}
          </div>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t("kernel_manager")}</h2>
          <div className="space-y-3">
            {kernels.slice(0, 2).map((k) => {
              const state = packagesState[k.pkg];
              return (
                <div
                  key={k.version}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      Linux {k.version}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {k.running && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                          {t("running")}
                        </span>
                      )}
                      {k.releaseType === "lts" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                          {t("lts")}
                        </span>
                      )}
                      {k.releaseType === "recommended" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
                          {t("recommended")}
                        </span>
                      )}
                    </div>
                  </div>
                  {state?.status === PackageStatus.Installed ? (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-md cursor-not-allowed"
                    >
                      {t("installed")}
                    </button>
                  ) : (
                    <button
                      onClick={() => dispatch(install(k.pkg))}
                      className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all"
                    >
                      {t("install")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </BlurredCard>
      </div>
    </>
  );
};

export default HomePanel;
