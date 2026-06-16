import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // login, forgot-email, forgot-otp, forgot-password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otpCode: '',
    newPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back!");
      navigate('/');
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.message || err.response?.data?.message || err.message || "Invalid credentials.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post(`/auth/request-password-reset?email=${encodeURIComponent(formData.email)}`);
      toast.success("Password reset code sent to your email.");
      setMode('forgot-otp');
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.message || err.response?.data?.message || "Failed to send reset code.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-password-reset-otp', {
        email: formData.email,
        otpCode: formData.otpCode
      });
      toast.success("Code verified. Please set a new password.");
      setMode('forgot-password');
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.message || err.response?.data?.message || "Invalid or expired OTP code.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiClient.post('/auth/reset-password', {
        email: formData.email,
        newPassword: formData.newPassword
      });
      toast.success("Password updated successfully!");
      setMode('login');
      setFormData({ ...formData, password: '', otpCode: '', newPassword: '' });
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.subErrors?.length ? errorData.subErrors.join(', ') : (errorData?.message || err.response?.data?.message || "Failed to update password.");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-20 px-4 relative z-10 bg-gradient-to-b from-[#CBE4F9]/30 to-[#E3F2FC]/50">
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-40 left-10 w-96 h-96 bg-white/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-32 w-80 h-80 bg-white/50 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 relative z-10">
        
        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-gray-500 text-sm font-medium">Sign in to your Planit account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                    placeholder="sarah@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-email')}
                    className="text-xs font-bold text-gray-500 hover:text-black transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70 hover:shadow-lg hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : 'Sign In'} 
                {!isLoading && <ArrowRight size={18} />}
              </button>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 font-medium">
                  Don't have an account? <Link to="/signup" className="text-black font-bold hover:underline transition-all">Sign up</Link>
                </p>
              </div>
            </form>
          </>
        )}

        {/* FORGOT PASSWORD - EMAIL REQUEST */}
        {mode === 'forgot-email' && (
          <>
            <button onClick={() => setMode('login')} className="absolute top-8 left-8 text-gray-400 hover:text-black transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center mb-8 px-4">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">Reset Password</h2>
              <p className="text-gray-500 text-sm font-medium">Enter your email and we'll send you a code to reset your password.</p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                    placeholder="sarah@example.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !formData.email}
                className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70 hover:shadow-lg hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : 'Send Reset Code'} 
              </button>
            </form>
          </>
        )}

        {/* FORGOT PASSWORD - VERIFY OTP */}
        {mode === 'forgot-otp' && (
          <>
             <button onClick={() => setMode('forgot-email')} className="absolute top-8 left-8 text-gray-400 hover:text-black transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center mb-8 px-4">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">Verify Code</h2>
              <p className="text-gray-500 text-sm font-medium">Enter the 6-digit code sent to {formData.email}</p>
            </div>

            <form onSubmit={handleVerifyResetOTP} className="space-y-6">
              <div>
                <input 
                  type="text" 
                  name="otpCode"
                  value={formData.otpCode}
                  onChange={handleChange}
                  required
                  maxLength={6}
                  className="w-full text-center tracking-[0.5em] font-mono text-3xl py-5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-semibold text-gray-800 placeholder-gray-300"
                  placeholder="------"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || formData.otpCode.length !== 6}
                className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : 'Verify Code'} 
              </button>
            </form>
          </>
        )}

        {/* FORGOT PASSWORD - NEW PASSWORD */}
        {mode === 'forgot-password' && (
          <>
            <div className="text-center mb-8 px-4">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">New Password</h2>
              <p className="text-gray-500 text-sm font-medium">Secure your account with a strong new password.</p>
            </div>

            <form onSubmit={handleSetNewPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pl-11 pr-12 py-3.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || formData.newPassword.length < 8}
                className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70 hover:shadow-lg hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : 'Update Password'} 
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
