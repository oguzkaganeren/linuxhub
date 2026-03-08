import React, { useCallback } from "react";
import BlurredCard from "./BlurredCard";
import AppIcon from "./icons";
import { X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  selectInstallQueue,
  removeFromQueue,
  install,
  cancelInstallation,
} from "../store/packagesSlice";
import { translations } from "../data/translations";
import toast from "react-hot-toast";
import { PackageStatus, App } from "../types";

interface InstallQueueProps {
  onClose: () => void;
}


const InstallQueueItem: React.FC<{ app: App }> = React.memo(({ app }) => {
  const dispatch = useAppDispatch();
  // ⚡ Bolt Optimization: Subscribe only to this package's state to prevent
  // the entire list from re-rendering on progress updates
  const state = useAppSelector((state) => state.packages.packagesState[app.pkg]);
  const language = useAppSelector((state) => state.app.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const handleRemove = () => {
    if (state?.status === PackageStatus.Installing) {
      dispatch(cancelInstallation(app.pkg));
    } else if (state?.status === PackageStatus.Error) {
      dispatch(removeFromQueue(app.pkg));
      toast.success(`${app.name} ${t("toast_removed_from_queue")}`);
    }
  };

  const handleRetry = () => {
    dispatch(install(app.pkg));
  };

  const progress = state?.progress ?? 0;
  const progressDetail = state?.progressDetail;
  const isError = state?.status === PackageStatus.Error;

  return (
    <motion.div
      layout
      title={isError ? state?.error : ""}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      className={`flex items-center gap-4 p-2 rounded-lg ${
        isError ? "bg-red-500/10" : ""
      }`}
    >
      <AppIcon name={app.icon} className="w-10 h-10 flex-shrink-0" />
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold truncate">{app.name}</p>
        {isError ? (
          <div className="flex items-center gap-2 mt-1">
            <AppIcon name="error" className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-red-500">{t("error")}</p>
          </div>
        ) : (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <div
                className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Installing ${app.name}`}
              >
                <motion.div
                  className="bg-[var(--primary-color)] h-2.5 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "linear" }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
                {Math.round(progress)}%
              </span>
            </div>
            {progressDetail && (
              <p
                className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate"
                title={progressDetail}
              >
                {progressDetail}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center flex-shrink-0">
        {isError && (
          <button
            onClick={handleRetry}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-[var(--primary-color)]/20 hover:text-[var(--primary-color)] transition-colors"
            aria-label={`Retry installation of ${app.name}`}
          >
            <RefreshCw size={18} />
          </button>
        )}
        <button
          onClick={handleRemove}
          className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
          aria-label={`Cancel installation of ${app.name}`}
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
});


const InstallQueue: React.FC<InstallQueueProps> = ({ onClose }) => {
  const installQueue = useAppSelector(selectInstallQueue);
  const language = useAppSelector((state) => state.app.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  return (
    <motion.div
      className="absolute bottom-14 right-6 w-96 z-10"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <BlurredCard className="p-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">{t("install_queue")}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
          <AnimatePresence>
            {installQueue.map((app) => (
              <InstallQueueItem key={app.pkg} app={app} />
            ))}
          </AnimatePresence>
          {installQueue.length === 0 && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {t("install_queue_empty")}
            </div>
          )}
        </div>
      </BlurredCard>
    </motion.div>
  );
};

export default InstallQueue;
