import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Users, Trophy, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  total_users: number;
  active_challenges: number;
  passed_challenges: number;
  failed_challenges: number;
  total_trades: number;
  pass_rate: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Demo data
      setStats({
        total_users: 125,
        active_challenges: 45,
        passed_challenges: 28,
        failed_challenges: 52,
        total_trades: 3420,
        pass_rate: 35.0,
      });
    }
  };

  const handleSavePayPal = async () => {
    if (user?.role !== 'superadmin') {
      setMessage('SuperAdmin access required');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/admin/superadmin/settings/paypal', {
        client_id: paypalClientId,
        client_secret: paypalSecret,
      });
      setMessage('PayPal credentials updated successfully');
      setPaypalClientId('');
      setPaypalSecret('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-gray-400">{t('admin.users.role', { defaultValue: 'Role' })}: {user?.role}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card">
          <Users className="text-blue-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.total_users')}</p>
        </div>

        <div className="card">
          <TrendingUp className="text-green-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats?.active_challenges || 0}</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.active_challenges')}</p>
        </div>

        <div className="card">
          <Trophy className="text-yellow-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats?.passed_challenges || 0}</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.passed_challenges')}</p>
        </div>

        <div className="card">
          <AlertTriangle className="text-red-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats?.failed_challenges || 0}</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.failed_challenges')}</p>
        </div>

        <div className="card">
          <p className="text-2xl font-bold">{stats?.total_trades || 0}</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.total_trades')}</p>
        </div>

        <div className="card">
          <p className="text-2xl font-bold text-primary-500">{stats?.pass_rate || 0}%</p>
          <p className="text-gray-400 text-sm">{t('admin.stats.pass_rate', { defaultValue: 'Pass Rate' })}</p>
        </div>
      </div>

      {/* SuperAdmin Section */}
      {user?.role === 'superadmin' && (
        <div className="card">
          <div className="flex items-center mb-6">
            <Settings className="text-primary-500 mr-3" size={24} />
            <h2 className="text-xl font-bold">{t('admin.superadmin.title')}</h2>
          </div>

          <div className="max-w-md">
            <h3 className="font-semibold mb-4">{t('admin.superadmin.paypal.title')}</h3>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('admin.superadmin.paypal.client_id')}</label>
                <input
                  type="text"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  className="input"
                  placeholder="PayPal Client ID"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('admin.superadmin.paypal.client_secret')}</label>
                <input
                  type="password"
                  value={paypalSecret}
                  onChange={(e) => setPaypalSecret(e.target.value)}
                  className="input"
                  placeholder="PayPal Client Secret"
                />
              </div>

              <button
                onClick={handleSavePayPal}
                disabled={isSaving || !paypalClientId || !paypalSecret}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-semibold rounded-lg transition"
              >
                {isSaving ? t('common.loading') : t('admin.superadmin.paypal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
