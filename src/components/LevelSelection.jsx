import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import StarryBackground from './ui/StarryBackground';
import TechButton from './ui/TechButton';
import { Lock, Star, ChevronRight, ArrowLeft } from 'lucide-react';

const LEVELS = [
    {
        id: 1,
        name: 'ASSEMBLY',
        description: 'Build and configure the Mars Orbiter Mission rocket',
        difficulty: 'BEGINNER',
        icon: '🔧'
    },
    {
        id: 2,
        name: 'ASCENT',
        description: 'Control the ascent phase and manage stage separations',
        difficulty: 'INTERMEDIATE',
        icon: '🚀'
    },
    {
        id: 3,
        name: 'INJECTION',
        description: 'Execute precise orbital maneuvers to reach Mars orbit',
        difficulty: 'ADVANCED',
        icon: '🛰️'
    },
    {
        id: 4,
        name: 'ORBIT RAISER',
        description: 'Raise orbit through strategic perigee burns for TMI',
        difficulty: 'EXPERT',
        icon: '🌌'
    },
    {
        id: 5,
        name: 'TRANS-MARS INJECTION',
        description: 'Execute the critical burn to escape Earth and head to Mars',
        difficulty: 'EXPERT',
        icon: '🔥'
    },
    {
        id: 6,
        name: 'MARS TRANSFER',
        description: 'Navigate deep space cruise and manage spacecraft systems',
        difficulty: 'MASTER',
        icon: '🪐'
    }
];

const LevelCard = ({ level, isUnlocked, isCompleted, onClick }) => {
    return (
        <motion.button
            onClick={isUnlocked ? onClick : undefined}
            disabled={!isUnlocked}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: level.id * 0.1 }}
            className={`
                relative w-full aspect-[4/3] border-4 p-6 flex flex-col items-center justify-center
                transition-all duration-300
                ${isUnlocked
                    ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-neonBlue hover:border-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer backdrop-blur-sm'
                    : 'bg-slate-900/50 border-slate-700 cursor-not-allowed backdrop-blur-sm grayscale'
                }
            `}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

            {/* Lock Overlay */}
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                    <Lock size={48} className="text-slate-600" />
                </div>
            )}

            {/* Completed Badge */}
            {isCompleted && (
                <div className="absolute top-4 right-4 bg-green-600 px-3 py-1 border-2 border-green-400 z-10">
                    <span className="text-xs font-pixel text-white flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> DONE
                    </span>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="text-6xl opacity-80">{level.icon}</div>
                <div className="text-center">
                    <h3 className="text-2xl font-black tracking-widest text-white mb-2">
                        LEVEL {level.id}
                    </h3>
                    <p className="text-neonBlue text-sm font-pixel mb-2">{level.name}</p>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-xs">
                        {level.description}
                    </p>
                </div>
                <div className={`
                    text-[10px] font-pixel px-3 py-1 border-2
                    ${isUnlocked
                        ? 'bg-blue-900/50 border-blue-500 text-blue-300'
                        : 'bg-slate-800/50 border-slate-600 text-slate-500'
                    }
                `}>
                    {level.difficulty}
                </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-current opacity-50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-current opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-current opacity-50"></div>
        </motion.button>
    );
};

export default function LevelSelection({ mission, onBack, onSelectLevel }) {
    const { getLevelProgress } = useAuth();
    const [unlockedLevels, setUnlockedLevels] = useState([1]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProgress() {
            const progress = await getLevelProgress(mission.id);
            setUnlockedLevels(progress?.unlockedLevels || [1]);
            setLoading(false);
        }
        fetchProgress();
    }, [mission.id, getLevelProgress]);

    if (loading) {
        return (
            <div className="min-h-screen bg-spaceDark text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-neonBlue font-pixel animate-pulse">Loading Levels...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-white overflow-hidden flex flex-col font-sans">
            <StarryBackground />

            {/* Header */}
            <div className="relative z-30 px-8 py-6 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm transition-colors"
                    >
                        <ArrowLeft className="text-white" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-neonBlue to-white text-glow">
                            {mission.name}
                        </h1>
                        <p className="text-xs text-slate-400 font-mono mt-1">SELECT MISSION LEVEL</p>
                    </div>
                </div>
            </div>

            {/* Level Grid */}
            <div className="flex-1 relative z-10 flex items-center justify-center p-8">
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
                    {LEVELS.map((level) => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            isUnlocked={unlockedLevels.includes(level.id)}
                            isCompleted={false} // TODO: Track completion separately if needed
                            onClick={() => onSelectLevel(level.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
