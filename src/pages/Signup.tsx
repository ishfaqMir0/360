import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Globe, DollarSign, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import logo2 from '../assets/logo2.png';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    language: 'en',
    currency: 'INR',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!acceptedTerms) {
      alert('Please accept the terms and conditions to continue.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          phone: formData.whatsapp,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.whatsapp,
        farm_name: '',
        whatsapp: formData.whatsapp,
        address: formData.address,
        language: formData.language,
        currency: formData.currency,
      });

      if (profileError) {
        setLoading(false);
        setErrorMessage(profileError.message);
        return;
      }
    }

    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <img 
            src={logo2} 
            alt="AppleKul Logo" 
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join AppleKul Suite to manage your orchard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 1234567890"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Language <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your complete address"
                required
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                required
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
              </select>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700 flex-1">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-green-600 hover:text-green-700 font-medium underline"
              >
                Terms and Conditions
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-green-600 hover:text-green-700 font-medium underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </Card>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTermsModal(false)} />
          <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms and Conditions</h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
                <p>By creating an account with AppleKul Suite, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">2. Use of Service</h3>
                <p>AppleKul Suite provides orchard management tools and services. You agree to use the service only for lawful purposes and in accordance with these terms.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">3. User Account</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">4. Data Privacy</h3>
                <p>We collect and process your personal data in accordance with our Privacy Policy. By using our service, you consent to such processing and warrant that all data provided by you is accurate.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">5. Intellectual Property</h3>
                <p>All content, features, and functionality of AppleKul Suite are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">6. Limitation of Liability</h3>
                <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">7. Contact Information</h3>
                <p>For any questions regarding these terms, please contact us at support@applekul.com</p>
              </section>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowTermsModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Signup;
