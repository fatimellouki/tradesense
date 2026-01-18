import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import api from '../../services/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  plan_type: string;
  profit_percent: number;
  total_trades: number;
  win_rate: number;
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard/top-10');
      setLeaderboard(response.data.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Demo data
      setLeaderboard([
        { rank: 1, username: 'TraderPro', plan_type: 'elite', profit_percent: 15.2, total_trades: 45, win_rate: 72 },
        { rank: 2, username: 'CryptoKing', plan_type: 'pro', profit_percent: 12.8, total_trades: 38, win_rate: 68 },
        { rank: 3, username: 'MarocTrader', plan_type: 'pro', profit_percent: 11.5, total_trades: 52, win_rate: 65 },
        { rank: 4, username: 'AITrader', plan_type: 'elite', profit_percent: 10.2, total_trades: 29, win_rate: 76 },
        { rank: 5, username: 'BourseExpert', plan_type: 'starter', profit_percent: 9.8, total_trades: 61, win_rate: 62 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-blue-500/20 text-blue-400',
      pro: 'bg-purple-500/20 text-purple-400',
      elite: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[plan] || colors.starter;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('leaderboard.title')}</h1>
        <p className="text-gray-400">
          {t('leaderboard.subtitle')}
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 0, 2].map((idx) => {
          const trader = leaderboard[idx];
          if (!trader) return <div key={idx} />;

          return (
            <div
              key={trader.rank}
              className={`card text-center ${
                trader.rank === 1 ? 'md:-mt-4 border-yellow-500/50' : ''
              }`}
            >
              <div className="mb-3">{getRankIcon(trader.rank)}</div>
              <h3 className="font-bold text-lg">{trader.username}</h3>
              <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${getPlanBadge(trader.plan_type)}`}>
                {trader.plan_type.toUpperCase()}
              </span>
              <p className="text-2xl font-bold text-green-500 mt-3">
                +{trader.profit_percent.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">
                {trader.total_trades} trades | {trader.win_rate}% win
              </p>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-dark-600">
              <th className="pb-4">{t('leaderboard.rank')}</th>
              <th className="pb-4">{t('leaderboard.trader')}</th>
              <th className="pb-4">{t('leaderboard.plan')}</th>
              <th className="pb-4 text-right">{t('leaderboard.profit')}</th>
              <th className="pb-4 text-right hidden md:table-cell">{t('leaderboard.trades')}</th>
              <th className="pb-4 text-right hidden md:table-cell">{t('leaderboard.win_rate')}</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((trader) => (
              <tr key={trader.rank} className="border-b border-dark-700 last:border-0">
                <td className="py-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankIcon(trader.rank)}
                  </div>
                </td>
                <td className="py-4">
                  <span className="font-medium">{trader.username}</span>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs ${getPlanBadge(trader.plan_type)}`}>
                    {trader.plan_type.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="text-green-500 font-semibold flex items-center justify-end">
                    <TrendingUp size={16} className="mr-1" />
                    +{trader.profit_percent.toFixed(1)}%
                  </span>
                </td>
                <td className="py-4 text-right hidden md:table-cell text-gray-400">
                  {trader.total_trades}
                </td>
                <td className="py-4 text-right hidden md:table-cell text-gray-400">
                  {trader.win_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
