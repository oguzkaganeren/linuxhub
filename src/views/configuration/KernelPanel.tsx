import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { install, remove } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import { Kernel, PackageStatus } from "../../types";
import KernelChangelogModal from "../../components/configuration/KernelChangelogModal";

// For data from `get_system_kernels`
interface InstalledKernel {
  name: string;
  version: string;
  flavor: string;
}

interface InstallableKernel {
  package_name: string;
  version: string;
  description: string;
  flavor: string;
}

interface KernelData {
  running_kernel: string;
  installed_kernels: InstalledKernel[];
  installable_kernels: InstallableKernel[];
}

const formatKernelPackageName = (pkg: string): string => {
  if (pkg.endsWith("-meta")) {
    pkg = pkg.slice(0, -5);
  }
  return pkg
    .replace("linux-", "Linux ")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const KernelPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const packagesState = useAppSelector((state) => state.packages.packagesState);
  const language = useAppSelector((state) => state.app.language);
  const [changelogKernel, setChangelogKernel] = useState<Kernel | null>(null);

  const [kernels, setKernels] = useState<Kernel[]>([]);
  const [installedKernels, setInstalledKernels] = useState<InstalledKernel[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [kernelsPerPage, setKernelsPerPage] = useState(5);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const calculateKernelsPerPage = () => {
      // A simple estimation of available height for the list
      const chromeHeight = 380; // Approximate height for headers, footers, titles, padding, etc.
      const itemHeight = 90; // Approximate height for a single kernel item
      const availableHeight = window.innerHeight - chromeHeight;

      let count = Math.floor(availableHeight / itemHeight);

      // As per request, clamp the value between 4 and 10
      count = Math.max(4, Math.min(10, count));

      setKernelsPerPage(count);
    };

    calculateKernelsPerPage();
    window.addEventListener("resize", calculateKernelsPerPage);

    return () => {
      window.removeEventListener("resize", calculateKernelsPerPage);
    };
  }, []);

  useEffect(() => {
    const totalPages = Math.ceil(kernels.length / kernelsPerPage);
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [kernelsPerPage, kernels.length, currentPage]);

  useEffect(() => {
    const fetchKernels = async () => {
      try {
        const result: string = await invoke("get_system_kernels");
        const kernelData: KernelData = JSON.parse(result);

        const runningVersion = kernelData.running_kernel;
        setInstalledKernels(kernelData.installed_kernels);

        const kernelMap = new Map<string, Kernel>();

        // Process installed kernels
        kernelData.installed_kernels.forEach((k) => {
          let releaseType: Kernel["releaseType"] = "stable";
          if (k.flavor === "lts") releaseType = "lts";
          else if (k.flavor === "default") releaseType = "stable";

          const key = `${k.name}-${k.version}`;
          kernelMap.set(key, {
            version: k.version,
            pkg: k.name,
            releaseType,
            running: k.version === runningVersion,
          });
        });

        // Process installable kernels
        kernelData.installable_kernels
          .filter(
            (k) =>
              k.package_name.startsWith("linux-") &&
              k.package_name.endsWith("-meta") &&
              !k.package_name.includes("headers")
          )
          .forEach((k) => {
            const key = k.package_name;
            if (!kernelMap.has(key)) {
              let releaseType: Kernel["releaseType"] = "stable";
              if (k.flavor === "lts") releaseType = "lts";
              kernelMap.set(key, {
                version: k.version,
                pkg: k.package_name,
                releaseType: releaseType,
                running: false,
              });
            }
          });

        const combinedKernels = Array.from(kernelMap.values());

        combinedKernels.sort((a, b) => {
          const isAInstalled = kernelData.installed_kernels.some(
            (ik) => ik.version === a.version
          );
          const isBInstalled = kernelData.installed_kernels.some(
            (ik) => ik.version === b.version
          );

          if (isAInstalled && !isBInstalled) return -1;
          if (!isAInstalled && isBInstalled) return 1;

          return b.version.localeCompare(a.version, undefined, {
            numeric: true,
          });
        });

        setKernels(combinedKernels);
        setError(null);
      } catch (err) {
        console.error("Failed to get kernel status:", err);
        setError("Could not load kernel information.");
      } finally {
        setLoading(false);
      }
    };

    fetchKernels();
  }, []);

  const handleRemove = (kernel: Kernel) => {
    const confirmationText = t("remove_kernel_confirm_text").replace(
      "{kernelVersion}",
      `Linux ${kernel.version}`
    );
    if (window.confirm(confirmationText)) {
      dispatch(remove(kernel.pkg));
    }
  };

  const renderButton = (kernel: Kernel) => {
    const state = packagesState[kernel.pkg];
    const isInstalled =
      state?.status === PackageStatus.Installed ||
      installedKernels.some(
        (k) => k.version === kernel.version && state === undefined
      );

    if (state?.status === PackageStatus.Installing) {
      return (
        <div className="w-28 text-center">
          <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2">
            <motion.div
              className="bg-[var(--primary-color)] h-2 rounded-full"
              animate={{ width: `${state.progress || 0}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {Math.round(state.progress || 0)}%
          </p>
        </div>
      );
    }
    if (state?.status === PackageStatus.Error) {
      return (
        <button
          onClick={() => dispatch(install(kernel.pkg))}
          title={state.error}
          className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors w-28 text-center"
        >
          {t("retry")}
        </button>
      );
    }

    if (isInstalled) {
      if (kernel.running) {
        return (
          <button
            disabled
            className="px-4 py-1.5 text-sm bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-md cursor-not-allowed w-28 text-center"
          >
            {t("installed")}
          </button>
        );
      }
      return (
        <button
          onClick={() => handleRemove(kernel)}
          className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors w-28 text-center"
        >
          {t("remove")}
        </button>
      );
    }

    return (
      <button
        onClick={() => dispatch(install(kernel.pkg))}
        className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all w-28 text-center"
      >
        {t("install")}
      </button>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <BlurredCard className="p-4 animate-pulse">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-3">
                <div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </BlurredCard>
      );
    }

    if (error) {
      return (
        <BlurredCard className="p-4">
          <div className="flex flex-col items-center justify-center p-10 gap-4 text-red-500">
            <AppIcon name="error" className="w-12 h-12" />
            <p className="font-semibold text-lg">{error}</p>
          </div>
        </BlurredCard>
      );
    }

    const totalPages = Math.ceil(kernels.length / kernelsPerPage);
    const paginatedKernels = kernels.slice(
      (currentPage - 1) * kernelsPerPage,
      currentPage * kernelsPerPage
    );

    return (
      <>
        <BlurredCard className="p-4">
          <div className="space-y-2">
            {paginatedKernels.map((k) => (
              <div
                key={`${k.pkg}-${k.version}`}
                className={`flex justify-between items-center p-3 rounded-lg transition-colors ${k.running ? "bg-[var(--primary-color)]/10" : ""
                  } ${packagesState[k.pkg]?.status === PackageStatus.Error
                    ? "bg-red-500/10"
                    : "hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                  }`}
              >
                <div className="flex-grow pr-4 overflow-hidden">
                  <p
                    className="font-semibold text-lg text-gray-800 dark:text-gray-200 truncate"
                    title={formatKernelPackageName(k.pkg)}
                  >
                    {formatKernelPackageName(k.pkg)}
                  </p>
                  <p
                    className="text-sm text-gray-500 dark:text-gray-400 truncate -mt-1"
                    title={k.version}
                  >
                    {k.version}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setChangelogKernel(k)}
                    className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("changelog")}
                  </button>
                  {renderButton(k)}
                </div>
              </div>
            ))}
          </div>
        </BlurredCard>
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

  return (
    <>
      <Panel title={t("kernel_manager")}>
        <p className="text-gray-600 dark:text-gray-400 -mt-4 mb-6">
          {t("kernel_manager_desc")}
        </p>
        {renderContent()}
      </Panel>
      <AnimatePresence>
        {changelogKernel && (
          <KernelChangelogModal
            kernel={changelogKernel}
            onClose={() => setChangelogKernel(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default KernelPanel;
