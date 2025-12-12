
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SciFiCard from './ui/SciFiCard';
import TechButton from './ui/TechButton';
import StarryBackground from './ui/StarryBackground';

const levels = [
    {
        id: 'mangalyaan',
        name: 'MANGALYAAN',
        locked: false,
        type: 'orbiter',
        visual: 'bg-[radial-gradient(circle_at_30%_30%,_#ef4444,_#7f1d1d)]', // Mars
        shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.6)]',
        texture: 'https://www.transparenttextures.com/patterns/stardust.png'
    },
    {
        id: 'chandrayaan',
        name: 'CHANDRAYAAN-3',
        locked: true,
        type: 'lander',
        visual: 'bg-[radial-gradient(circle_at_30%_30%,_#e5e7eb,_#4b5563)]', // Moon
        shadow: 'shadow-[0_0_40px_rgba(255,255,255,0.4)]',
        texture: 'https://www.transparenttextures.com/patterns/asfalt-dark.png'
    },
    {
        id: 'adityal1',
        name: 'ADITYA-L1',
        locked: true,
        type: 'solar',
        visual: 'bg-[radial-gradient(circle_at_center,_#fcd34d,_#b45309,_#7c2d12)] animate-pulse-slow', // Sun
        shadow: 'shadow-[0_0_60px_rgba(251,191,36,0.7)]',
        texture: 'https://www.transparenttextures.com/patterns/arches.png'
    },
    {
        id: 'gaganyaan',
        name: 'GAGANYAAN',
        locked: true,
        type: 'human',
        visual: 'bg-[radial-gradient(circle_at_30%_30%,_#3b82f6,_#1e3a8a)]', // Earth
        shadow: 'shadow-[0_0_50px_rgba(59,130,246,0.6)]',
        texture: 'https://www.transparenttextures.com/patterns/broken-noise.png'
    },
];

