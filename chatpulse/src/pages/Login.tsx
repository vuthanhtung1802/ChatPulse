import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex.rivera@chatpulse.io');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      const email = `${provider.toLowerCase()}@chatpulse.io`;
      const name = `${provider} User`;
      const success = await login(email, 'password123');
      if (!success) {
        await signup(name, email, 'password123');
      }
      navigate('/');
    } catch (err) {
      setError('Social authentication failed.');
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
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-primary/20">
            <span className="font-display">C</span>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-on-surface">
              Welcome to ChatPulse
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              Secure communication, elegant social connectivity
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-error-container/50 border border-error-container text-on-error-container text-xs font-medium flex items-center gap-2 animate-shake">
            <ShieldCheck size={16} className="text-error" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@workspace.com"
              className="w-full px-4 py-3 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                <Lock size={12} /> Account Password
              </label>
              <a href="#" className="text-[10px] text-primary hover:underline font-semibold">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-container-low dark:bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer mt-6 group text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-7 flex items-center justify-center">
          <div className="absolute inset-x-0 border-t border-outline-variant/50"></div>
          <span className="relative px-3 bg-surface-container-lowest dark:bg-surface-container-low text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
            or connect with
          </span>
        </div>

        {/* Social Authentication Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="py-2.5 px-4 rounded-xl border border-outline-variant/60 bg-surface-container-low dark:bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>
          <button
            onClick={() => handleSocialLogin('GitHub')}
            className="py-2.5 px-4 rounded-xl border border-outline-variant/60 bg-surface-container-low dark:bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Switch Card */}
        <div className="text-center text-xs text-on-surface-variant font-medium">
          New to the hub?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};
