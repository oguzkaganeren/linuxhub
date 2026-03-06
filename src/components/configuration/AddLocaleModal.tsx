import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { languages, territories } from '../../data/locales';
import { SystemLocale } from '../../types';

interface AddLocaleModalProps {
    onClose: () => void;
    onAdd: (locale: SystemLocale) => void;
}

const AddLocaleModal: React.FC<AddLocaleModalProps> = ({ onClose, onAdd }) => {
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [selectedTerritory, setSelectedTerritory] = useState('United States');
    const [localeString, setLocaleString] = useState('');

    const languageState = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[languageState]?.[key] || translations['en']?.[key] || key;
    }, [languageState]);

    useEffect(() => {
        // This is a simplified locale string generator for demonstration
        const langCode = selectedLanguage.substring(0, 2).toLowerCase();
        const terrCode = selectedTerritory.split(' ').pop()?.substring(0, 2).toUpperCase() || 'US';
        setLocaleString(`${langCode}_${terrCode}.UTF-8`);
    }, [selectedLanguage, selectedTerritory]);
    
    const handleAdd = () => {
        onAdd({
            name: `${selectedLanguage} (${selectedTerritory})`,
            id: localeString
        });
    }

    const ListBox: React.FC<{ title: string; items: string[]; selected: string; onSelect: (item: string) => void }> = ({ title, items, selected, onSelect }) => (
        <div className="flex flex-col flex-1">
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h3>
            <ul className="h-48 md:h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50 p-1">
                {items.map(item => (
                    <li key={item}>
                        <button
                            onClick={() => onSelect(item)}
                            className={`w-full text-left px-3 py-1.5 rounded-md transition-colors text-sm ${
                                selected === item
                                ? 'bg-[var(--primary-color)] text-white'
                                : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
                className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold">{t('add_locale')}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={t('close')}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
                        <ListBox title={t('language_list')} items={languages} selected={selectedLanguage} onSelect={setSelectedLanguage} />
                        <ListBox title={t('territory_list')} items={territories} selected={selectedTerritory} onSelect={setSelectedTerritory} />
                    </div>

                    <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-900/50">
                        <span className="font-semibold">{t('locale_preview')}:</span>
                        <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm">{localeString}</span>
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        <button onClick={onClose} className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            {t('cancel')}
                        </button>
                        <button onClick={handleAdd} className="px-6 py-2 rounded-md font-semibold text-white bg-[var(--primary-color)] hover:brightness-90 transition-all">
                            {t('add')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AddLocaleModal;