import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity, Radio, RotateCw, RefreshCw,
    Satellite, Play, Rocket, Lock, Crosshair, Star, ChevronRight,
    Info, AlertTriangle, Target, BookOpen, Medal, Lightbulb, AlertOctagon // Added icons
} from 'lucide-react';
// import SuccessModal from '../components/ui/SuccessModal'; // Removed as we are using internal Modal

// --- SHARED STYLES & CONSTANTS ---
const PIXEL_FONT = "font-pixel";

// --- EDUCATIONAL CONTENT ---
const FUN_FACTS = [
    {
        id: 1,
        title: "THE OBERTH EFFECT",
        text: "Engines differ in space! Burning fuel when moving FAST (at Perigee) gives you more energy than burning when slow. It's like pushing a swing at the bottom of the arc."
    },
    {
        id: 2,
        title: "ORBITAL ECCENTRICITY",
        text: "We aren't aiming for a circle. We want a highly elliptical orbit (egg-shaped) to build up speed for the final push to Mars."
    }
];

// --- MRD & CONFIGURATION ---
const MRD_CONTENT = {
    briefing: {
        title: "LEVEL 3: ORBIT INJECTION",
        subtitle: "RAISING THE APOGEE",
        sections: [
            {
                label: "MISSION GOAL",
                text: "We are now in a low parking orbit. To get to Mars, we need to stretch this orbit out. Your goal is to raise the Apogee (highest point) to 23,500 km."
            },
            {
                label: "CRITICAL TASKS",
                items: [
                    "SYSTEMS: Enable Attitude Control (ACS) and Telemetry (TM).",
                    "ALIGNMENT: Use the slider to keep Pitch at 0°.",
                    "TIMING: Only fire the engine when inside the green BURN WINDOW at Perigee.",
                    "EFFICIENCY: Do not waste fuel burning outside the window."
                ]
            }
        ],
        physics_tip: {
            label: "PRO TIP: OBERTH EFFECT",
            text: "Fire your engines when you are closest to Earth (Perigee) and moving fastest. This is the most efficient way to raise the other side of your orbit (Apogee)."
        }
    },
    failure_tips: {
        "FUEL DEPLETED": {
            title: "OUT OF PROPELLANT",
            analysis: "You ran out of fuel before reaching the target orbit. Likely cause: Burning outside the Perigee window or fighting the controls.",
            correction: "Only hold 'IGNITE' when the 'BURN WINDOW' light is flashing green."
        },
        "OVERBURN: ORBIT UNSTABLE": {
            title: "ORBIT DESTABILIZED",
            analysis: "You fired too long and overshot the target apogee. The orbit is now too eccentric to correct safely.",
            correction: "Release the 'IGNITE' button as soon as you hit the target altitude."
        },
        "ACS OFF: TUMBLED": {
            title: "LOSS OF CONTROL",
            analysis: "You attempted to fire the main engine without Attitude Control Systems active. The rocket spun out of control immediately.",
            correction: "Ensure 'ACS' is toggled ON before attempting any burns."
        }
    },
    success: {
        title: "EPO ESTABLISHED",
        mission_impact: "Beautiful flying! We have successfully raised our apogee to 23,500 km. This Highly Elliptical Orbit (HEO) is the perfect staging ground for our Trans-Mars Injection.",
        details: [
            {
                topic: "FLIGHT DATA",
                content: "• Time: ~20 min after launch\n• Orbit Achieved: 248 km × 23,500 km\n• MOM Fuel: ~852 kg (Full - no burns yet)\n• Status: Systems nominal, engines idle"
            },
            {
                topic: "MISSION VOCABULARY",
                content: "• APOGEE: The point in orbit farthest from Earth.\n• PERIGEE: The point in orbit closest to Earth.\n• DELTA-V: Change in velocity. The 'budget' for your maneuvers.\n• OBERTH EFFECT: Burning fast = More energy gained."
            },
            {
                topic: "PERFORMANCE REPORT",
                content: "Your burn timing utilized the Oberth Effect perfectly, maximizing fuel efficiency. Systems are green for the next phase."
            },
            {
                topic: "WHAT'S NEXT?",
                content: "Level 4 is the big one. We will perform a final 'Trans-Mars Injection' (TMI) burn to escape Earth's gravity completely and head into deep space."
            }
        ]
    }
};


