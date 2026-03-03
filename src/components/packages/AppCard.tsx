import React, { useCallback } from "react";
import { App, PackageStatus } from "../../types";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { install, remove } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import BlurredCard from "../BlurredCard";
import AppIcon from "../icons";

const AppCard: React.FC<{ app: App; onShowDetails: () => void }> = React.memo(({
  app,
  onShowDetails,
}) => {
  const dispatch = useAppDispatch();
  // ⚡ Bolt Optimization: Only subscribe to this specific package's state
  // Previously: const packagesState = useAppSelector((state) => state.packages.packagesState);
  // This caused ALL AppCards to re-render when ANY package changed its install status!
  const state = useAppSelector((state) => state.packages.packagesState[app.pkg]);
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
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

  const renderButton = () => {
    if (!state) return null;

    switch (state.status) {
      case PackageStatus.NotInstalled:
        return (
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all"
          >
            {t("install")}
          </button>
        );
      case PackageStatus.Installing:
        const progressDetail = state?.progressDetail;
        return (
          <div
            className="w-full text-center"
            onClick={(e) => e.stopPropagation()}
            title={progressDetail}
          >
            <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2">
              <div
                className="bg-[var(--primary-color)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
              {progressDetail ||
                `${t("installing")} ${Math.round(state.progress || 0)}%`}
            </p>
          </div>
        );
      case PackageStatus.Installed:
        return (
          <button
            onClick={handleRemove}
            className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
          >
            {t("remove")}
          </button>
        );
      case PackageStatus.UpdateAvailable:
        return (
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 text-sm bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors"
          >
            {t("update_available")}
          </button>
        );
      case PackageStatus.Error:
        return (
          <button
            onClick={handleInstall}
            title={state.error}
            className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
          >
            {t("retry")}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <BlurredCard
      onClick={onShowDetails}
      className="flex flex-col items-center text-center p-4 h-full cursor-pointer hover:border-[var(--primary-color)]/50"
    >
      <AppIcon name={app.icon} className="w-12 h-12 flex-shrink-0" />
      <div className="flex-grow w-full flex flex-col justify-center py-2">
        <h3 className="font-semibold text-md">{app.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 line-clamp-2">
          {app.description}
        </p>
      </div>
      <div className="h-10 w-full flex items-center justify-center flex-shrink-0">
        {renderButton()}
      </div>
    </BlurredCard>
  );
});

export default AppCard;
