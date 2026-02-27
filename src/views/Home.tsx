import React, { useCallback } from 'react';
import BlurredCard from '../components/BlurredCard';
import AppIcon from '../components/icons';
import { motion } from 'framer-motion';
import { useAppSelector } from '../store/hooks';
import { translations } from '../data/translations';
import { Page } from '../types';

interface HomeProps {
  navigate: (page: Extract<Page, 'packages' | 'configuration' | 'documentation'>) => void;
}

const Home: React.FC<HomeProps> = ({ navigate }) => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    },
  };

  return (
    <motion.div
      className="h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 p-4 md:p-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="w-full md:w-1/3 h-1/2 md:h-2/3">
        <BlurredCard
          onClick={() => navigate('documentation')}
          className="w-full h-full p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-6 text-center cursor-pointer hover:border-[var(--primary-color)]/50 hover:scale-105"
        >
          <AppIcon name="default" className="w-16 h-16 md:w-20 lg:w-24 h-auto text-[var(--primary-color)]" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{t('documentation')}</h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            {t('documentation_desc')}
          </p>
        </BlurredCard>
      </motion.div>
      <motion.div variants={itemVariants} className="w-full md:w-1/3 h-1/2 md:h-2/3">
        <BlurredCard
          onClick={() => navigate('configuration')}
          className="w-full h-full p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-6 text-center cursor-pointer hover:border-[var(--primary-color)]/50 hover:scale-105"
        >
          <AppIcon name="dashboard" className="w-16 h-16 md:w-20 lg:w-24 h-auto text-[var(--primary-color)]" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{t('configuration')}</h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            {t('config_desc')}
          </p>
        </BlurredCard>
      </motion.div>
      <motion.div variants={itemVariants} className="w-full md:w-1/3 h-1/2 md:h-2/3">
        <BlurredCard
          onClick={() => navigate('packages')}
          className="w-full h-full p-6 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-6 text-center cursor-pointer hover:border-[var(--primary-color)]/50 hover:scale-105"
        >
          <AppIcon name="default" className="w-16 h-16 md:w-20 lg:w-24 h-auto text-[var(--primary-color)]" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{t('packages')}</h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            {t('packages_desc')}
          </p>
        </BlurredCard>
      </motion.div>
    </motion.div>
  );
};

export default Home;