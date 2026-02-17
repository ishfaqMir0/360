import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🍎</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Apple Farm Manager</h1>
          <p className="text-gray-600">Sign in to manage your farm</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-green-600 hover:text-green-700 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;