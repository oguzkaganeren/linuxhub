import React, { useCallback } from "react";
import BlurredCard from "../components/BlurredCard";
import AppIcon from "../components/icons";
import { ArrowRight, HardDrive, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "../store/hooks";
import { translations } from "../data/translations";
import { Command } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const language = useAppSelector((state) => state.app.language);
  const isLiveMode = useAppSelector((state) => state.app.isLiveMode);
  const isCheckingLiveMode = useAppSelector(
    (state) => state.app.isCheckingLiveMode
  );

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const [distro, setDistro] = React.useState<string>("Linux");

  React.useEffect(() => {
    const fetchDistro = async () => {
      try {
        const result = await invoke<string>("get_distro");
        setDistro(result);
      } catch (error) {
        console.error("Failed to fetch distro:", error);
      }
    };
    fetchDistro();
  }, []);

  const handleInstall = async () => {
    try {
      // Calamares is a common installer for Arch-based distros like Manjaro.
      toast.success("Starting installer... (mocked)");
      await Command.create("calamares").spawn();
    } catch (error) {
      console.error("Failed to launch installer:", error);
      toast.error("Could not start the installation process.");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const renderStartButton = () => {
    if (isCheckingLiveMode) {
      return (
        <motion.button
          key="checking"
          variants={item}
          disabled
          className="px-6 py-3 md:px-8 md:py-4 bg-gray-400 dark:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform flex items-center gap-2 group mx-auto md:mx-0 cursor-wait"
        >
          <RefreshCw size={20} className="animate-spin" />
          <span>{t("checking_environment")}</span>
        </motion.button>
      );
    }

    if (isLiveMode) {
      return (
        <motion.div
          key="live"
          variants={item}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
        >
          <motion.button
            onClick={handleInstall}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 md:px-8 md:py-4 bg-green-500 text-white font-semibold rounded-xl shadow-lg hover:bg-green-600 transition-all duration-300 transform flex items-center gap-2 group w-full sm:w-auto justify-center"
          >
            <HardDrive size={20} />
            <span>{t("install_now")}</span>
          </motion.button>
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 md:px-8 md:py-4 bg-[var(--primary-color)] text-white font-semibold rounded-xl shadow-lg hover:brightness-90 transition-all duration-300 transform flex items-center gap-2 group w-full sm:w-auto justify-center"
          >
            <span>{t("start")}</span>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </motion.button>
        </motion.div>
      );
    }

    return (
      <motion.button
        key="start"
        onClick={onStart}
        variants={item}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 md:px-8 md:py-4 bg-[var(--primary-color)] text-white font-semibold rounded-xl shadow-lg hover:brightness-90 transition-all duration-300 transform flex items-center gap-2 group mx-auto md:mx-0"
      >
        <span>{t("start")}</span>
        <ArrowRight
          size={20}
          className="transition-transform group-hover:translate-x-1"
        />
      </motion.button>
    );
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left Content Section */}
        <motion.div
          className="text-center md:text-left"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={item}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
          >
            {t("welcome_to")}
            <br />
            <span className="bg-gradient-to-r from-[var(--primary-color)] to-purple-500 bg-clip-text text-transparent">
              {distro}
            </span>
          </motion.h1>
          <motion.p
            variants={item}
            className="text-base lg:text-lg text-gray-700 dark:text-gray-300 max-w-lg mx-auto md:mx-0 mb-10"
          >
            {t("app_subtitle")}
          </motion.p>
          <AnimatePresence mode="wait">{renderStartButton()}</AnimatePresence>
        </motion.div>

        {/* Right Visual Section */}
        <motion.div
          className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, delay: 0.4 },
          }}
        >
          <BlurredCard className="w-full h-full relative overflow-hidden">
            {/* Floating Icons */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2">
              <AppIcon
                name="browser"
                className="w-16 h-16 md:w-24 md:h-24 text-[var(--primary-color)] opacity-90"
              />
            </div>
            <div className="absolute top-8 right-10 md:top-12 md:right-20">
              <AppIcon
                name="visual-studio-code"
                className="w-14 h-14 md:w-20 md:h-20 text-sky-400 opacity-80"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <AppIcon
                name="system"
                className="w-20 h-20 md:w-32 md:h-32 text-purple-500 opacity-95"
              />
            </div>
            <div className="hidden sm:block absolute bottom-12 left-1/3">
              <AppIcon
                name="gimp"
                className="w-16 h-16 text-gray-500 opacity-70"
              />
            </div>
            <div className="absolute bottom-1/4 right-1/4">
              <AppIcon
                name="spotify"
                className="w-16 h-16 md:w-24 md:h-24 text-green-500 opacity-90"
              />
            </div>
            <div className="hidden md:block absolute top-2/3 left-12">
              <AppIcon
                name="kernel"
                className="w-14 h-14 text-gray-400 opacity-60"
              />
            </div>
            <div className="absolute top-12 left-6 md:top-16 md:left-8">
              <AppIcon
                name="mail-client"
                className="w-10 h-10 md:w-12 md:h-12 text-orange-400 opacity-75"
              />
            </div>
            <div className="hidden sm:block absolute bottom-8 right-10">
              <AppIcon
                name="personalization"
                className="w-16 h-16 text-pink-500 opacity-85"
              />
            </div>
          </BlurredCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
