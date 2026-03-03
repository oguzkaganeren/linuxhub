// FIX: Update the Packages view to handle installation errors. The `AppCard`
// and `AppDetailsModal` components now display a "Retry" button when an
// installation fails.
import React, { useState, useEffect, useCallback } from "react";
import { packageData } from "../data/packages";
import { Category, App } from "../types";
import AppIcon from "../components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import { translations } from "../data/translations";
import { useDebounce } from "../hooks/useDebounce";
import AppCardSkeleton from "../components/packages/AppCardSkeleton";
import AppDetailsModal from "../components/packages/AppDetailsModal";
import AppCard from "../components/packages/AppCard";

// Helper to keep the onShowDetails reference stable for React.memo
const AppCardWrapper = React.memo(({ app, onShowDetails }: { app: App, onShowDetails: (app: App) => void }) => {
  return <AppCard app={app} onShowDetails={() => onShowDetails(app)} />;
});

const Packages: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const packagesGlobalStatus = useAppSelector((state) => state.packages.status);
  const isSidebarCollapsed = useAppSelector(
    (state) => state.app.isSidebarCollapsed
  );
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const [selectedCategory, setSelectedCategory] = useState<Category>(
    packageData[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);

  // ⚡ Bolt Optimization: Use a stable callback for AppCard clicks to prevent React.memo invalidation
  const handleShowDetails = useCallback((app: App) => {
    setSelectedApp(app);
  }, []);

  useEffect(() => {
    setLocalLoading(true);
    const timer = setTimeout(() => {
      let apps: App[];
      if (debouncedSearchTerm) {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        apps = packageData
          .flatMap((cat) => cat.apps)
          .filter(
            (app) =>
              app.name.toLowerCase().includes(lowercasedTerm) ||
              app.description.toLowerCase().includes(lowercasedTerm)
          );
      } else {
        apps = selectedCategory.apps;
      }
      setFilteredApps(apps);
      setLocalLoading(false);
    }, 300); // Simulate network latency

    return () => clearTimeout(timer);
  }, [selectedCategory, debouncedSearchTerm]);

  const displayTitle = debouncedSearchTerm
    ? `${t("search_results_for")} "${debouncedSearchTerm}"`
    : selectedCategory.name;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const isLoading =
    packagesGlobalStatus === "loading" ||
    packagesGlobalStatus === "idle" ||
    localLoading;

  return (
    <div className="h-full flex">
      {/* Left Category Rail */}
      <aside
        className={`flex-shrink-0 p-4 pl-6 pr-2 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-24 pl-4" : "w-52 md:w-64"
        }`}
      >
        <div className="h-full bg-gray-100/80 dark:bg-gray-800/50 rounded-xl p-2 md:p-4 flex flex-col gap-1">
          {packageData.map((cat) => (
            <button
              key={cat.name}
              title={cat.name}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchTerm("");
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md font-medium transition-colors text-sm md:text-base overflow-hidden min-h-[44px] ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                selectedCategory.name === cat.name && !searchTerm
                  ? "bg-[var(--primary-color)]/20 text-[var(--primary-color)]"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <AppIcon name={cat.icon} className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate">{cat.name}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-6 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {displayTitle}
          </h1>
          <div className="relative w-full md:w-1/3">
            <AppIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10"
            />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              >
                {Array.from({ length: 15 }).map((_, index) => (
                  <AppCardSkeleton key={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={displayTitle}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredApps.map((app) => (
                  <motion.div key={app.pkg} variants={itemVariants}>
                    <AppCardWrapper
                      app={app}
                      onShowDetails={handleShowDetails}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {selectedApp && (
          <AppDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Packages;
