import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailOTPModal = ({ isOpen, onClose, onSuccess, mode: initialMode = 'signup' }) => {
    const [step, setStep] = useState('mode'); // 'mode', 'email', or 'otp'
    const [authMode, setAuthMode] = useState(initialMode); // 'signup' or 'signin'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // For Sign In: Check if account exists first (don't waste email)
            if (authMode === 'signin') {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../../firebase');
                const docSnap = await getDoc(doc(db, 'emailAuth', email));

                if (!docSnap.exists()) {
                    setError('No account found with this email. Please Sign Up first.');
                    setLoading(false);
                    return;
                }
            }

            const response = await fetch('http://localhost:3001/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            setStep('otp');
            setLoading(false);
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.message || 'Failed to send OTP. Check your connection.');
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            // Pass email and mode to parent
            onSuccess({ email: data.email, mode: authMode });
            setLoading(false);
            onClose();
        } catch (err) {
            setError(err.message || 'Invalid OTP');
            setLoading(false);
        }
    };

    const handleResendOTP = () => {
        setOtp('');
        setStep('email');
    };

    const selectMode = (mode) => {
        setAuthMode(mode);
        setStep('email');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border-2 border-neonBlue rounded-xl p-8 max-w-md w-full mx-4 relative shadow-[0_0_50px_rgba(59,130,246,0.3)]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                    <X size={24} />
                </button>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Mode Selection Step */}
                {step === 'mode' && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Email Authentication</h2>
                            <p className="text-slate-400 text-sm">Choose how you want to continue</p>
                        </div>

                        <button
                            onClick={() => selectMode('signup')}
                            className="w-full bg-neonBlue hover:bg-blue-600 text-white font-bold py-4 rounded transition flex items-center justify-center gap-3"
                        >
                            <UserPlus size={20} />
                            <span>Sign Up (New Account)</span>
                        </button>

                        <button
                            onClick={() => selectMode('signin')}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded transition flex items-center justify-center gap-3"
                        >
                            <LogIn size={20} />
                            <span>Sign In (Existing Account)</span>
                        </button>
                    </div>
                )}

                {/* Email Step */}
                {step === 'email' && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Enter your email to receive a verification code
                            </p>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="commander@isro.gov.in"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-10 py-3 text-white focus:border-neonBlue focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${authMode === 'signup' ? 'bg-neonBlue hover:bg-blue-600' : 'bg-purple-600 hover:bg-purple-500'} disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending...
                                </>
                            ) : (
                                'Send Verification Code'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('mode')}
                            className="w-full text-slate-400 hover:text-white text-sm transition"
                        >
                            ← Back to options
                        </button>
                    </form>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
                            <p className="text-slate-400 text-sm">
                                We sent a 6-digit code to {email}
                            </p>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm mb-2">Verification Code</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    required
                                    maxLength={6}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-10 py-3 text-white text-center text-2xl tracking-widest font-mono focus:border-neonBlue focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Verifying...
                                </>
                            ) : (
                                authMode === 'signup' ? 'Verify & Create Account' : 'Verify & Sign In'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="w-full text-neonBlue hover:text-blue-400 text-sm transition"
                        >
                            Didn't receive code? Send again
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default EmailOTPModal;
