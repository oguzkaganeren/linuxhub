import React, { useEffect, useCallback, useLayoutEffect } from "react";
import Landing from "./views/Landing";
import Home from "./views/Home";
import Packages from "./views/Packages";
import Configuration from "./views/Configuration";
import About from "./views/About";
import TitleBar from "./components/TitleBar";
import StatusBar from "./components/StatusBar";
import SettingsModal from "./components/SettingsModal";
import ProfileModal from "./components/ProfileModal";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Page, PackageStatus } from "./types";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { navigateTo, setOnlineStatus, setLiveMode } from "./store/appSlice";
import { setProgress, checkAllPackageStates } from "./store/packagesSlice";
import { updateSystemInfo, systemInfoError } from "./store/systemSlice";
import { translations } from "./data/translations";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";
import { store } from "./store/store";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.app.page);
  const isSettingsModalOpen = useAppSelector(
    (state) => state.app.isSettingsModalOpen
  );
  const isProfileModalOpen = useAppSelector(
    (state) => state.app.isProfileModalOpen
  );
  const theme = useAppSelector((state) => state.theme);
  const language = useAppSelector((state) => state.app.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  // Effect for theme mode changes
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme.mode]);

  // Effect for theme primary color changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--primary-color",
      theme.primaryColor
    );
  }, [theme.primaryColor]);

  // Effect for online status
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      toast.success(t("toast_online"));
    };
    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      toast.error(t("toast_offline"));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch, t]);

  // Effect for Live Mode detection simulation
  useEffect(() => {
    const checkLiveMode = async () => {
      // This is a mock of how you might detect a live environment.
      // In a real scenario, you might check for a specific file,
      // environment variable, or use a Tauri command.
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate async check

      // For demonstration, we'll assume it's a live environment.
      dispatch(setLiveMode(true));
    };
    checkLiveMode();
  }, [dispatch]);

  // Effect for listening to backend package management progress
  useEffect(() => {
    const setupProgressListener = async () => {
      const unlisten = await listen("pacman-progress", (event) => {
        const payload = event.payload as {
          current_step: string;
          detail: string;
        };

        // Workaround: Since the event doesn't contain a package name,
        // find the package that is currently in the 'Installing' state.
        // This assumes only one package operation happens at a time.
        const allPackages = store.getState().packages.packagesState;
        const installingPkg = Object.keys(allPackages).find(
          (pkg) => allPackages[pkg].status === PackageStatus.Installing
        );

        if (installingPkg) {
          const progressUpdate: {
            pkg: string;
            progress?: number;
            detail?: string;
          } = {
            pkg: installingPkg,
            detail: payload.detail,
          };

          let progressValue: number | undefined = undefined;

          // First, try to parse current_step as a direct percentage
          const progressFromStep = parseFloat(payload.current_step);
          if (!isNaN(progressFromStep)) {
            progressValue = progressFromStep;
          } else {
            // If that fails, try to parse a fraction like (1/4) from the detail string
            const detailMatch = payload.detail.match(/\((\d+)\/(\d+)\)/);
            if (detailMatch) {
              const current = parseInt(detailMatch[1], 10);
              const total = parseInt(detailMatch[2], 10);
              if (!isNaN(current) && !isNaN(total) && total > 0) {
                progressValue = (current / total) * 100;
              }
            }
          }

          if (progressValue !== undefined) {
            progressUpdate.progress = Math.min(100, Math.max(0, progressValue));
          }

          dispatch(setProgress(progressUpdate));
        }
      });

      return () => {
        unlisten();
      };
    };

    setupProgressListener();
  }, [dispatch]);

  // Effect for fetching initial package states from the system
  useEffect(() => {
    dispatch(checkAllPackageStates());
  }, [dispatch]);

  // Effect for live system info updates from the backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const SYSTEM_INFO_EVENT = "system-info-update";

    const setupSystemMonitorListener = async () => {
      try {
        unlisten = await listen(SYSTEM_INFO_EVENT, (event) => {
          try {
            const systemData = event.payload;
            const data =
              typeof systemData === "string"
                ? JSON.parse(systemData)
                : systemData;
            dispatch(updateSystemInfo(data));
          } catch (e) {
            console.error("Error parsing system data payload:", e);
            dispatch(systemInfoError("Error parsing system data."));
          }
        });

        // Start the backend emitter after the listener is ready
        await invoke("start_system_monitor");
      } catch (e) {
        console.error("Failed to set up system monitor listener:", e);
        dispatch(systemInfoError("Failed to connect to system monitor."));
      }
    };

    setupSystemMonitorListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
      // Optional: You might want a command to stop the monitor on cleanup
      // invoke('stop_system_monitor').catch(console.error);
    };
  }, [dispatch]);

  const handleNavigate = (p: Page) => dispatch(navigateTo(p));

  const renderPage = () => {
    switch (page) {
      case "landing":
        return <Landing onStart={() => handleNavigate("home")} />;
      case "home":
        return <Home navigate={(p) => handleNavigate(p)} />;
      case "packages":
        return <Packages />;
      case "configuration":
        return <Configuration />;
      case "about":
        return <About />;
      default:
        return <Landing onStart={() => handleNavigate("home")} />;
    }
  };

  const pageKey = page; // Use a stable key for AnimatePresence

  return (
    <div className="h-screen w-screen bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden">
      <Toaster
        position="top-right"
        containerStyle={{
          top: 56, // Titlebar height (48px) + 8px margin
        }}
        toastOptions={{
          style: {
            background: theme.mode === "dark" ? "#1f2937" : "#fff", // gray-800
            color: theme.mode === "dark" ? "#f9fafb" : "#111827", // gray-50, gray-900
          },
        }}
      />
      <TitleBar
        showBackButton={page !== "landing"}
        showMenuButton={page === "packages" || page === "configuration"}
        onBack={() => handleNavigate(page === "home" ? "landing" : "home")}
      />
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <StatusBar />
      <AnimatePresence>
        {isSettingsModalOpen && <SettingsModal />}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileModalOpen && <ProfileModal />}
      </AnimatePresence>
    </div>
  );
};

export default App;
