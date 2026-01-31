import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const UsersPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const users = sysInfo?.users || [];
  const loading = status === "idle";
  const error = status === "failed" ? "Could not load user information." : null;

  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const toggleExpand = (userName: string) => {
    setExpandedUser((prev) => (prev === userName ? null : userName));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
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
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.name}>
            <button
              onClick={() => toggleExpand(user.name)}
              className="w-full flex justify-between items-center p-3 rounded-lg text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <AppIcon name="user" className="w-5 h-5" />
                <span className="font-semibold">{user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.groups.length} groups
                </span>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${expandedUser === user.name ? "rotate-90" : ""
                    }`}
                />
              </div>
            </button>
            <AnimatePresence>
              {expandedUser === user.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pl-8 pr-4 pb-2"
                >
                  <div className="p-3 bg-gray-100/50 dark:bg-gray-800/30 rounded-md">
                    <h4 className="font-semibold mb-2">{t("groups")}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.groups.map((group) => (
                        <span
                          key={group}
                          className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-medium rounded-full"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Panel title={t("users")}>
      <BlurredCard className="p-4">{renderContent()}</BlurredCard>
    </Panel>
  );
};

export default UsersPanel;
