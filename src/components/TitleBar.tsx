import React, { useCallback } from "react";
import {
  Menu,
  Minus,
  Square,
  X,
  ArrowLeft,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { openSettingsModal, toggleSidebar } from "../store/appSlice";
import { toggleThemeMode } from "../store/themeSlice";
import { translations } from "../data/translations";

interface TitleBarProps {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBack?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  showBackButton,
  showMenuButton,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const language = useAppSelector((state) => state.app.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const handleMinimize = async () => await getCurrentWindow().minimize();
  const handleToggleMaximize = async () =>
    await getCurrentWindow().toggleMaximize();
  const handleClose = async () => await getCurrentWindow().close();

  return (
    <div className="flex items-center justify-between h-12 px-4 bg-transparent flex-shrink-0">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t("app_name")}
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => dispatch(toggleThemeMode())}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme.mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={() => dispatch(openSettingsModal())}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open settings"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={handleMinimize}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Minimize window"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={handleToggleMaximize}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Maximize window"
        >
          <Square size={16} />
        </button>
        <button
          onClick={handleClose}
          className="p-2 rounded hover:bg-red-500/80 transition-colors"
          aria-label="Close window"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
