import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Satellite, Play, Flame, Droplets, RotateCcw,
    FastForward, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, XCircle,
    Info, Target, BookOpen, Medal, Lightbulb, AlertOctagon // Added icons
} from 'lucide-react';
// import SuccessModal from '../components/ui/SuccessModal'; // Removed

// --- SHARED STYLES ---
const PIXEL_FONT = "font-pixel";

// --- EDUCATIONAL CONTENT ---
const FUN_FACTS = [
    {
        id: 1,
        title: "HOHMANN TRANSFER",
        text: "The most fuel-efficient way to move between orbits is an elliptical path exactly touching both the starting and target orbits."
    },
    {
        id: 2,
        title: "ESCAPE VELOCITY",
        text: "To leave Earth behind, we need to reach 11.2 km/s. Once we pass that speed, Earth's gravity can no longer pull us back."
    }
];

// --- MRD & CONFIGURATION ---
const MRD_CONTENT = {
    briefing: {
        title: "LEVEL 4: ORBIT RAISING",
        subtitle: "TRANS-MARS INJECTION PREP",
        sections: [
            {
                label: "MISSION GOAL",
                text: "We are in a stable parking orbit. Now we must raise our Apogee (highest point) to 282,000 km to prepare for the final slingshot to Mars."
            },
            {
                label: "CRITICAL TASKS",
                items: [
                    "PATIENCE: Wait for the 'Perigee Window' (Closest approach to Earth).",
                    "STRATEGY: Use 'Small' or 'Medium' burns to save fuel.",
                    "PRECISION: Do not overshoot the target. Gravity assists require exact altitude."
                ]
            }
        ],
        physics_tip: {
            label: "PRO TIP: BURN STRENGTH",
            text: "Big engine burns get you there faster but waste fuel. Small burns are efficient but take more orbits. Balance speed with efficiency!"
        }
    },
    failure_tips: {
        "FUEL DEPLETED": {
            title: "TANKS DRY",
            analysis: "You ran out of propellant before reaching the target orbit. Likely cause: Using 'Strong' burns too often or missing the Perigee window.",
            correction: "Use 'Medium' burns for the big jumps, and 'Small' burns to fine-tune."
        },
        "CRITICAL OVERSHOOT": {
            title: "GRAVITY SLINGSHOT INVALID",
            analysis: "You pushed the apogee too high! If we go too far, the Moon's gravity will destabilize us instead of helping us.",
            correction: "Watch the 'Next Target' indicator. Switch to 'Small' burns as you get closer."
        }
    },
    success: {
        title: "TMI WINDOW REACHED",
        mission_impact: "Outstanding! We are now in a highly elliptical orbit stretching 280,000 km into space. We are perfectly positioned to break free from Earth's gravity.",
        details: [
            {
                topic: "FLIGHT DATA",
                content: "• Duration: 7-16 Nov 2013 (~10 days)\n• Initial Orbit: 248 km perigee\n• Final Orbit: ~192,000 km apogee\n• Fuel Used: ~400-450 kg\n• Remaining Fuel: ~440-450 kg"
            },
            {
                topic: "MISSION VOCABULARY",
                content: "• TMI: Trans-Mars Injection (The maneuver to fly to Mars).\n• ECCENTRICITY: How 'stretched out' an orbit is.\n• ESCAPE VELOCITY: The speed needed to leave a planet forever (11.2 km/s for Earth)."
            },
            {
                topic: "PERFORMANCE REPORT",
                content: "You managed your fuel reserves perfectly. The spacecraft is ready for the final interplanetary burn."
            },
            {
                topic: "WHAT'S NEXT?",
                content: "The final push. In Level 5, we will leave the Earth-Moon system behind and begin the 300-day cruise to the Red Planet."
            }
        ]
    }
};

