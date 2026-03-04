import React, { useCallback } from 'react';
import { X, Sun, Moon, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { translations, supportedLanguages } from '../data/translations';
import { setLanguage, closeSettingsModal, setLaunchOnStart, navigateTo } from '../store/appSlice';
import { toggleThemeMode, setPrimaryColor } from '../store/themeSlice';


const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6'];

const SettingsModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const { 
        language,
        launchOnStart
    } = useAppSelector(state => state.app);
    const theme = useAppSelector(state => state.theme);

    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    const handleClose = () => dispatch(closeSettingsModal());

    return (
        <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center z-50"
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
                className="w-full max-w-md md:max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div 
                    className="p-6 shadow-2xl bg-white dark:bg-gray-800 rounded-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold">{t('app_settings')}</h2>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={t('close')}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Language Settings */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{t('language')}</h3>
                            <div className="flex gap-2">
                                {Object.entries(supportedLanguages).map(([code, name]) => (
                                    <button
                                        key={code}
                                        onClick={() => dispatch(setLanguage(code))}
                                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                            language === code
                                                ? 'bg-[var(--primary-color)] text-white'
                                                : 'bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Appearance Settings */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{t('appearance')}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                                    <span className="font-medium">{t('theme')}</span>
                                    <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                                        <button onClick={() => dispatch(toggleThemeMode())} disabled={theme.mode === 'light'} className={`p-1.5 rounded ${theme.mode === 'light' ? 'bg-white dark:bg-gray-500' : ''}`} aria-label={t('light_mode')}><Sun size={18}/></button>
                                        <button onClick={() => dispatch(toggleThemeMode())} disabled={theme.mode === 'dark'} className={`p-1.5 rounded ${theme.mode === 'dark' ? 'bg-white dark:bg-gray-500' : ''}`} aria-label={t('dark_mode')}><Moon size={18}/></button>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                                    <p className="font-medium mb-3">{t('accent_color')}</p>
                                    <div className="grid grid-cols-5 gap-4">
                                        {colors.map(color => (
                                            <button key={color} onClick={() => dispatch(setPrimaryColor(color))} style={{backgroundColor: color}} className={`w-full h-12 rounded-lg transition-transform transform hover:scale-105 ${theme.primaryColor === color ? 'ring-4 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 ring-white' : ''}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* General Settings */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{t('general')}</h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                                    <label htmlFor="launch-on-start" className="font-medium">{t('launch_on_start')}</label>
                                    <div
                                        onClick={() => dispatch(setLaunchOnStart(!launchOnStart))}
                                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-300 ${launchOnStart ? 'bg-[var(--primary-color)]' : 'bg-gray-400 dark:bg-gray-600'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${launchOnStart ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        dispatch(closeSettingsModal());
                                        dispatch(navigateTo('about'));
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 w-full text-left"
                                >
                                    <span className="font-medium">{t('about')}</span>
                                    <Info size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SettingsModal;