import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { App, PackageStatus } from "../../types";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { install, remove } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import { packageData } from "../../data/packages";
import AppIcon from "../icons";

interface AppDetailsModalProps {
  app: App;
  onClose: () => void;
}

const AppDetailsModal: React.FC<AppDetailsModalProps> = ({ app, onClose }) => {
  const dispatch = useAppDispatch();
  const packagesState = useAppSelector((state) => state.packages.packagesState);
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const category = packageData.find((cat) =>
    cat.apps.some((a) => a.pkg === app.pkg)
  );

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(install(app.pkg));
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmationText = t("remove_package_confirm_text").replace(
      "{packageName}",
      app.name
    );
    if (window.confirm(confirmationText)) {
      dispatch(remove(app.pkg));
    }
  };

  const renderModalButton = () => {
    const state = packagesState[app.pkg];
    if (!state) return null;

    switch (state.status) {
      case PackageStatus.NotInstalled:
        return (
          <button
            onClick={handleInstall}
            className="px-8 py-3 text-base bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all shadow-md w-48 text-center"
          >
            {t("install")}
          </button>
        );
      case PackageStatus.Installing:
        const progressDetail = state?.progressDetail;
        return (
          <div className="w-48 text-center">
            <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2.5">
              <motion.div
                className="bg-[var(--primary-color)] h-2.5 rounded-full"
                animate={{ width: `${state.progress || 0}%` }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </div>
            <p
              className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate"
              title={progressDetail}
            >
              {progressDetail ||
                `${t("installing")} ${Math.round(state.progress || 0)}%`}
            </p>
          </div>
        );
      case PackageStatus.Installed:
        return (
          <button
            onClick={handleRemove}
            className="px-8 py-3 text-base bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md w-48 text-center"
          >
            {t("remove")}
          </button>
        );
      case PackageStatus.UpdateAvailable:
        return (
          <button
            onClick={handleInstall}
            className="px-8 py-3 text-base bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-md w-48 text-center"
          >
            {t("update_available")}
          </button>
        );
      case PackageStatus.Error:
        return (
          <button
            onClick={handleInstall}
            title={state.error}
            className="px-8 py-3 text-base bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md w-48 text-center"
          >
            {t("retry")}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-lg lg:max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors z-10"
          aria-label={t("close")}
        >
          <X size={24} />
        </button>

        <div className="p-6 md:p-8">
          <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <AppIcon
              name={app.icon}
              className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0"
            />
            <div className="flex flex-col items-center sm:items-start flex-grow text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                {app.name}
              </h2>
              {category && (
                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400">
                  {category.name}
                </p>
              )}
            </div>
          </header>

          <main>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {app.description}
            </p>

            {app.extra && app.extra.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">
                  {t("extra_packages")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {app.extra.map((pkg) => (
                    <span
                      key={pkg}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-md"
                    >
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </main>

          <footer className="flex justify-end items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            {renderModalButton()}
          </footer>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AppDetailsModal;