// --- UI COMPONENTS (Standardized Modal) ---
const Modal = ({ title, children, onClose, variant = 'neutral', buttonText = "CONTINUE", onSecondary, secondaryButtonText }) => {
    const bgColors = {
        neutral: "border-blue-500 shadow-blue-900/50",
        danger: "border-red-500 shadow-red-900/50",
        success: "border-green-500 shadow-green-900/50"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-slate-900 border-4 ${bgColors[variant]} max-w-lg w-full shadow-2xl relative flex flex-col max-h-[90vh]`}>

                {/* Fixed Header */}
                <div className="p-6 pb-2 shrink-0">
                    <h2 className={`font-pixel text-sm md:text-base text-center ${variant === 'danger' ? 'text-red-400' : variant === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                        {title}
                    </h2>
                </div>

                {/* Scrollable Content */}
                <div className="px-6 py-2 overflow-y-auto custom-scroll flex-1">
                    <div className="space-y-4 font-mono text-xs md:text-sm text-slate-300 leading-relaxed">
                        {children}
                    </div>
                </div>

                {/* Fixed Footer Buttons */}
                <div className="p-6 pt-4 shrink-0 flex gap-3">
                    {onSecondary && (
                        <button
                            onClick={onSecondary}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-white text-white font-pixel text-xs py-3 transition-all uppercase"
                        >
                            {secondaryButtonText}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${onSecondary ? 'flex-1' : 'w-full'} bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-white text-white font-pixel text-xs py-3 transition-all uppercase`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Configuration ---
const STAGES = [
    { id: 1, target: 40000, label: "Burn 1" },
    { id: 2, target: 71600, label: "Burn 2" },
    { id: 3, target: 100000, label: "Burn 3" },
    { id: 4, target: 192000, label: "Burn 4" },
    { id: 5, target: 282000, label: "Final TMI Burn" }
];

const MAX_APOGEE_LIMIT = 300000; // Strict limit: 300k km

// BALANCED VALUES: Small/Medium are efficient. Strong is fast but wasteful.
const BURN_OPTIONS = {
    SMALL: { gain: 30000, fuelCost: 10, label: "Small Burn", desc: "Best Efficiency (30k km)" },
    MEDIUM: { gain: 70000, fuelCost: 25, label: "Medium Burn", desc: "Balanced (70k km)" },
    STRONG: { gain: 110000, fuelCost: 55, label: "Strong Burn", desc: "Inefficient (110k km)" }
};

// --- Components ---

const GameButton = ({ children, className = "", variant = "primary", disabled, onClick, ...props }) => {
    const baseStyles = "relative inline-flex items-center justify-center px-4 py-3 font-pixel text-xs sm:text-sm uppercase tracking-widest transition-all focus:outline-none select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1",
        danger: "bg-red-500 text-white hover:bg-red-400 border-b-4 border-red-800 active:border-b-0 active:translate-y-1",
        success: "bg-emerald-500 text-white hover:bg-emerald-400 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1",
        warning: "bg-amber-500 text-white hover:bg-amber-400 border-b-4 border-amber-800 active:border-b-0 active:translate-y-1",
        neutral: "bg-slate-700 text-slate-200 hover:bg-slate-600 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1",
        selected: "bg-yellow-500 text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
    };

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const ChatBubble = ({ message, type = "neutral" }) => {
    const bg = type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
        type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
            'bg-blue-50 border-blue-300 text-slate-700';

    return (
        <div className={`p-4 rounded-lg border-2 ${bg} font-pixel text-xs leading-relaxed shadow-sm flex items-start gap-3`}>
            <div className="mt-1">
                {type === 'success' ? <CheckCircle size={16} /> : type === 'error' ? <AlertTriangle size={16} /> : <Satellite size={16} />}
            </div>
            <div>{message}</div>
        </div>
    );
};

export default function Level4OrbitRaising({ onBack, onNextLevel }) {
    // --- State ---
    // --- State ---
    const [stageIndex, setStageIndex] = useState(0);
    const [apogee, setApogee] = useState(23500); // Starting apogee
    const [fuel, setFuel] = useState(100); // Percent

    // Gameplay State
    const [selectedStrength, setSelectedStrength] = useState('MEDIUM');
    const [isTimeWarping, setIsTimeWarping] = useState(false);
    const [isBurning, setIsBurning] = useState(false);

    // Modal State
    const [showBriefing, setShowBriefing] = useState(true);
    const [isInitialBriefing, setIsInitialBriefing] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [failData, setFailData] = useState(null); // replaces isFailed / failureReason

    const [message, setMessage] = useState({ text: "Welcome! Strategy Tip: Use Small or Medium burns to save fuel. Strong burns are wasteful!", type: "neutral" });
    const [history, setHistory] = useState(null); // For Undo

    // Physics / Animation
    const [orbitalAnomaly, setOrbitalAnomaly] = useState(180); // Start at Apogee (Left)
    const [isPerigeeWindow, setIsPerigeeWindow] = useState(false);

    const requestRef = useRef();

    const currentStage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
    const isMissionComplete = stageIndex >= STAGES.length;

    // --- Physics Loop ---
    const updatePhysics = useCallback(() => {
        // 1. Orbital Motion
        let baseSpeed = 0.8;

        // Adjust for Orbit Size (Apogee) - Clamped for playability
        const sizeFactor = Math.max(0.4, 40000 / (apogee + 20000));
        let speed = baseSpeed * sizeFactor;

        // Apply speed boost for high orbits
        if (apogee > 90000) {
            speed *= 1.5;
        }

        // Kepler's 2nd Law (Fast Perigee, Slow Apogee)
        const rads = orbitalAnomaly * (Math.PI / 180);
        speed *= (1 + 0.5 * Math.cos(rads));

        // SUPERCHARGED WARP SPEED
        if (isTimeWarping) speed = 25;

        let nextAnomaly = orbitalAnomaly + speed;
        if (nextAnomaly >= 360) nextAnomaly -= 360;

        // Stop warp at perigee
        if (isTimeWarping && (nextAnomaly > 345 || nextAnomaly < 15)) {
            setIsTimeWarping(false);
            setOrbitalAnomaly(0); // Snap to 0
            setMessage({ text: "Perigee Reached! The spacecraft is closest to Earth. Fire engines now!", type: "success" });
            return;
        }

        setOrbitalAnomaly(nextAnomaly);

        // 2. Window Check (Perigee is near 0)
        const inWindow = nextAnomaly > 340 || nextAnomaly < 20;
        setIsPerigeeWindow(inWindow);

    }, [orbitalAnomaly, isTimeWarping, apogee]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
    }, [updatePhysics]);

    // --- Actions ---

    const handleWaitPerigee = () => {
        if (isPerigeeWindow) {
            setMessage({ text: "You are already at Perigee!", type: "neutral" });
        } else {
            setIsTimeWarping(true);
            setMessage({ text: "Warping to Perigee...", type: "neutral" });
        }
    };

    const handleStrengthSelection = (key) => {
        setSelectedStrength(key);
    };

    const handleFireEngine = () => {
        if (fuel <= 0) {
            failMission("FUEL DEPLETED");
            return;
        }

        // Save history for Undo
        setHistory({ stageIndex, apogee, fuel });

        setIsBurning(true);
        setTimeout(() => setIsBurning(false), 1000); // Visual burn duration

        if (!isPerigeeWindow) {
            // Burn wasted
            const cost = BURN_OPTIONS[selectedStrength].fuelCost * 0.5;
            setFuel(f => Math.max(0, f - cost));
            setMessage({ text: "Burn wasted! You fired too early/late. Only fire when the Perigee dot is glowing.", type: "error" });
        } else {
            // Check fuel again just in case
            const opts = BURN_OPTIONS[selectedStrength];
            if (fuel < opts.fuelCost) {
                setMessage({ text: "Insufficient fuel for this burn strength!", type: "error" });
                return;
            }

            // Success Burn
            setFuel(f => Math.max(0, f - opts.fuelCost));
            const newApogee = apogee + opts.gain;
            setApogee(newApogee);

            // --- OVERSHOOT CHECK (CRITICAL FAILURE) ---
            if (newApogee > MAX_APOGEE_LIMIT) {
                failMission("CRITICAL OVERSHOOT");
                return;
            }

            // Smart Target Update Logic
            let newStageIndex = STAGES.length;

            for (let i = 0; i < STAGES.length; i++) {
                if (STAGES[i].target > newApogee) {
                    newStageIndex = i;
                    break;
                }
            }

            if (newStageIndex >= STAGES.length) {
                setStageIndex(STAGES.length);
                setMessage({ text: "MISSION SUCCESS! Orbit matches TMI requirements.", type: "success" });
                setTimeout(() => setShowSuccess(true), 1500); // Trigger Success Modal
            } else if (newStageIndex > stageIndex) {
                setStageIndex(newStageIndex);
                setMessage({ text: `Great job! Orbit raised. Next target: ${(STAGES[newStageIndex].target / 1000).toFixed(0)}k km.`, type: "success" });
            } else {
                setMessage({ text: "Orbit raised! But we need to go higher. Wait for another pass.", type: "neutral" });
            }
        }
    };

    const failMission = (reasonCode) => {
        // Look up content
        const err = MRD_CONTENT.failure_tips[reasonCode] || { title: "MISSION FAILED", analysis: "Unknown Error", correction: "Retry." };
        setFailData(err);
        setHistory(null); // Disable Undo on hard failure
    };

    const handleUndo = () => {
        if (history) {
            setStageIndex(history.stageIndex);
            setApogee(history.apogee);
            setFuel(history.fuel);
            setHistory(null);
            setMessage({ text: "Last burn undone. Try again!", type: "neutral" });
        }
    };

    const handleReset = () => {
        setStageIndex(0);
        setApogee(23500);
        setFuel(100);
        setOrbitalAnomaly(180);
        setHistory(null);
        setFailData(null);
        setShowSuccess(false);
        setMessage({ text: "Simulation Reset. Ready for liftoff.", type: "neutral" });
    };

    // --- Visuals ---
    const cx = 150;
    const cy = 150;

    const scale = 110 / currentStage.target;

    const r_perigee_vis = 20;
    const r_apogee_vis = Math.max(20, apogee * scale * 0.8);

    const rx = (r_perigee_vis + r_apogee_vis) / 2;
    const ry = rx * 0.7;
    const orbitCx = cx + r_perigee_vis - rx;

    const t_r_apogee_vis = currentStage.target * scale * 0.8;
    const tRx = (r_perigee_vis + t_r_apogee_vis) / 2;
    const tRy = tRx * 0.7;
    const tOrbitCx = cx + r_perigee_vis - tRx;

    const rads = orbitalAnomaly * (Math.PI / 180);
    const satX = orbitCx + rx * Math.cos(rads);
    const satY = cy + ry * Math.sin(rads);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-2 sm:p-4 select-none flex flex-col items-center">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        @keyframes popup-scale {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slow-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-popup { animation: popup-scale 0.5s ease-out forwards; }
        .animate-slow-pulse { animation: slow-pulse 2s infinite ease-in-out; }
      `}</style>

            {/* --- MODALS --- */}

            {showBriefing && (
                <Modal
                    title={MRD_CONTENT.briefing.title}
                    onClose={() => { setShowBriefing(false); setIsInitialBriefing(false); }}
                    buttonText={isInitialBriefing ? "ENTER MISSION CONTROL" : "RESUME MISSION"}
                >
                    <div className="text-center text-blue-300 font-bold mb-2">{MRD_CONTENT.briefing.subtitle}</div>
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-3 border-l-4 border-blue-500">
                            <h3 className="text-blue-400 font-bold mb-1 flex items-center gap-2"><Target size={14} /> MISSION GOAL</h3>
                            <p>{MRD_CONTENT.briefing.sections[0].text}</p>
                        </div>
                        <div className="bg-slate-800 p-3 border-l-4 border-amber-500">
                            <h3 className="text-amber-400 font-bold mb-1 flex items-center gap-2"><AlertTriangle size={14} /> CRITICAL TASKS</h3>
                            <ul className="list-disc pl-4 space-y-1">
                                {MRD_CONTENT.briefing.sections[1].items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-800 p-3 border-l-4 border-green-500">
                            <h3 className="text-green-400 font-bold mb-1 flex items-center gap-2"><BookOpen size={14} /> {MRD_CONTENT.briefing.physics_tip.label}</h3>
                            <p>{MRD_CONTENT.briefing.physics_tip.text}</p>
                        </div>
                    </div>
                </Modal>
            )}

            {failData && (
                <Modal
                    title={failData.title}
                    variant="danger"
                    onClose={handleReset}
                    buttonText="RETRY SIMULATION"
                >
                    <div className="flex flex-col items-center gap-4 w-full">
                        <AlertOctagon size={48} className="text-red-500 animate-pulse" />
                        <div className="w-full space-y-4">
                            <div className="bg-red-950/30 p-3 border-l-2 border-red-500 rounded-r">
                                <h4 className="text-[10px] font-pixel text-red-400 mb-1">FAILURE ANALYSIS</h4>
                                <p className="text-sm text-slate-300">{failData.analysis}</p>
                            </div>
                            <div className="bg-blue-950/30 p-3 border-l-2 border-blue-500 rounded-r">
                                <h4 className="text-[10px] font-pixel text-blue-400 mb-1">RECOVERY PLAN</h4>
                                <p className="text-sm text-slate-300">{failData.correction}</p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {showSuccess && (
                <Modal
                    title={MRD_CONTENT.success.title}
                    variant="success"
                    onClose={onNextLevel}
                    buttonText="NEXT LEVEL"
                    onSecondary={handleReset}
                    secondaryButtonText="REPLAY LEVEL"
                >
                    <div className="flex flex-col items-center gap-4">
                        <Medal size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />

                        {/* --- MISSION DEBRIEF --- */}
                        <div className="bg-slate-800 p-4 border border-green-900 rounded-sm w-full">
                            <h3 className="text-green-400 font-bold mb-3 text-center border-b border-green-900/50 pb-2">MISSION DEBRIEF</h3>

                            {/* Mission Impact Section */}
                            <div className="mb-4 text-center">
                                <p className="text-sm text-white font-bold mb-2 italic">"{MRD_CONTENT.success.mission_impact}"</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {MRD_CONTENT.success.details.map((point, idx) => (
                                    <div key={idx} className="text-left">
                                        <div className="text-[10px] font-pixel text-green-300 mb-1">✓ {point.topic}</div>
                                        <div className="text-xs text-slate-400 leading-relaxed font-sans whitespace-pre-line">{point.content}</div>
                                    </div>
                                ))}
                            </div>

                            {/* --- MISSION TRIVIA SECTION --- */}
                            <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-sm">
                                <h4 className="text-[10px] font-pixel text-cyan-400 mb-2 flex items-center gap-2">
                                    <Lightbulb size={12} /> MISSION TRIVIA
                                </h4>
                                <div className="space-y-3">
                                    {FUN_FACTS.map((fact) => (
                                        <div key={fact.id} className="text-left">
                                            <span className="text-[9px] font-bold text-slate-300 block mb-0.5">{fact.title}</span>
                                            <p className="text-[10px] text-slate-500 leading-tight">{fact.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* HEADER */}
            <div className="w-full max-w-4xl border-b-4 border-slate-700 pb-4 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 flex items-center justify-center border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-lg rounded"
                            title="Back to Level Selection"
                        >
                            <span className="text-white text-xl">←</span>
                        </button>
                    )}
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-white shadow-lg">
                        <Satellite className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-pixel text-white">ORBIT RAISER</h1>
                        <p className="text-xs text-blue-400 font-bold">STAGE {Math.min(stageIndex + 1, STAGES.length)} / {STAGES.length}</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-500">APOGEE GOAL</div>
                    <div className="font-mono text-xl text-green-400">{(currentStage.target / 1000).toFixed(0)}k km</div>
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setShowBriefing(true)}
                        className="hidden sm:flex bg-slate-800 px-3 py-1 border border-slate-600 items-center gap-2 hover:bg-slate-700 transition-colors"
                    >
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[10px] font-pixel text-slate-300">MRD DOCS</span>
                    </button>
                </div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">

                {/* LEFT: VISUALIZER */}
                <div className="flex flex-col gap-4">
                    <div className="relative aspect-square bg-black border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                        {/* HUD */}
                        <div className="absolute top-4 left-4 font-mono text-xs z-20 space-y-1">
                            <div className="text-slate-500">CURRENT APOGEE</div>
                            <div className={apogee > MAX_APOGEE_LIMIT ? "text-red-500 font-bold animate-pulse" : "text-white text-lg font-bold"}>
                                {(apogee / 1000).toFixed(1)}k km
                            </div>
                        </div>

                        {/* Speed Indicator */}
                        {isTimeWarping && (
                            <div className="absolute top-4 right-4 z-20 bg-blue-900/80 px-3 py-1 rounded border border-blue-500 animate-pulse font-pixel text-[10px] text-white">
                                {'>'}{'>'}{'>'} WARP ACTIVE
                            </div>
                        )}

                        {/* SVG Graphics */}
                        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 300 300">
                            {/* Grid */}
                            <path d="M0 150 L300 150 M150 0 L150 300" stroke="#1e293b" strokeWidth="1" />

                            {/* Perigee Highlight (The Blue Zone) */}
                            <circle cx={150 + 20} cy={150} r="15" fill="rgba(59, 130, 246, 0.2)" />
                            <circle cx={150 + 20} cy={150} r="4" fill={isPerigeeWindow ? "#60a5fa" : "#1e3a8a"} className={isPerigeeWindow ? "animate-ping" : ""} />

                            {/* Target Ring */}
                            <ellipse cx={tOrbitCx} cy={150} rx={tRx} ry={tRy} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />

                            {/* Current Orbit */}
                            <ellipse
                                cx={orbitCx} cy={150} rx={rx} ry={ry}
                                fill="none"
                                stroke={failData ? "#ef4444" : "#3b82f6"}
                                strokeWidth="3"
                            />

                            {/* Earth */}
                            <circle cx="150" cy="150" r="12" fill="#2563eb" stroke="#93c5fd" strokeWidth="2" />

                            {/* Satellite */}
                            <g transform={`translate(${satX}, ${satY})`}>
                                <circle r="5" fill="white" stroke="#000" strokeWidth="1" />
                                {isBurning && (
                                    <path d="M-5 0 L-15 -4 L-15 4 Z" fill="#fbbf24" className="animate-pulse" />
                                )}
                            </g>
                        </svg>
                    </div>

                    {/* Fuel Gauge */}
                    <div className="bg-slate-800 p-3 rounded-lg border-2 border-slate-600 flex items-center gap-3">
                        <Droplets className={fuel < 20 ? "text-red-500 animate-pulse" : "text-blue-400"} />
                        <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300 font-pixel">FUEL</span>
                                <span className="text-white font-mono">{fuel.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${fuel < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${fuel}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROLS */}
                <div className="flex flex-col gap-4">

                    {/* 1. Feedback Box */}
                    <ChatBubble message={message.text} type={message.type} />

                    {/* 2. Primary Actions */}
                    <div className="bg-slate-900 border-4 border-slate-700 p-4 rounded-xl flex flex-col gap-4 shadow-xl">

                        {/* Step 1: Wait */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-pixel text-slate-400">STEP 1: TIMING</label>
                            {isPerigeeWindow && <span className="text-xs font-bold text-green-400 animate-pulse">AT PERIGEE!</span>}
                        </div>
                        <GameButton
                            variant="neutral"
                            onClick={handleWaitPerigee}
                            disabled={isTimeWarping || isPerigeeWindow || isMissionComplete || failData}
                        >
                            <div className="flex items-center gap-2">
                                {isTimeWarping ? <FastForward className="animate-spin" /> : <FastForward />}
                                {isTimeWarping ? "WARPING..." : "WAIT FOR PERIGEE"}
                            </div>
                        </GameButton>

                        {/* Step 2: Config */}
                        <label className="text-xs font-pixel text-slate-400 mt-2">STEP 2: BURN STRENGTH</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(BURN_OPTIONS).map(([key, opt]) => {
                                const isInsufficient = fuel < opt.fuelCost;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStrengthSelection(key)}
                                        // Disabled only if hard-failed or insufficient
                                        disabled={failData || isMissionComplete || isInsufficient}
                                        className={`p-2 rounded text-xs border-2 transition-all flex flex-col items-center gap-1 relative group
                                ${selectedStrength === key
                                                ? 'bg-yellow-600 border-yellow-300 text-white scale-105 shadow-lg'
                                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                                            }
                                ${isInsufficient ? 'opacity-50 cursor-not-allowed border-red-900 bg-slate-900' : ''}
                            `}
                                    >
                                        <span className="font-bold">{opt.label}</span>
                                        <span className="text-[9px] opacity-80">{opt.desc}</span>
                                        <span className={`text-[9px] font-mono ${isInsufficient ? 'text-red-500 font-bold' : 'text-slate-500'}`}>Cost: {opt.fuelCost}%</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Step 3: Action */}
                        <label className="text-xs font-pixel text-slate-400 mt-2">STEP 3: EXECUTE</label>
                        <GameButton
                            variant={isPerigeeWindow ? "success" : "primary"}
                            onClick={handleFireEngine}
                            disabled={isMissionComplete || isTimeWarping || isBurning || failData}
                            className="h-16 text-lg"
                        >
                            <div className="flex items-center gap-3">
                                <Flame size={24} className={isBurning ? "animate-bounce" : ""} />
                                {isBurning ? "FIRING..." : "FIRE ENGINE"}
                            </div>
                        </GameButton>

                    </div>

                    {/* 3. Utility Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                        <GameButton
                            variant="warning"
                            onClick={handleUndo}
                            disabled={!history || isMissionComplete || failData}
                        >
                            <div className="flex items-center gap-2">
                                <RotateCcw size={16} /> UNDO BURN
                            </div>
                        </GameButton>

                        <GameButton
                            variant="neutral"
                            onClick={handleReset}
                        >
                            <div className="flex items-center gap-2">
                                <RefreshCw size={16} /> RESTART
                            </div>
                        </GameButton>
                    </div>

                </div>
            </div>

            {/* --- FULL SCREEN OVERLAYS --- */}

            {/* OLD MODALS REMOVED - REPLACED BY NEW SYSTEM */}

        </div>
    );
}