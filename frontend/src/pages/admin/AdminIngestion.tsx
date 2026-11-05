import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Save, X, Loader2, CheckCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';

const AdminIngestion: React.FC = () => {
  const { showToast } = useShop();
  const [rawText, setRawText] = useState('');
  const [processedData, setProcessedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setProcessedData(null);
    try {
      const response = await fetch('/api/ingest/inventory/auto-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unstructured_text: rawText }),
      });
      if (!response.ok) throw new Error('AI processing failed');
      const data = await response.json();
      setProcessedData(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/ingest/inventory/confirm-ingestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      });
      if (!response.ok) throw new Error('Failed to save product');
      setIsConfirmed(true);
      showToast('Product successfully added to catalog!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="shell fade-up mx-auto max-w-4xl py-6 space-y-5 phone-lg:space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-body tracking-tight phone-lg:text-[26px] 3xl:text-3xl">AI Product Ingestion</h1>
          <p className="text-[13px] text-quiet">Convert unstructured text into validated catalog records</p>
        </div>
        <div className="shrink-0 px-3 py-1.5 phone-lg:px-4 phone-lg:py-2 bg-accent-soft text-accent rounded-full text-[11px] phone-lg:text-sm font-bold border border-hairline flex items-center gap-2">
          <Sparkles size={16} /> AI-Powered
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 phone-lg:gap-8 md:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-body font-bold">
            <div className="w-1.5 h-5 bg-solid rounded-full"></div>
            Raw Product Data
          </div>
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste product description, manufacturer specs, or a rough note... e.g. 'Nike Air Max, Blue, $120, running shoes, highly breathable mesh'"
              className="w-full h-64 bg-panel border border-hairline rounded-[20px] p-4 text-sm text-body focus:ring-2 focus:ring-accent outline-none transition-all shadow-quiet"
            />
            <button
              onClick={handleProcess}
              disabled={isLoading || !rawText.trim()}
              className="absolute bottom-4 right-4 px-6 py-2 bg-solid text-on-solid rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-quiet"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Process with AI
            </button>
          </div>
        </div>

        {/* Review Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-body font-bold">
            <div className="w-1.5 h-5 bg-solid rounded-full"></div>
            AI-Generated Metadata
          </div>

          {!processedData && !isLoading && (
            <div className="h-64 border-2 border-dashed border-hairline rounded-[20px] flex flex-col items-center justify-center text-quiet text-sm p-8 text-center">
              <Sparkles size={32} className="mb-2 opacity-20" />
              <p>Processed data will appear here for your review</p>
            </div>
          )}

          {isLoading && (
            <div className="h-64 bg-panel border border-hairline rounded-[20px] flex flex-col items-center justify-center text-quiet text-sm animate-pulse">
              <Loader2 size={32} className="animate-spin mb-2 text-accent" />
              <p>Analyzing text & generating schema...</p>
            </div>
          )}

          {processedData && !isConfirmed && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-panel border border-hairline rounded-[20px] p-6 space-y-4 shadow-quiet"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-quiet font-bold">Title</label>
                  <input
                    value={processedData.title}
                    onChange={(e) => setProcessedData({...processedData, title: e.target.value})}
                    className="w-full bg-transparent border-b border-hairline py-1 text-sm font-semibold text-body outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-quiet font-bold">Category</label>
                  <input
                    value={processedData.category}
                    onChange={(e) => setProcessedData({...processedData, category: e.target.value})}
                    className="w-full bg-transparent border-b border-hairline py-1 text-sm text-body outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-quiet font-bold">Price ($)</label>
                    <input
                      type="number"
                      value={processedData.suggested_price}
                      onChange={(e) => setProcessedData({...processedData, suggested_price: parseFloat(e.target.value)})}
                      className="w-full bg-transparent border-b border-hairline py-1 text-sm text-body outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-quiet font-bold">SEO Description</label>
                    <input
                      value={processedData.seo_description}
                      onChange={(e) => setProcessedData({...processedData, seo_description: e.target.value})}
                      className="w-full bg-transparent border-b border-hairline py-1 text-sm text-body outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  onClick={() => setProcessedData(null)}
                  className="p-2 text-quiet hover:text-body transition-colors"
                  title="Discard"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="px-6 py-2 bg-solid text-on-solid rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          )}

          {isConfirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-64 bg-accent-soft border border-hairline rounded-[20px] flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-16 h-16 bg-solid text-on-solid rounded-full flex items-center justify-center mb-4 shadow-quiet">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-body">Product Ingested!</h3>
              <p className="text-sm text-quiet mt-2">The AI-generated product has been added to your catalog.</p>
              <button
                onClick={() => {setIsConfirmed(false); setProcessedData(null); setRawText('');}}
                className="mt-6 px-6 py-2 bg-recess text-body border border-hairline rounded-full text-sm font-bold hover:bg-panel transition-all"
              >
                Process Another
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminIngestion;