// --- UI COMPONENTS (Copied from Level 2) ---

const Modal = ({ title, children, onClose, variant = 'neutral', buttonText = "CONTINUE", onSecondary, secondaryButtonText }) => {
    const bgColors = {
        neutral: "border-blue-500 shadow-blue-900/50",
        danger: "border-red-500 shadow-red-900/50",
        success: "border-green-500 shadow-green-900/50"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

// --- Constants ---
const BASE_APOGEE = 400; // km
const BASE_VELOCITY = 7.2; // km/s (Average orbital velocity)

// Burn settings
const BURN_RATE = 80; // km apogee gain per tick
const FUEL_RATE = 0.02; // Very low consumption

const BURN_STAGES = [
    { label: "Transfer 1", target: 16000, tolerance: 2500 },
    { label: "Transfer 2", target: 20000, tolerance: 2000 },
    { label: "Final Injection", target: 23500, tolerance: 1000 }
];

// --- Helper Components ---

const PixelButton = ({ children, className = "", variant = "primary", active = false, disabled, ...props }) => {
    const baseStyles = "relative inline-flex items-center justify-center px-6 py-5 font-pixel text-xs sm:text-sm uppercase tracking-widest transition-all focus:outline-none select-none touch-none active:scale-95";

    const variants = {
        primary: "bg-blue-600 text-white border-b-8 border-r-8 border-blue-900 hover:bg-blue-500 active:translate-y-2 active:border-0",
        danger: "bg-red-600 text-white border-b-8 border-r-8 border-red-900 hover:bg-red-500 active:translate-y-2 active:border-0",
        success: "bg-emerald-600 text-white border-b-8 border-r-8 border-emerald-900 hover:bg-emerald-500 active:translate-y-2 active:border-0",
        warning: "bg-amber-600 text-white border-b-8 border-r-8 border-amber-900 hover:bg-amber-500 active:translate-y-2 active:border-0",
        disabled: "bg-slate-700 text-slate-500 border-b-8 border-r-8 border-slate-900 cursor-not-allowed",
        toggle: active
            ? "bg-green-600 text-white border-b-8 border-r-8 border-green-900 translate-y-2 border-0 mr-[-8px] mb-[-8px]"
            : "bg-slate-800 text-slate-400 border-b-8 border-r-8 border-slate-600 hover:bg-slate-700"
    };

    const finalVariant = disabled ? 'disabled' : (variant === 'toggle' ? 'toggle' : variant);

    return (
        <button
            disabled={disabled}
            className={`${baseStyles} ${variants[finalVariant]} ${className}`}
            onContextMenu={(e) => e.preventDefault()}
            {...props}
        >
            {children}
        </button>
    );
};

const StatGauge = ({ label, value, unit, status = "normal" }) => {
    const getColor = () => {
        if (status === "danger") return "text-red-500";
        if (status === "success") return "text-green-400";
        return "text-blue-300";
    };

    return (
        <div className="bg-slate-900 border-4 border-slate-700 p-3 flex flex-col justify-between h-28 relative overflow-hidden group shadow-lg">
            <div className="text-[10px] sm:text-xs font-pixel text-slate-500 uppercase z-10">{label}</div>
            <div className={`text-xl sm:text-2xl font-mono font-bold z-10 ${getColor()}`}>
                {value} <span className="text-sm text-slate-600">{unit}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none opacity-50" />
        </div>
    );
};

export default function Level3OrbitInjection({ onBack, onNextLevel }) {
    // --- State ---
    // Modals
    const [showBriefing, setShowBriefing] = useState(true);
    const [isInitialBriefing, setIsInitialBriefing] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [failData, setFailData] = useState(null);

    // Systems
    const [attitudeActive, setAttitudeActive] = useState(false);
    const [telemetryActive, setTelemetryActive] = useState(false);
    const [ps4Armed, setPs4Armed] = useState(false);

    // Mission Progress
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [pitch, setPitch] = useState(-15);
    const [showPitchWarning, setShowPitchWarning] = useState(false);
    const [isOrbitInitialized, setIsOrbitInitialized] = useState(false); // New state for stationary start

    // Physics State
    const [fuel, setFuel] = useState(100);
    const [apogee, setApogee] = useState(BASE_APOGEE);
    const [deltaVAdded, setDeltaVAdded] = useState(0);
    const [displayVelocity, setDisplayVelocity] = useState(BASE_VELOCITY);

    // Orbital Animation State
    const [orbitalAnomaly, setOrbitalAnomaly] = useState(180);
    const [isBurnWindow, setIsBurnWindow] = useState(false);

    // Action State
    const isBurningRef = useRef(false);
    const [isBurningUI, setIsBurningUI] = useState(false);

    const [missionStatus, setMissionStatus] = useState('idle');
    const [failureReason, setFailureReason] = useState(null);

    const requestRef = useRef();
    const currentStageConfig = BURN_STAGES[Math.min(currentStageIndex, BURN_STAGES.length - 1)];

    // --- Logic Loop ---

    // Check for Orbit Initialization (Angle Set)
    useEffect(() => {
        if (!isOrbitInitialized && attitudeActive && Math.abs(pitch) <= 5) {
            setIsOrbitInitialized(true);
        }
    }, [attitudeActive, pitch, isOrbitInitialized]);

    const validateStage = useCallback(() => {
        const target = currentStageConfig.target;
        const tolerance = currentStageConfig.tolerance;

        if (Math.abs(apogee - target) <= tolerance) {
            if (currentStageIndex === 2) {
                setMissionStatus('orbit_achieved');
                setTimeout(() => setShowSuccess(true), 1500); // Delay for effect
            } else {
                setMissionStatus('stage_complete');
                setCurrentStageIndex(idx => idx + 1);

                // --- FORCED DRIFT LOGIC ---
                const driftDirection = Math.random() > 0.5 ? 1 : -1;
                const driftAmount = 8 + Math.random() * 12;
                const newPitch = parseFloat((driftDirection * driftAmount).toFixed(1));

                setPitch(newPitch);
                setPs4Armed(false);
            }
        } else if (apogee > target + tolerance) {
            failMission("OVERBURN: ORBIT UNSTABLE");
        } else {
            setMissionStatus('idle');
        }
    }, [apogee, currentStageConfig, currentStageIndex]);

    const updatePhysics = useCallback(() => {
        if (missionStatus === 'success' || missionStatus === 'failed') return;

        // STATIONARY MODE: If not initialized, do not update orbital mechanics
        if (!isOrbitInitialized) return;

        // 1. Orbital Motion & Velocity Simulation
        const rads = orbitalAnomaly * (Math.PI / 180);

        // Speed (Animation speed) slows down at apogee
        let animSpeed = 0.5 + (0.3 * Math.cos(rads));
        animSpeed *= (5000 / (apogee + 5000));

        let nextAnomaly = orbitalAnomaly + animSpeed;
        if (nextAnomaly >= 360) nextAnomaly -= 360;
        setOrbitalAnomaly(nextAnomaly);

        // Dynamic Velocity Calculation
        const baseV = BASE_VELOCITY + deltaVAdded;
        const fluctuation = 1.5 * Math.cos(rads);
        setDisplayVelocity(baseV + fluctuation);

        // 2. Window Check
        const inWindow = nextAnomaly > 345 || nextAnomaly < 15;
        setIsBurnWindow(inWindow);

        // 3. Burn Logic
        if (isBurningRef.current) {
            if (fuel <= 0) {
                isBurningRef.current = false;
                setIsBurningUI(false);
                setMissionStatus('failed');
                failMission("FUEL DEPLETED"); // Use new fail handler
                return;
            }

            if (inWindow) {
                setFuel(f => Math.max(0, f - FUEL_RATE));
                setApogee(a => a + BURN_RATE);
                setDeltaVAdded(d => d + 0.001);

                if (missionStatus === 'idle' || missionStatus === 'stage_complete') {
                    setMissionStatus('burning');
                }
            } else {
                setFuel(f => Math.max(0, f - (FUEL_RATE * 0.1)));
            }
        } else {
            if (missionStatus === 'burning') {
                validateStage();
            }
        }

    }, [orbitalAnomaly, fuel, apogee, missionStatus, validateStage, deltaVAdded, isOrbitInitialized]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
    }, [updatePhysics]);

    // --- Interaction Handlers ---

    const startBurnInteraction = () => {
        if (missionStatus === 'failed' || missionStatus === 'orbit_achieved') return;

        if (!attitudeActive) { failMission("ACS OFF: TUMBLED"); return; }
        if (!ps4Armed) return;

        // Strict Pitch Check - Lockout if misaligned
        if (Math.abs(pitch) > 5) {
            setShowPitchWarning(true);
            setTimeout(() => setShowPitchWarning(false), 1000);
            return;
        }

        isBurningRef.current = true;
        setIsBurningUI(true);
    };

    const stopBurnInteraction = () => {
        isBurningRef.current = false;
        setIsBurningUI(false);
    };

    const failMission = (reasonCode) => {
        setMissionStatus('failed');
        setFailureReason(reasonCode); // Keep for inline display if needed
        isBurningRef.current = false;
        setIsBurningUI(false);

        // Set Modal Data
        const err = MRD_CONTENT.failure_tips[reasonCode] || { title: "MISSION FAILURE", analysis: "Unknown Error", correction: "Retry Mission" };
        setFailData(err);
    };

    const resetLevel = () => {
        setAttitudeActive(false);
        setTelemetryActive(false);
        setPs4Armed(false);
        setFuel(100);
        setApogee(BASE_APOGEE);
        setDeltaVAdded(0);
        setDisplayVelocity(BASE_VELOCITY);
        setCurrentStageIndex(0);
        setPitch(-15);
        setOrbitalAnomaly(180);
        setMissionStatus('idle');
        setFailureReason(null);
        setIsOrbitInitialized(false);
        isBurningRef.current = false;
        setIsBurningUI(false);

        setShowSuccess(false);
        setFailData(null);
    };

    // --- Visualization Calculations ---
    const scale = 140 / 25000;
    const r_p_vis = 30;
    const r_a_vis = 30 + (apogee * scale);
    const majorAxis = r_p_vis + r_a_vis;
    const rx = majorAxis / 2;
    const ry = rx * 0.7;
    const c = rx - r_p_vis;
    const ellipseCx = 200 - c;

    const rads = orbitalAnomaly * (Math.PI / 180);
    const rocketX = ellipseCx + rx * Math.cos(rads);
    const rocketY = 150 + ry * Math.sin(rads);

    // Ghost Orbit Calculation
    const targetRaVis = 30 + (currentStageConfig.target * scale);
    const targetRx = (r_p_vis + targetRaVis) / 2;
    const targetRy = targetRx * 0.7;
    const targetC = targetRx - r_p_vis;
    const targetCx = 200 - targetC;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-2 sm:p-4 selection:bg-green-500 selection:text-black select-none">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        .crt-scanline {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.2) 50%,
            rgba(0,0,0,0.2)
          );
          background-size: 100% 4px;
        }
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
                    onClose={resetLevel}
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
                    onSecondary={resetLevel}
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
            <div className="w-full max-w-6xl flex items-center justify-between border-b-8 border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-6">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 hover:bg-slate-700 flex items-center justify-center border-4 border-slate-600 hover:border-slate-400 transition-colors shadow-lg"
                            title="Back to Level Selection"
                        >
                            <span className="text-white text-2xl">←</span>
                        </button>
                    )}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-700 flex items-center justify-center border-4 border-white shrink-0 shadow-[0_0_15px_rgba(21,128,61,0.6)]">
                        <Satellite className="text-white animate-pulse" size={36} />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-pixel text-slate-100 uppercase tracking-wide leading-relaxed">Injection</h1>
                        <p className="text-xs sm:text-base text-green-400 font-pixel mt-2">
                            PHASE: {currentStageConfig.label} ({currentStageIndex + 1}/3)
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setShowBriefing(true)}
                        className="hidden sm:flex bg-slate-800 px-3 py-1 border border-slate-600 items-center gap-2 hover:bg-slate-700 transition-colors"
                    >
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[10px] font-pixel text-slate-300">MRD DOCS</span>
                    </button>
                    <div className="hidden sm:block text-right">
                        <div className="text-xs font-pixel text-slate-500 mb-1">MISSION CLOCK</div>
                        <div className="font-mono text-2xl text-green-500">T+ 00:19:42</div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* === LEFT: ORBIT VISUALIZER (7 cols) === */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                    {/* The Screen */}
                    <div className="relative aspect-video bg-black border-8 border-slate-700 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
                        {/* CRT Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-20 crt-scanline opacity-20"></div>
                        <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.8)_100%)]"></div>

                        {/* Status Text Overlay */}
                        <div className="absolute top-6 left-6 z-10 font-mono text-sm sm:text-base pointer-events-none space-y-2 bg-black/40 p-2 rounded">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">APOGEE:</span>
                                <span className="text-white font-bold">{apogee.toFixed(0)} km</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">TARGET:</span>
                                <span className="text-green-400 font-bold">{currentStageConfig.target} km</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">PITCH:</span>
                                <span className={Math.abs(pitch) <= 5 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{pitch.toFixed(1)}°</span>
                            </div>
                        </div>

                        {/* Window Indicator */}
                        <div className={`absolute top-6 right-6 z-10 font-pixel text-xs px-4 py-3 border-4 transition-colors ${isBurnWindow && isOrbitInitialized ? 'bg-green-900/90 border-green-500 text-green-100 animate-pulse' : 'bg-slate-800/80 border-slate-600 text-slate-500'}`}>
                            {isOrbitInitialized ? (isBurnWindow ? "BURN WINDOW" : "COASTING") : "STANDBY"}
                        </div>

                        {/* Center Graphic Container - SVG */}
                        <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 400 300">
                            <line x1="200" y1="0" x2="200" y2="300" stroke="#1e293b" strokeWidth="2" />
                            <line x1="0" y1="150" x2="400" y2="150" stroke="#1e293b" strokeWidth="2" />

                            <ellipse
                                cx={targetCx} cy="150"
                                rx={targetRx} ry={targetRy}
                                fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 6" opacity="0.4"
                            />

                            {/* Current Orbit - HIDDEN until initialized */}
                            <ellipse
                                cx={ellipseCx} cy="150"
                                rx={rx} ry={ry}
                                fill="none"
                                stroke={missionStatus === 'failed' ? '#ef4444' : (missionStatus === 'success' ? '#10b981' : '#3b82f6')}
                                strokeWidth="3"
                                className="transition-all duration-75"
                                opacity={isOrbitInitialized ? 1 : 0}
                            />

                            <circle cx="200" cy="150" r="14" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />

                            {/* Rocket Group */}
                            <g transform={`translate(${rocketX}, ${rocketY}) rotate(${orbitalAnomaly + 90 + pitch})`}>
                                <Rocket
                                    size={24}
                                    x="-12" y="-12"
                                    className={`text-white transition-colors duration-100 ${isBurningUI && isBurnWindow ? 'text-yellow-100' : ''}`}
                                />
                                {isBurningUI && isBurnWindow && (
                                    <path d="M-4 12 L0 32 L4 12 Z" fill="#fbbf24" className="animate-pulse" />
                                )}
                            </g>
                        </svg>

                        {/* Messages */}
                        <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none z-30 px-4">
                            {!isOrbitInitialized && (
                                <div className="text-cyan-300 font-pixel text-xs sm:text-sm animate-pulse bg-black/80 p-4 inline-block rounded border-2 border-cyan-500 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <Crosshair className="animate-spin" size={16} />
                                        SYSTEM IDLE: ACTIVATE ACS & ALIGN PITCH
                                    </div>
                                </div>
                            )}
                            {missionStatus === 'failed' && (
                                <div className="bg-red-900/95 text-red-100 font-pixel text-xs py-4 px-8 inline-block border-4 border-red-500 animate-pulse shadow-2xl">
                                    FAILURE: {failureReason}
                                </div>
                            )}
                            {missionStatus === 'stage_complete' && (
                                <div className={`font-pixel text-xs py-4 px-8 inline-block border-4 shadow-2xl animate-bounce ${Math.abs(pitch) > 5 ? 'bg-red-900/95 text-red-100 border-red-500' : 'bg-emerald-900/95 text-emerald-100 border-emerald-500'}`}>
                                    {Math.abs(pitch) > 5 ? "REALIGN PITCH!" : "PITCH ALIGNED. PREPARE NEXT BURN."}
                                </div>
                            )}
                            {missionStatus === 'orbit_achieved' && (
                                <div className="bg-blue-900/95 text-blue-100 font-pixel text-xs py-4 px-8 inline-block border-4 border-blue-500 shadow-2xl">
                                    PARKING ORBIT STABLE. MISSION COMPLETE.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gauges */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatGauge label="Fuel" value={fuel.toFixed(1)} unit="%" status={fuel < 20 ? "danger" : "normal"} />
                        <StatGauge label="Velocity" value={displayVelocity.toFixed(2)} unit="km/s" status="normal" />
                        <StatGauge
                            label="Attitude"
                            value={Math.abs(pitch) <= 5 ? "ALIGNED" : "ADJUST"}
                            unit=""
                            status={Math.abs(pitch) <= 5 ? "success" : "danger"}
                        />
                    </div>
                </div>

                {/* === RIGHT: CONTROL PANEL (5 cols) === */}
                <div className="lg:col-span-5 bg-slate-900 border-8 border-slate-700 p-6 flex flex-col gap-6 rounded-xl shadow-xl">
                    <div className="flex items-center justify-between border-b-4 border-slate-700 pb-4">
                        <span className="text-blue-400 font-pixel text-sm">FLIGHT COMPUTER</span>
                        <Activity size={24} className="text-green-500 animate-pulse" />
                    </div>

                    {/* 1. Systems Toggle Grid */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-pixel text-slate-500 uppercase">01. Sub-Systems</label>
                        <div className="grid grid-cols-2 gap-4">
                            <PixelButton
                                variant="toggle"
                                active={attitudeActive}
                                onClick={() => setAttitudeActive(!attitudeActive)}
                            >
                                <RotateCw size={18} className="mr-3" /> ACS {attitudeActive ? "ON" : "OFF"}
                            </PixelButton>

                            <PixelButton
                                variant="toggle"
                                active={telemetryActive}
                                onClick={() => setTelemetryActive(!telemetryActive)}
                            >
                                <Radio size={18} className="mr-3" /> TM {telemetryActive ? "LINK" : "LOS"}
                            </PixelButton>
                        </div>
                    </div>

                    {/* 2. Attitude Control */}
                    <div className={`space-y-3 p-4 border-4 ${attitudeActive ? 'border-slate-600' : 'border-red-900/50 opacity-50'} rounded bg-black/20`}>
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-pixel text-slate-400 uppercase">02. Pitch Trim</label>
                            <span className={`text-sm font-mono font-bold ${Math.abs(pitch) <= 5 ? 'text-green-400' : 'text-red-400'}`}>
                                {pitch.toFixed(1)}°
                            </span>
                        </div>
                        <input
                            type="range" min="-45" max="45" step="0.5"
                            value={pitch}
                            onChange={(e) => setPitch(Number(e.target.value))}
                            disabled={!attitudeActive || isBurningUI}
                            className="w-full h-10 bg-slate-800 appearance-none border-2 border-slate-600 accent-blue-500 cursor-pointer rounded-none"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-pixel mt-1">
                            <span>-45</span>
                            <span className="text-blue-400">PROGRADE</span>
                            <span>+45</span>
                        </div>
                    </div>

                    {/* 3. Burn Controls */}
                    <div className={`space-y-4 p-5 border-4 ${ps4Armed ? 'border-red-900 bg-red-950/20' : 'border-slate-700 bg-slate-800/50'} transition-colors rounded`}>
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-pixel text-slate-400 uppercase">
                                03. Engine Control
                            </label>
                            {ps4Armed && <span className="text-[10px] font-pixel text-red-500 animate-pulse bg-red-950 px-2 py-1">ARMED</span>}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono mb-2 text-center h-4 flex items-center justify-center">
                            {showPitchWarning
                                ? <span className="text-red-500 font-bold animate-ping font-pixel">⚠ REALIGN PITCH FIRST ⚠</span>
                                : (isBurningUI
                                    ? (isBurnWindow ? <span className="text-green-400 animate-pulse">*** THRUSTING ***</span> : <span className="text-amber-500">HOLDING (WAIT FOR WINDOW)</span>)
                                    : (missionStatus === 'stage_complete' && Math.abs(pitch) > 5 ? "ERROR: ALIGN PITCH FIRST" : "-- HOLD IGNITE AT PERIGEE --")
                                )
                            }
                        </div>

                        <div className="flex gap-4 pt-2">
                            <PixelButton
                                variant={ps4Armed ? "danger" : "primary"}
                                className="w-1/3"
                                onClick={() => setPs4Armed(!ps4Armed)}
                                disabled={isBurningUI || missionStatus === 'success'}
                            >
                                {ps4Armed ? "DISARM" : "ARM"}
                            </PixelButton>
                            <PixelButton
                                variant="warning"
                                className="flex-1"
                                disabled={!ps4Armed || missionStatus === 'success' || missionStatus === 'orbit_achieved'}
                                onMouseDown={startBurnInteraction}
                                onMouseUp={stopBurnInteraction}
                                onMouseLeave={stopBurnInteraction}
                                onTouchStart={(e) => { e.preventDefault(); startBurnInteraction(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopBurnInteraction(); }}
                            >
                                {showPitchWarning ? <Lock size={18} className="mx-auto" /> : <Play size={18} className="mr-2" />}
                                {isBurningUI ? "IGNITING..." : "HOLD IGNITE"}
                            </PixelButton>
                        </div>
                    </div>

                    {/* Reset */}
                    <div className="mt-auto pt-4">
                        <PixelButton variant="disabled" className="w-full opacity-50 hover:opacity-100" onClick={resetLevel}>
                            <RefreshCw size={18} className="mr-2" /> ABORT / RESTART
                        </PixelButton>
                    </div>

                </div>
            </div>

            {/* SUCCESS MODAL */}
            {/* OLD SUCCESS MODAL REMOVED - REPLACED BY NEW MODAL ABOVE */}
        </div>
    );
}