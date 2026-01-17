import { Link } from 'react-router-dom';
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
            La Premiere Prop Firm Assistee par IA pour l'Afrique
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-8">
            Une plateforme de trading de nouvelle generation concue pour guider les traders
            de tous niveaux, debutants ou professionnels. Combinez analyses IA en temps reel,
            outils intelligents et education premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold rounded-xl transition transform hover:scale-105"
            >
              Commencer le Challenge
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 border border-dark-600 hover:border-primary-500 text-white text-lg font-semibold rounded-xl transition"
            >
              Voir les Tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Pourquoi Choisir TradeSense AI?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour reussir dans le trading, sur une seule plateforme.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4">
                <Brain className="text-primary-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Assistance IA</h3>
              <p className="text-gray-400">
                Signaux Achat/Vente/Stop directement sur votre ecran.
                Plans de trade personnalises et alertes de risque en temps reel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="text-blue-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dashboard Temps Reel</h3>
              <p className="text-gray-400">
                Graphiques professionnels avec donnees en direct.
                Marches US, Crypto et Bourse de Casablanca integres.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-4">
                <Newspaper className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hub d'Actualites</h3>
              <p className="text-gray-400">
                Actualites financieres en temps reel, resumes de marche
                crees par l'IA et alertes d'evenements economiques.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="text-purple-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Zone Communautaire</h3>
              <p className="text-gray-400">
                Discutez avec d'autres traders, partagez des strategies
                et apprenez des experts de la communaute.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">MasterClass</h3>
              <p className="text-gray-400">
                Academie complete avec cours du debutant a l'avance,
                webinaires en direct et parcours assistes par IA.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card hover:border-primary-500/50 transition">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-green-500" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestion du Risque</h3>
              <p className="text-gray-400">
                Regles strictes de protection: perte max journaliere 5%,
                perte max totale 10%. Votre capital est protege.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Comment Ca Marche?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Trois etapes simples pour devenir un trader finance
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Choisissez un Challenge</h3>
              <p className="text-gray-400">
                Selectionnez parmi nos plans Starter, Pro ou Elite
                selon votre niveau et vos objectifs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Tradez et Apprenez</h3>
              <p className="text-gray-400">
                Utilisez notre plateforme IA pour trader sur des donnees
                reelles et atteindre l'objectif de profit de 10%.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Devenez Finance</h3>
              <p className="text-gray-400">
                Reussissez le challenge et accedez a un compte finance
                avec de vrais fonds a trader.
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
                Pourquoi les Traders Choisissent TradeSense AI
              </h2>
              <ul className="space-y-4">
                {[
                  'Une plateforme unique pour le trading, l\'apprentissage et la communaute',
                  'Signaux IA et alertes de risque en temps reel',
                  'Actus + social + MasterClass dans une seule interface',
                  'Ideal pour les debutants et les traders experimentes',
                  'Vous aide a prendre des decisions plus intelligentes, plus rapidement',
                ].map((item, index) => (
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
                <h3 className="text-2xl font-bold">Pret a Commencer?</h3>
                <p className="text-gray-400 mt-2">
                  Rejoignez des milliers de traders qui font confiance a TradeSense AI
                </p>
              </div>
              <Link
                to="/register"
                className="block w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-center text-lg font-semibold rounded-xl transition"
              >
                Creer un Compte Gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            &copy; 2025 TradeSense AI. Tous droits reserves.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            La premiere Prop Firm assistee par IA pour l'Afrique
          </p>
        </div>
      </footer>
    </div>
  );
}
