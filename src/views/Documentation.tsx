import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import BlurredCard from "../components/BlurredCard";
import { useAppSelector } from "../store/hooks";
import { translations } from "../data/translations";

import distroReadme from "../docs/distro-readme.md?raw";
import distroReleaseInfo from "../docs/distro-release-info.md?raw";
import distroInvolved from "../docs/distro-involved.md?raw";

const Documentation: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const [activeSection, setActiveSection] = useState<
    "readme" | "release" | "involved"
  >("readme");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      className="h-full w-full flex items-center justify-center p-4 md:p-10 overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          {t("documentation")}
        </h1>
        <p className="text-center text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
          {t("documentation_desc")}
        </p>

        <BlurredCard className="p-4 md:p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setActiveSection("readme")}
              className={`px-4 py-2 rounded-full text-sm md:text-base transition-colors ${
                activeSection === "readme"
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              {t("readme")}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("release")}
              className={`px-4 py-2 rounded-full text-sm md:text-base transition-colors ${
                activeSection === "release"
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              {t("release_info")}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("involved")}
              className={`px-4 py-2 rounded-full text-sm md:text-base transition-colors ${
                activeSection === "involved"
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              {t("involved")}
            </button>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white/70 dark:bg-gray-900/60 p-4 md:p-6 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeSection === "readme"
                  ? distroReadme
                  : activeSection === "release"
                  ? distroReleaseInfo
                  : distroInvolved}
              </ReactMarkdown>
            </div>
          </div>
        </BlurredCard>
      </div>
    </motion.div>
  );
};

export default Documentation;

