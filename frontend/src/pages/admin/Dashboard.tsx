import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, ShoppingCart, AlertCircle, BarChart3, Activity, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/logs')
        ]);
        setStats(await statsRes.json());
        setLogs(await logsRes.json());
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-6 text-center text-quiet">Loading Analytics...</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 150, damping: 15 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="shell fade-up py-6 space-y-5 phone-lg:space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold text-body tracking-tight phone-lg:text-[26px] 3xl:text-3xl">Business Intelligence</h1>
        <div className="shrink-0 px-3 py-1.5 phone-lg:px-4 phone-lg:py-2 bg-accent-soft text-accent rounded-full text-[11px] phone-lg:text-sm font-bold border border-hairline">
          Global Analytics
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-4 auto-rows-[minmax(11rem,auto)] phone-lg:gap-6 md:grid-cols-4 md:auto-rows-[160px] lg:grid-cols-6">

        {/* Total Queries - Medium Card */}
        <motion.div
          variants={cardVariants}
          className="md:col-span-2 lg:col-span-2 card-premium p-6 flex flex-col justify-between border-hairline"
        >
          <div className="flex items-center gap-3 text-quiet">
            <div className="p-2 rounded-lg bg-accent-soft text-accent">
              <MessageSquare size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Total AI Queries</span>
          </div>
          <div className="text-5xl font-semibold text-body mt-4 tracking-tighter">
            {stats?.stats?.total_queries || 0}
          </div>
        </motion.div>

        {/* AI Conversions - Small Card */}
        <motion.div
          variants={cardVariants}
          className="md:col-span-1 lg:col-span-2 card-premium p-6 flex flex-col justify-between border-hairline"
        >
          <div className="flex items-center gap-3 text-quiet">
            <div className="p-2 rounded-lg bg-solid/10 text-body">
              <ShoppingCart size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Conversions</span>
          </div>
          <div className="text-5xl font-semibold text-body mt-4 tracking-tighter">
            {stats?.stats?.ai_conversions || 0}
          </div>
        </motion.div>

        {/* Conversion Rate - Small Card */}
        <motion.div
          variants={cardVariants}
          className="md:col-span-1 lg:col-span-2 card-premium p-6 flex flex-col justify-between border-hairline"
        >
          <div className="flex items-center gap-3 text-quiet">
            <div className="p-2 rounded-lg bg-accent-soft text-accent">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">CR Rate</span>
          </div>
          <div className="text-5xl font-semibold text-accent mt-4 tracking-tighter">
            {stats?.stats?.conversion_rate?.toFixed(2) || 0}%
          </div>
        </motion.div>

        {/* Most Recommended - Large Vertical Card */}
        <motion.div
          variants={cardVariants}
          className="md:col-span-2 lg:col-span-3 row-span-2 card-premium p-6 border-hairline flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-soft text-accent">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold text-body">Most Recommended</h2>
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-hide">
            {stats?.top_recommendations?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-recess rounded-2xl border border-hairline hover:border-accent transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-accent/40 w-4">{idx + 1}</span>
                  <span className="text-body text-sm font-bold">Product #{item.product_id}</span>
                </div>
                <span className="px-3 py-1 bg-solid text-on-solid rounded-full text-xs font-semibold">
                  {item.count} hits
                </span>
              </div>
            ))}
            {(!stats?.top_recommendations || stats.top_recommendations.length === 0) && (
              <div className="text-quiet text-sm text-center py-12">No recommendation data available yet.</div>
            )}
          </div>
        </motion.div>

        {/* Recent Queries - Wide Card */}
        <motion.div
          variants={cardVariants}
          className="md:col-span-2 lg:col-span-3 row-span-2 card-premium p-6 border-hairline flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-soft text-accent">
              <Activity size={20} />
            </div>
            <h2 className="text-xl font-bold text-body">Live Query Stream</h2>
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-hide">
            {logs.map((log, idx) => (
              <div key={idx} className="p-4 bg-recess rounded-2xl border border-hairline text-sm hover:bg-panel transition-colors">
                <div className="text-body font-bold mb-1 flex items-center gap-2">
                  <Users size={14} className="text-accent" />
                  "{log.query}"
                </div>
                <div className="text-quiet text-xs italic pl-6 border-l-2 border-hairline">
                  AI: {log.response.substring(0, 120)}...
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-quiet text-sm text-center py-12">No query logs available.</div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default AdminDashboard;
