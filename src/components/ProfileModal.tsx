import React, { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { translations } from "../data/translations";
import { closeProfileModal, updateUserProfile } from "../store/appSlice";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  password?: string;
}

const ProfileModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, user } = useAppSelector((state) => state.app);

  const [formData, setFormData] = useState<FormData>({
    ...user,
    username: user.email.split("@")[0],
    password: "",
  });

  useEffect(() => {
    setFormData({
      ...user,
      username: user.email.split("@")[0],
      password: "",
    });
  }, [user]);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const handleClose = () => dispatch(closeProfileModal());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, username, password, avatarUrl } = formData;
    const originalUsername = user.email.split("@")[0];

    const realNameChanged = name !== user.name;
    const usernameChanged = username !== originalUsername;

    if ((realNameChanged || usernameChanged) && !password) {
      toast.error(t("password_for_changes_required"));
      return;
    }

    if (!realNameChanged && !usernameChanged) {
      // If only avatar changed
      if (avatarUrl !== user.avatarUrl) {
        dispatch(
          updateUserProfile({ name, email: `${username}@linux.com`, avatarUrl })
        );
        toast.success(t("toast_profile_updated"));
      }
      handleClose();
      return;
    }

    const updatePromise = async () => {
      if (realNameChanged) {
        await invoke("change_real_name", { newName: name, password });
      }
      if (usernameChanged) {
        await invoke("change_username", {
          currentUsername: originalUsername,
          newUsername: username,
          password,
        });
      }
    };

    toast.promise(updatePromise(), {
      loading: t("toast_user_update_inprogress"),
      success: () => {
        dispatch(
          updateUserProfile({ name, email: `${username}@linux.com`, avatarUrl })
        );
        handleClose();
        return t("toast_profile_updated");
      },
      error: (err) => {
        console.error(err);
        // err is an object from Tauri, often with a string message
        const errorMessage =
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : String(err);
        return `${t("toast_user_update_failed")}: ${errorMessage}`;
      },
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClose}
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
              {t("edit_profile")}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={t("close")}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("name")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("username")}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("avatar_url")}
              </label>
              <input
                type="url"
                id="avatarUrl"
                name="avatarUrl"
                value={formData.avatarUrl || ""}
                onChange={handleChange}
                placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("password_for_changes")}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("password_for_changes_placeholder")}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
              />
            </div>

            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-md font-semibold text-white bg-[var(--primary-color)] hover:brightness-90 transition-all"
              >
                {t("save")}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;
