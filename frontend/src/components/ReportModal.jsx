import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ReportModal({ user, onClose, darkMode }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          description: description.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.msg || 'Failed to submit report');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl ${
          darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600/20 rounded-xl">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Report Issue
                </h2>
                <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Let us know what went wrong
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Report Submitted!</h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Thank you for your feedback. We'll look into it soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-600/10 border border-red-600/40 text-red-600 text-xs font-bold p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Describe the issue or bug
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about what happened..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl text-sm border transition-colors resize-none ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-800 focus:border-blue-600 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-200 focus:border-blue-600 text-slate-900 placeholder-slate-400'
                  } outline-none`}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-wider text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
