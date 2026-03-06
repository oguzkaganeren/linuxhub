import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { addPrinterCmd } from "../../lib/printer";

interface AddPrinterModalProps {
  onClose: () => void;
}

const AddPrinterModal: React.FC<AddPrinterModalProps> = ({ onClose }) => {
  const { language } = useAppSelector((state) => state.app);

  const [formData, setFormData] = useState({
    name: "",
    deviceUri: "",
    ppd: "",
    description: "",
    location: "",
  });

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addPromise = addPrinterCmd(formData);

    toast.promise(addPromise, {
      loading: t("toast_printer_add_inprogress"),
      success: () => {
        onClose();
        return t("toast_printer_add_success");
      },
      error: (err) => {
        console.error(err);
        const errorMessage =
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : String(err);
        return `${t("toast_printer_add_failed")}: ${errorMessage}`;
      },
    });
  };

  const renderInput = (
    id: keyof typeof formData,
    label: string,
    required = false,
    placeholder = ""
  ) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={id}
        value={formData[id]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
      />
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center z-50 p-4"
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
        className="w-full max-w-sm md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 shadow-2xl bg-white dark:bg-gray-800 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold">
              {t("add_new_printer")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={t("close")}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderInput(
              "name",
              t("printer_name"),
              true,
              "e.g., Office_Printer"
            )}
            {renderInput(
              "deviceUri",
              t("device_uri"),
              true,
              "e.g., usb://HP/LaserJet"
            )}
            {renderInput(
              "ppd",
              t("ppd_path"),
              true,
              "/usr/share/ppd/hp/hp-laserjet.ppd"
            )}
            {renderInput(
              "description",
              t("description"),
              false,
              "e.g., HP LaserJet in Room 101"
            )}
            {renderInput("location", t("location"), false, "e.g., Room 101")}

            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-md font-semibold text-white bg-[var(--primary-color)] hover:brightness-90 transition-all"
              >
                {t("add")}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddPrinterModal;
