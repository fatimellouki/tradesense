import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function PayPalCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Traitement du paiement PayPal...');

  useEffect(() => {
    const capturePayment = async () => {
      const token = searchParams.get('token'); // PayPal order ID
      const planType = localStorage.getItem('pending_plan');

      if (!token) {
        setStatus('error');
        setMessage('Token PayPal manquant');
        return;
      }

      if (!planType) {
        setStatus('error');
        setMessage('Plan non trouve. Veuillez reessayer.');
        return;
      }

      try {
        const response = await api.post('/payment/capture-order', {
          order_id: token,
          payment_method: 'paypal',
          plan_type: planType,
        });

        if (response.data.success) {
          localStorage.removeItem('pending_plan');
          setStatus('success');
          setMessage('Paiement reussi! Votre challenge est active.');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Echec du paiement');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Erreur lors du traitement du paiement');
      }
    };

    capturePayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-md w-full text-center p-8">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Traitement en cours</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-500">Paiement Reussi!</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirection vers le dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-500">Echec du Paiement</h2>
            <p className="text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
            >
              Reessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
