import React, { useState, useEffect, useCallback } from 'react';
import BlurredCard from '../components/BlurredCard';
import AppIcon from '../components/icons';
import { motion } from 'framer-motion';
import { useAppSelector } from '../store/hooks';
import { translations } from '../data/translations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const About: React.FC = () => {
  const language = useAppSelector(state => state.app.language);
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);
  
  const version = '1.1.0'; 
  const [changelogText, setChangelogText] = useState<string>('');
  const [loadingChangelog, setLoadingChangelog] = useState<boolean>(true);

  useEffect(() => {
    fetch('/changelog.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Changelog file not found');
        }
        return response.text();
      })
      .then(text => {
        setChangelogText(text);
      })
      .catch(error => {
        console.error('Error fetching changelog:', error);
        setChangelogText('Could not load changelog.');
      })
      .finally(() => {
        setLoadingChangelog(false);
      });
  }, []);

  return (
    <div className="h-full flex flex-col items-center p-8 overflow-y-auto">
      <motion.div
        className="w-full max-w-2xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <BlurredCard className="p-8 w-full">
          <div className="text-center mb-6">
            <AppIcon
              name="system"
              className="w-20 h-20 mx-auto text-[var(--primary-color)] mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold">{t('app_name')}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
              {t('version')} {version}
            </p>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            {t('app_subtitle')}
          </p>

          <hr className="border-gray-200 dark:border-gray-700 my-6" />

          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">
            {t('credits')}
          </h2>
          <div className="text-center space-y-2 text-gray-700 dark:text-gray-200">
            <p>
              <span className="font-semibold">Lead Developer:</span> AI Engineer
            </p>
            <p>
              <span className="font-semibold">UI/UX Design:</span> AI Engineer
            </p>
            <p className="pt-4 text-sm text-gray-500 dark:text-gray-400">
              {t('about_powered_by')}
            </p>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-700 my-8" />

          <div className="text-left">
            {loadingChangelog ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Loading changelog...</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h3 className="text-lg md:text-xl font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-5 list-disc" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-gray-700 dark:text-gray-100" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-gray-600 dark:text-gray-300" {...props} />
                  ),
                }}
              >
                {changelogText}
              </ReactMarkdown>
            )}
          </div>
        </BlurredCard>
      </motion.div>
    </div>
  );
};

export default About;