const MapNode = ({ level, onClick, delay }) => {
    return (
        <motion.div
            className="transform z-20"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{
                scale: 1,
                opacity: 1,
                y: 0,
            }}
            transition={{ delay: delay, type: "spring", stiffness: 100 }}
        >
            <motion.button
                onClick={() => onClick(level)}
                disabled={level.locked}
                className="relative flex flex-col items-center focus:outline-none"
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay * 2 // Stagger the floating animation
                }}
                whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                whileTap={{ scale: 0.95 }}
            >
                {/* PIXEL CARD CONTAINER - Larger & Glowier */}
                <div className={`
                    w-64 h-80 bg-slate-900/90 border-4 relative overflow-hidden flex flex-col items-center justify-start pt-6 gap-6 p-4
                    ${level.locked
                        ? 'border-gray-700 opacity-70 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                        : 'border-neonBlue box-glow-hover shadow-[0_0_40px_rgba(0,240,255,0.3)]'
                    }
                    transition-all duration-300
                `}>
                    {/* Corner Accents (Pixel Aesthetic) */}
                    <div className="absolute top-0 left-0 w-3 h-3 bg-white"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-white"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 bg-white"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-white"></div>

                    {/* Lock Overlay */}
                    {level.locked && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <div className="bg-black p-4 border-4 border-gray-600 shadow-2xl">
                                <span className="text-3xl opacity-80">🔒</span>
                            </div>
                        </div>
                    )}

                    {/* Planet Inside Card - Larger */}
                    <div
                        className={`w-36 h-36 rounded-full relative overflow-hidden border-4 shrink-0 shadow-2xl
                        ${level.locked
                                ? 'grayscale brightness-50 border-gray-600'
                                : `border-white/20 ${level.shadow}`
                            } ${level.visual}`}
                    >
                        <div className="absolute inset-0 rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.8),inset_5px_5px_10px_rgba(255,255,255,0.2)]"></div>
                        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${level.texture})` }}></div>
                    </div>

                    {/* Card Content - Better Typography */}
                    <div className="w-full text-center space-y-4 mt-auto pb-6 relative z-10">
                        <div className={`mx-auto px-3 py-2 text-[10px] md:text-xs font-pixel tracking-widest uppercase border-y-2 bg-black/80 backdrop-blur-md shadow-lg ${level.locked ? 'border-gray-700 text-gray-500' : 'border-neonBlue text-neonBlue'}`}>
                            {level.name}
                        </div>

                        {!level.locked && (
                            <div className="flex justify-center space-x-2 text-[10px] text-yellow-400">
                                <span className="drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">⭐</span>
                                <span className="drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">⭐</span>
                                <span className="opacity-30 text-white">☆</span>
                            </div>
                        )}

                        <div className="text-[9px] font-pixel text-slate-400 uppercase tracking-[0.2em]">
                            {level.type} CLASS
                        </div>
                    </div>
                </div>
            </motion.button>
        </motion.div>
    );
};

const MissionBriefing = ({ mission, onClose, onStart }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
            <SciFiCard className="w-full max-w-2xl border-white/20" glowing title={`MISSION: ${mission.name}`}>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Planet Preview */}
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 border-4 border-white/10 shadow-2xl relative overflow-hidden ${mission.visual}`}>
                            <div className="absolute inset-0 rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.8)]"></div>
                            <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${mission.texture})` }}></div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs text-neonBlue font-mono tracking-widest">MISSION PROFILE</span>
                                <span className="text-sm font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded">{mission.type} CLASS</span>
                            </div>
                            <p className="text-gray-300 font-mono text-sm leading-relaxed">
                                COMMANDER, the <span className="text-white font-bold">{mission.name}</span> mission is ready for launch sequence.
                                <br /><br />
                                <span className="text-techGreen font-bold">OBJECTIVE:</span> Establish orbit and deploy payload.
                                <br />
                                <span className="text-techOrange font-bold">CONSTRAINTS:</span> Manage fuel levels and orbital trajectory.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                        <TechButton variant="neutral" onClick={onClose}>Abort</TechButton>
                        <TechButton variant="primary" onClick={onStart}>INITIATE MISSION</TechButton>
                    </div>
                </div>
            </SciFiCard>
        </motion.div>
    );
};

const ProfileModal = ({ user, profile, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-sm bg-[#0a0a16] border border-white/20 rounded-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,240,255,0.3)]"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                {/* Header Banner */}
                <div className="h-24 bg-gradient-to-r from-neonBlue to-purple-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                {/* Avatar */}
                <div className="relative -mt-10 mb-4 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-black border-4 border-[#0a0a16] flex items-center justify-center relative z-10">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-techGreen to-emerald-600 flex items-center justify-center text-3xl font-black text-black">
                            {profile?.nickname ? profile.nickname[0].toUpperCase() : user?.displayName ? user.displayName[0].toUpperCase() : '?'}
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 text-center">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1">{profile?.nickname || user?.displayName}</h2>
                    <p className="text-neonBlue text-xs font-mono tracking-[0.2em] uppercase mb-4">LEVEL 01 ACCESS</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 rounded p-3 border border-white/10">
                            <p className="text-gray-500 text-[10px] uppercase font-bold text-left mb-1">Expertise</p>
                            <p className="text-white text-sm font-mono text-left uppercase">{profile?.expertise || 'UNKNOWN'}</p>
                        </div>
                        <div className="bg-white/5 rounded p-3 border border-white/10">
                            <p className="text-gray-500 text-[10px] uppercase font-bold text-left mb-1">Age</p>
                            <p className="text-white text-sm font-mono text-left">{profile?.age || 'N/A'} YRS</p>
                        </div>
                    </div>

                    <div className="text-left text-xs text-gray-400 font-mono space-y-2 mb-6">
                        <p className="flex justify-between">
                            <span>MEMBERSHIP ID:</span>
                            <span className="text-white font-bold">#{user?.uid.slice(0, 8).toUpperCase()}</span>
                        </p>
                        <p className="flex justify-between">
                            <span>STATUS:</span>
                            <span className="text-techGreen font-bold">ACTIVE</span>
                        </p>
                        <p className="flex justify-between">
                            <span>JOINED:</span>
                            <span className="text-white">{profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Today'}</span>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-bold uppercase text-xs tracking-widest transition-colors"
                    >
                        Close Profile
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

const MissionSelection = ({ onBack, onMissionStart }) => {
    const { currentUser, userProfile, logout } = useAuth();
    const [selectedMission, setSelectedMission] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Check for auto-show profile from navigation state
    React.useEffect(() => {
        if (location.state?.showProfile) {
            setShowProfile(true);
            // Clear state so it doesn't reopen on refresh (optional, but good practice)
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleMissionStart = () => {
        if (onMissionStart) {
            onMissionStart(selectedMission);
        }
    };

    const handleLogout = async () => {
        try {
            // Navigate to home immediately to avoid ProtectedRoute redirecting to /register
            navigate('/', { replace: true });
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="relative min-h-screen text-white overflow-hidden flex flex-col font-sans">
            <StarryBackground />

            {/* Inject Pixel Font */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .font-pixel { font-family: 'Press Start 2P', cursive; }
            `}</style>

            {/* Header - Made fully transparent without borders */}
            <div className="relative z-30 px-8 py-8 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowProfile(true)}
                        className="flex items-center gap-4 bg-slate-900/80 px-6 py-4 rounded-xl border-2 border-white/20 backdrop-blur-md hover:bg-slate-800/90 hover:border-neonBlue transition-all group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-neonBlue to-purple-600 flex items-center justify-center text-lg font-pixel font-bold border-2 border-white/20 group-hover:scale-110 transition-transform shadow-lg">
                            {userProfile?.nickname ? userProfile.nickname[0].toUpperCase() : currentUser?.displayName ? currentUser.displayName[0] : 'C'}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-pixel text-white leading-none tracking-widest uppercase mb-2 group-hover:text-neonBlue transition-colors">{userProfile?.nickname || currentUser?.displayName || 'COMMANDER'}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-[10px] text-gray-400 leading-none font-mono">LEVEL 01 ACCESS</p>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-10">
                    <h1 className="text-3xl md:text-4xl font-pixel tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 text-glow opacity-90 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                        MISSION MAP
                    </h1>
                </div>

                <TechButton variant="danger" onClick={handleLogout} className="ml-4 text-xs py-4 px-8 font-pixel border-2">
                    LOGOUT
                </TechButton>
            </div>

            {/* Map Area - Centered & Clean - TALLER */}
            <div className="flex-1 relative w-full h-full max-w-7xl mx-auto z-10 flex flex-col items-center justify-center p-8">

                {/* Cards Container */}
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 relative z-20">
                    {levels.map((level, index) => (
                        <div key={level.id} className="relative group">
                            {/* Horizontal Connector Line (except for last item) */}
                            {index < levels.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-12 w-12 h-1 bg-white/20 z-0"></div>
                            )}

                            <MapNode
                                level={level}
                                onClick={setSelectedMission}
                                delay={index * 0.1}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission Briefing Modal */}
            <AnimatePresence>
                {selectedMission && (
                    <MissionBriefing
                        mission={selectedMission}
                        onClose={() => setSelectedMission(null)}
                        onStart={handleMissionStart}
                    />
                )}
                {showProfile && (
                    <ProfileModal
                        user={currentUser}
                        profile={userProfile}
                        onClose={() => setShowProfile(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MissionSelection;
