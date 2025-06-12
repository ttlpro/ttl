import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { 
  PlayIcon,
  EyeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

export default function IndexPage() {
  const { theme, changeTheme, isDarkMode } = useTheme()
  const { t } = useTranslation('common')

  return (
    <React.Fragment>
      <Head>
        <title>{t('landing.title')}</title>
      </Head>
      
      <div className={`min-h-screen bg-gradient-to-br from-tiktok-primary via-pink-500 to-purple-600 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <img 
                src="/icons/app-icon.png" 
                alt="TTL TikTok Viewer" 
                className="w-16 h-16 mr-4"
              />
              <div className="text-left">
                <h1 className="text-4xl font-bold">{t('landing.appName')}</h1>
                <p className="text-xl text-pink-100">{t('landing.subtitle')}</p>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('landing.hero.headline')}
              <br />
              <span className="text-yellow-300">{t('landing.hero.subHeadline')}</span>
            </h2>

            <p className="text-xl md:text-2xl mb-12 text-pink-100 max-w-2xl mx-auto">
              {t('landing.hero.description')}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <EyeIcon className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.features.autoViews.title')}</h3>
                <p className="text-pink-100">{t('landing.features.autoViews.description')}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.features.accountManagement.title')}</h3>
                <p className="text-pink-100">{t('landing.features.accountManagement.description')}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.features.security.title')}</h3>
                <p className="text-pink-100">{t('landing.features.security.description')}</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/home">
                <button className="flex items-center px-8 py-4 bg-white text-tiktok-primary rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-xl">
                  <PlayIcon className="w-6 h-6 mr-2" />
                  {t('landing.cta.start')}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </Link>

              <Link href="/accounts">
                <button className="flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-tiktok-primary transition-all duration-200">
                  <UserGroupIcon className="w-6 h-6 mr-2" />
                  {t('landing.cta.manageAccounts')}
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">1000+</div>
                <div className="text-pink-100">{t('landing.stats.accounts')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">24/7</div>
                <div className="text-pink-100">{t('landing.stats.uptime')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">100%</div>
                <div className="text-pink-100">{t('landing.stats.safety')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">∞</div>
                <div className="text-pink-100">{t('landing.stats.unlimited')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white/70">
          <p className="text-sm">
            {t('landing.footer')}
          </p>
        </div>
      </div>
    </React.Fragment>
  )
}
