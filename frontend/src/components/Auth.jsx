import React, { useState } from 'react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError(data.msg || 'Authentication failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Check your backend terminal!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
          {isLogin ? 'Welcome back to RideWise' : 'Join the Bengaluru Aggregator'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] font-bold p-4 rounded-2xl mb-6 text-center uppercase tracking-widest">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <input
            type="text"
            placeholder="FULL NAME"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 text-xs font-bold transition-all"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        )}
        <input
          type="email"
          placeholder="EMAIL ADDRESS"
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 text-xs font-bold transition-all"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="PASSWORD"
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 text-xs font-bold transition-all"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-[0.2em] text-[10px]"
        >
          {loading ? 'Verifying...' : (isLogin ? 'Sign In' : 'Get Started')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors"
        >
          {isLogin ? "New to RideWise? Register here" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}