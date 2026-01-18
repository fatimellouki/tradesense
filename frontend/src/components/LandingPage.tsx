import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Newspaper,
  Users,
  GraduationCap,
  Shield,
  Zap,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-dark-950" />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">TradeSense</span>{' '}
            <span className="text-primary-500">AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-4">
            {t('landing.hero.subtitle')}
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-8">
            {t('landing.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold rounded-xl transition transform hover:scale-105"
            >
              {t('landing.hero.cta_start')}
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 border border-dark-600 hover:border-primary-500 text-white text-lg font-semibold rounded-xl transition"
            >
              {t('landing.hero.cta_pricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4">
                <Brain className="text-primary-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.ai_assistance.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.ai_assistance.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="text-blue-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.realtime_dashboard.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.realtime_dashboard.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-4">
                <Newspaper className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.news_hub.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.news_hub.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="text-purple-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.community.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.community.description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.masterclass.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.masterclass.description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-green-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.risk_management.title')}</h3>
              <p className="text-gray-400">
                {t('landing.features.risk_management.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('landing.how_it_works.title')}
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            {t('landing.how_it_works.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.how_it_works.step1.title')}</h3>
              <p className="text-gray-400">
                {t('landing.how_it_works.step1.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.how_it_works.step2.title')}</h3>
              <p className="text-gray-400">
                {t('landing.how_it_works.step2.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.how_it_works.step3.title')}</h3>
              <p className="text-gray-400">
                {t('landing.how_it_works.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('landing.why_choose.title')}
              </h2>
              <ul className="space-y-4">
                {(t('landing.why_choose.reasons', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <div className="text-center mb-6">
                <Zap className="text-primary-500 mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-bold">{t('landing.why_choose.cta_title')}</h3>
                <p className="text-gray-400 mt-2">
                  {t('landing.why_choose.cta_subtitle')}
                </p>
              </div>
              <Link
                to="/register"
                className="block w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-center text-lg font-semibold rounded-xl transition"
              >
                {t('landing.why_choose.cta_button')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            &copy; 2025 {t('footer.copyright')}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            {t('footer.tagline')}
          </p>
        </div>
      </footer>
    </div>
  );
}
