import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { UserPlus, Mail, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const { signup } = useApp();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const success = await signup(name, email);
      if (success) {
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-container),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,#1b253b,transparent_65%)] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative ambient blurred blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse duration-5000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 dark:bg-secondary/5 rounded-full blur-3xl -z-10 animate-pulse duration-3000"></div>

      <div className="w-full max-w-md bg-surface-container-lowest/80 dark:bg-surface-container-low/75 backdrop-blur-md border border-outline-variant/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-8 relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-primary/20">
            <span className="font-display">C</span>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-on-surface">
              Create your account
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              Join ChatPulse to sync workspace communication
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-error-container/50 border border-error-container text-on-error-container text-xs font-medium flex items-center gap-2 animate-shake">
            <ShieldAlert size={16} className="text-error" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-4 py-2.5 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@workspace.com"
              className="w-full px-4 py-2.5 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Lock size={12} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Lock size={12} /> Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer mt-4 group text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-x-0 border-t border-outline-variant/50"></div>
          <span className="relative px-3 bg-surface-container-lowest dark:bg-surface-container-low text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
            or transition
          </span>
        </div>

        {/* Switch Card */}
        <div className="text-center text-xs text-on-surface-variant font-medium">
          Already a ChatPulse member?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In Instead
          </Link>
        </div>

      </div>
    </div>
  );
};
