import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../lib/apiClient';
import FluidLoader from './FluidLoader';
import OtpInput from 'react-otp-input';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otpCode: ''
  });

  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (otpCode) => {
    setFormData({ ...formData, otpCode });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      toast.success("Account created! Check your email for the verification code.");
      setStep(2);
      setTimer(60);
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.subErrors?.length ? errorData.subErrors.join(', ') : (errorData?.message || err.response?.data?.message || err.message || "Failed to sign up.");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-email-otp', {
        email: formData.email,
        otpCode: formData.otpCode
      });
      toast.success("Email verified successfully!");
      navigate('/signin');
    } catch (err) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.message || err.response?.data?.message || "Invalid OTP code.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    toast.info("Resending code...");
    setTimer(60);
  };

  return (
    <div className="w-full flex items-center justify-center py-10 px-4 relative z-10">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 relative z-10">
        
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {step === 1 ? "Join Planit" : "Verify Email"}
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            {step === 1 
              ? "Create your account and start planning flawless events." 
              : `We sent a 6-digit code to ${formData.email}`
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                  placeholder="Sarah Jenkins"
                />
              </div>
            </div>

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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
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
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                  title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
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
              <p className="text-xs text-gray-400 mt-2 ml-1 font-medium">Must be at least 8 characters long.</p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70 hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoading ? <FluidLoader /> : 'Continue'} 
              {!isLoading && <ArrowRight size={18} />}
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 font-medium">
                Already have an account? <Link to="/signin" className="text-black font-bold hover:underline transition-all">Sign in</Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6 flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">Verification Code</label>
              <OtpInput
                value={formData.otpCode}
                onChange={handleOtpChange}
                numInputs={6}
                renderSeparator={<span className="w-2 md:w-3"></span>}
                renderInput={(props) => <input {...props} />}
                inputStyle={{
                  width: "3rem",
                  height: "3.5rem",
                  margin: "0",
                  fontSize: "1.5rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #E5E7EB",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  outline: "none",
                  fontWeight: "600",
                  color: "#1F2937",
                }}
                containerStyle="justify-center"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || formData.otpCode.length !== 6}
              className="w-full bg-[#111111] hover:bg-black text-white font-medium py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoading ? <FluidLoader /> : 'Verify Email'} 
              {!isLoading && <CheckCircle2 size={18} />}
            </button>

            <div className="text-center mt-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-500 font-semibold">
                  Resend code in <span className="text-black">{timer}s</span>
                </p>
              ) : (
                <button 
                  type="button"
                  onClick={handleResend}
                  className="text-sm text-gray-500 font-semibold hover:text-black transition-colors"
                >
                  Didn't receive a code? Resend
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
