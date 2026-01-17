import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Check, Loader2 } from 'lucide-react';
import api from '../../services/api';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 200,
    balance: 5000,
    features: [
      'Solde initial de 5 000 $',
      'Perte max journaliere: 5%',
      'Perte max totale: 10%',
      'Objectif de profit: 10%',
      'Support par email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    balance: 10000,
    popular: true,
    features: [
      'Solde initial de 10 000 $',
      'Perte max journaliere: 5%',
      'Perte max totale: 10%',
      'Objectif de profit: 10%',
      'Support prioritaire',
      'Signaux IA premium',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 1000,
    balance: 25000,
    features: [
      'Solde initial de 25 000 $',
      'Perte max journaliere: 5%',
      'Perte max totale: 10%',
      'Objectif de profit: 10%',
      'Support VIP 24/7',
      'Signaux IA premium',
      'Acces MasterClass complet',
    ],
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mock' | 'paypal'>('mock');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedPlan) return;

    setIsProcessing(true);

    try {
      // Create order
      const orderResponse = await api.post('/payment/create-order', {
        plan_type: selectedPlan,
        payment_method: paymentMethod,
      });

      const orderData = orderResponse.data.data;

      if (paymentMethod === 'paypal' && orderData.approval_url) {
        // Store plan_type for callback
        localStorage.setItem('pending_plan', selectedPlan);
        // Redirect to PayPal for approval
        window.location.href = orderData.approval_url;
        return;
      }

      // For mock/CMI payment - capture immediately
      const captureResponse = await api.post('/payment/capture-order', {
        order_id: orderData.order_id,
        payment_method: paymentMethod,
        plan_type: selectedPlan,
      });

      if (captureResponse.data.success) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choisissez Votre Challenge</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Selectionnez le plan qui correspond a votre niveau et commencez
          votre parcours vers le financement.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card relative cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'hover:border-dark-500'
            } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                  Populaire
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="text-4xl font-bold text-primary-500">
                {plan.price} <span className="text-lg text-gray-400">DH</span>
              </div>
              <p className="text-gray-400 mt-2">
                Solde de trading: ${plan.balance.toLocaleString()}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="text-primary-500 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition ${
                selectedPlan === plan.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              {selectedPlan === plan.id ? 'Selectionne' : 'Selectionner'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Section */}
      {selectedPlan && (
        <div className="max-w-md mx-auto">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Methode de Paiement</h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('mock')}
                className={`w-full p-4 rounded-lg border transition flex items-center justify-between ${
                  paymentMethod === 'mock'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                <span>CMI / Carte Bancaire (Demo)</span>
                {paymentMethod === 'mock' && <Check className="text-primary-500" size={20} />}
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full p-4 rounded-lg border transition flex items-center justify-between ${
                  paymentMethod === 'paypal'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                <span>PayPal</span>
                {paymentMethod === 'paypal' && <Check className="text-primary-500" size={20} />}
              </button>
            </div>

            <button
              onClick={() => isAuthenticated ? handlePurchase() : navigate('/login')}
              disabled={isProcessing}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-semibold rounded-lg transition flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Traitement...
                </>
              ) : isAuthenticated ? (
                `Payer ${plans.find(p => p.id === selectedPlan)?.price} DH`
              ) : (
                'Connectez-vous pour continuer'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
