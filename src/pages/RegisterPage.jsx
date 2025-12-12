import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StarryBackground from '../components/ui/StarryBackground';
import EmailOTPModal from '../components/ui/EmailOTPModal';

import { getAdditionalUserInfo } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';

const RegisterPage = () => {
    const { currentUser, signInWithGoogle, saveUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    // Onboarding Form State
    const [formData, setFormData] = useState({
        nickname: '',
        age: '',
        expertise: 'beginner'
    });

    const navigate = useNavigate();

    // Redirect if already logged in AND not onboarding
    useEffect(() => {
        if (currentUser && !isOnboarding) {
            // We check if we are stuck in onboarding state to avoid premature redirect
            // Ideally we'd check if profile exists here too, but for now relies on isNewUser flag logic
            // navigate('/missions', { replace: true });
        }
    }, [currentUser, isOnboarding, navigate]);

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithGoogle();
            const { isNewUser } = getAdditionalUserInfo(result);

            if (isNewUser) {
                setIsOnboarding(true);
            } else {
                navigate('/missions', { replace: true });
            }

        } catch (err) {
            console.error(err);
            if (err.code === "auth/popup-closed-by-user") {
                setError("Authentication cancelled.");
            } else {
                setError("Access denied. Signal lost.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!currentUser) throw new Error("No user found");

            await saveUserProfile(currentUser.uid, {
                nickname: formData.nickname,
                age: formData.age,
                expertise: formData.expertise,
                joinedAt: new Date().toISOString()
            });

            navigate('/missions', { state: { showProfile: true }, replace: true });
        } catch (err) {
            console.error(err);
            setError("Failed to save credentials.");
        } finally {
            setLoading(false);
        }
    };



    const handleEmailOTPSuccess = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const { email, mode } = data;
            console.log(`✅ OTP verified for ${mode}:`, email);

            if (mode === 'signup') {
                // SIGN UP: Create new account
                const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!@#';

                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, randomPassword);
                    console.log('✅ New Firebase user created:', userCredential.user.uid);

                    // Store the password hash in Firestore for future sign-ins
                    const { doc, setDoc } = await import('firebase/firestore');
                    await setDoc(doc(db, 'emailAuth', email), {
                        passwordHash: btoa(randomPassword),
                        createdAt: new Date().toISOString()
                    });

                    setIsOnboarding(true);
                    setShowEmailModal(false);
                } catch (createError) {
                    if (createError.code === 'auth/email-already-in-use') {
                        setError('This email is already registered. Please use Sign In instead.');
                    } else {
                        throw createError;
                    }
                }
            } else {
                // SIGN IN: Get password from Firestore
                const { doc, getDoc } = await import('firebase/firestore');
                const docSnap = await getDoc(doc(db, 'emailAuth', email));

                if (docSnap.exists()) {
                    const storedPassword = atob(docSnap.data().passwordHash);
                    const userCredential = await signInWithEmailAndPassword(auth, email, storedPassword);
                    console.log('✅ User signed in:', userCredential.user.uid);
                    navigate('/missions', { replace: true });
                    setShowEmailModal(false);
                } else {
                    setError('Account not found. Please Sign Up first.');
                }
            }
        } catch (err) {
            console.error('❌ Email auth error:', err);
            setError(err.message || 'Failed to authenticate. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="relative min-h-screen text-white flex items-center justify-center overflow-hidden font-sans">
            <StarryBackground />

            {/* Scale Transition Wrapper */}
            <motion.div
                key={isOnboarding ? "onboarding" : "login"}
                className="relative z-10 w-full max-w-md mx-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="p-[2px] bg-gradient-to-br from-neonBlue to-purple-600 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                    <div className="bg-[#0a0a16] backdrop-blur-xl rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

                        {!isOnboarding ? (
                            <>
                                <h2 className="text-3xl font-black mb-2 text-white tracking-tighter uppercase">Mission Access</h2>
                                <p className="text-neonBlue mb-8 text-xs font-mono tracking-[0.3em] uppercase">Identify Yourself</p>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded mb-6 font-mono">
                                        ⚠ {error}
                                    </div>
                                )}

                                <div className="space-y-4 text-left text-xs text-gray-400 font-mono mb-6 bg-white/5 p-4 rounded border border-white/10">
                                    <p>✓ Access to detailed flight sims</p>
                                    <p>✓ Track your mission progress</p>
                                    <p>✓ Join global leaderboards</p>
                                </div>

                                <button
                                    onClick={handleGoogleAuth}
                                    disabled={loading}
                                    className="w-full py-4 bg-white text-spaceDark font-bold rounded-none clip-corner-br flex items-center justify-center space-x-3 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <span className="w-4 h-4 border-2 border-spaceDark border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            <span>Sign Up / Sign In</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-[1px] bg-white/10"></div>
                                    <span className="text-slate-500 text-xs font-mono">OR</span>
                                    <div className="flex-1 h-[1px] bg-white/10"></div>
                                </div>

                                <button
                                    onClick={() => setShowEmailModal(true)}
                                    disabled={loading}
                                    className="w-full py-4 bg-neonBlue text-white font-bold rounded-none clip-corner-br flex items-center justify-center space-x-3 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Sign In with Email</span>
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleOnboardingSubmit} className="space-y-6 text-left">
                                <div className="text-center">
                                    <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Cadet Profile</h2>
                                    <p className="text-gray-400 text-[10px] font-mono uppercase">Enter your credentials</p>
                                </div>

                                <div>
                                    <label className="block text-techGreen text-xs font-bold mb-2 uppercase tracking-wider">Call Sign (Nickname)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-neonBlue transition-colors font-mono"
                                        placeholder="e.g. SKYWALKER"
                                        value={formData.nickname}
                                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-techGreen text-xs font-bold mb-2 uppercase tracking-wider">Age</label>
                                        <input
                                            type="number"
                                            required
                                            min="10"
                                            max="100"
                                            className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-neonBlue transition-colors font-mono"
                                            placeholder="Yrs"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-2">
                                        {/* Spacer or extra field */}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-techGreen text-xs font-bold mb-2 uppercase tracking-wider">Expertise Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['beginner', 'enthusiast', 'pro'].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, expertise: level })}
                                                className={`py-2 text-[10px] uppercase font-bold border ${formData.expertise === level ? 'bg-neonBlue/20 border-neonBlue text-neonBlue' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-4 bg-techGreen text-black font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Complete Registration'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Email OTP Modal */}
            <EmailOTPModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={handleEmailOTPSuccess}
            />
        </div>
    );
};

export default RegisterPage;

