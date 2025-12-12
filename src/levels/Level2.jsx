import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Check, X, Rocket, Fuel, Zap, Radio, Shield, Box, Lock,
    Settings, RefreshCw, Sun, AlertTriangle, Target, Star, Medal,
    Power, Thermometer, Wind, Activity, ArrowUp, AlertOctagon,
    ChevronRight, Play, FastForward, Info, Lightbulb, BookOpen
} from 'lucide-react';

// --- Shared Styles ---
const PIXEL_FONT = "font-pixel";

// --- EDUCATIONAL CONTENT ---
const FUN_FACTS = [
    {
        id: 1,
        title: "FRUGAL ENGINEERING",
        text: "The real Mars Orbiter Mission cost only $74 million. That's less than the budget of the Hollywood movie 'Gravity'!"
    },
    {
        id: 2,
        title: "THE WORKHORSE",
        text: "You are flying the PSLV-XL. It uses extended strap-on boosters to carry the 1,350 kg orbiter, heavier than standard satellites."
    }
];

// --- MRD & CONFIGURATION ---
const FLIGHT_EVENTS = [
    { id: 'ignite_core', label: 'IGNITE CORE', time: 0, window: 0, type: 'auto', desc: "Auto Sequence" },
    { id: 'lift_off', label: 'LIFTOFF', time: 0, window: 0, type: 'auto', desc: "Tower Clear" },
    { id: 'sep_strapon', label: 'SEP STRAP-ONS', time: 12, window: 3, type: 'manual', desc: "Burnout detected" },
    { id: 'sep_stage1', label: 'SEP STAGE 1', time: 25, window: 3, type: 'manual', desc: "Core Depletion" },
    { id: 'ignite_stage2', label: 'IGNITE STAGE 2', time: 28, window: 3, type: 'manual', desc: "Second Stage Startup" },
    { id: 'fairing', label: 'DEPLOY FAIRING', minAlt: 80, type: 'altitude', desc: "Atmosphere Exit > 80km" }
];

const MRD_CONTENT = {
    briefing: {
        title: "LEVEL 2: ASCENT & STAGING",
        subtitle: "GETTING TO SPACE",
        sections: [
            {
                label: "MISSION GOAL",
                text: "We are launching the PSLV (Polar Satellite Launch Vehicle). Your job is to guide the rocket out of Earth's atmosphere to reach 'Parking Orbit' (170km high)."
            },
            {
                label: "CRITICAL TASKS",
                items: [
                    "PRE-LAUNCH: Turn ON all 5 flight systems.",
                    "TIMING: Click 'SEP' (Separate) buttons exactly when they blink.",
                    "STABILITY: Keep the Trim Slider in the GREEN zone.",
                    "PROTECTION: Only open the nose cone (Fairing) after 80km altitude."
                ]
            }
        ],
        physics_tip: {
            label: "ROCKET SCIENCE SIMPLIFIED",
            text: "Space is not just 'up', it is 'fast'. We need to go up to get out of the air, and sideways to stay in orbit. The 'Strap-on Boosters' give us the extra push needed to lift the heavy Mars Orbiter."
        }
    },
    failure_tips: {
        "TRIM_CRITICAL": {
            title: "ROCKET TIPPED OVER",
            analysis: "The rocket leaned too far. At this speed, the wind hit the side of the rocket and snapped it in half (Aerodynamic Stress).",
            correction: "Keep the Trim Slider centered in the green zone."
        },
        "TIMING_EARLY": {
            title: "STAGES COLLIDED",
            analysis: "You separated a stage while it was still pushing hard. The empty stage crashed into the engine above it.",
            correction: "Wait for the button to BLINK green before clicking."
        },
        "TIMING_LATE": {
            title: "RAN OUT OF FUEL",
            analysis: "You held onto the empty stage too long. The rocket got too heavy to reach space (Gravity Loss).",
            correction: "Click 'SEP' immediately when the light turns green."
        },
        "FAIRING_EARLY": {
            title: "PAYLOAD DESTROYED",
            analysis: "You opened the nose cone (Fairing) while there was still air outside. The wind and heat destroyed the satellite.",
            correction: "Wait until altitude is greater than 80km (Space starts around 100km)."
        },
        "MISSED_STRAPS": {
            title: "TOO HEAVY",
            analysis: "You forgot to drop the Strap-on Boosters. The rocket is too heavy to reach orbit.",
            correction: "Click 'SEP STRAP-ONS' at T+12s."
        },
        "MISSED_STAGE1": {
            title: "STAGE FAILURE",
            analysis: "You tried to light Stage 2 while Stage 1 was still attached.",
            correction: "Click 'SEP STAGE 1' at T+25s."
        },
        "MISSED_STAGE2": {
            title: "LOSS OF MOMENTUM",
            analysis: "Stage 2 never lit up. The rocket drifted to a stop and fell back to Earth.",
            correction: "Ignite Stage 2 at T+28s."
        }
    },
    success: {
        title: "ORBIT ACHIEVED!",
        mission_impact: "Perfect launch! The PSLV has successfully placed Mangalyaan into a temporary 'Parking Orbit' around Earth.",
        details: [
            {
                topic: "FLIGHT DATA",
                content: "• Launch: 5 Nov 2013, 14:38 IST\n• Altitude: 0 km → ~250 km\n• MOM Fuel: ~852 kg (Unused - PSLV thrust only)\n• Duration: ~20 minutes"
            },
            {
                topic: "MISSION VOCABULARY",
                content: "• PSLV: Polar Satellite Launch Vehicle (The Rocket).\n• MOM: Mars Orbiter Mission (The Satellite).\n• MAX-Q: Moment of maximum physical stress on the rocket.\n• STAGING: Dropping empty fuel tanks to get lighter."
            },
            {
                topic: "PERFORMANCE REPORT",
                content: "You kept the rocket stable and dropped the empty stages at the perfect time. We are now coasting in space at 23,000 km/h!"
            },
            {
                topic: "WHAT'S NEXT?",
                content: "Now that we are in space, we need to escape Earth's gravity. In the next level, we will fire the engines at specific times to raise our orbit higher and higher until we can sling-shot to Mars."
            }
        ]
    }
};

// --- UI COMPONENTS ---

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

const PixelButton = ({ onClick, disabled, children, className = "", variant = "primary", title, blink = false }) => {
    const baseStyles = "relative inline-flex items-center justify-center px-4 py-3 font-pixel text-[10px] sm:text-xs uppercase tracking-widest transition-transform active:translate-y-1 focus:outline-none select-none";

    const variants = {
        primary: "bg-blue-600 text-white border-b-4 border-r-4 border-blue-900 hover:bg-blue-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        danger: "bg-red-600 text-white border-b-4 border-r-4 border-red-900 hover:bg-red-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        success: "bg-emerald-600 text-white border-b-4 border-r-4 border-emerald-900 hover:bg-emerald-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        warning: "bg-amber-500 text-black border-b-4 border-r-4 border-amber-800 hover:bg-amber-400 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        disabled: "bg-slate-700 text-slate-500 border-b-4 border-r-4 border-slate-900 cursor-not-allowed",
    };

    return (
        <button
            onClick={!disabled ? onClick : undefined}
            className={`
        ${baseStyles} 
        ${disabled ? variants.disabled : variants[variant]} 
        ${blink ? 'animate-pulse ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''} 
        ${className}
      `}
            title={title}
        >
            {children}
        </button>
    );
};

const ToggleSwitch = ({ label, isOn, onToggle, disabled }) => (
    <div className="flex items-center justify-between bg-slate-800 p-2 border-2 border-slate-700">
        <span className="text-[10px] font-pixel text-slate-300">{label}</span>
        <div
            onClick={!disabled ? onToggle : undefined}
            className={`w-10 h-5 rounded-none relative cursor-pointer transition-colors border-2 ${isOn ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'}`}
        >
            <div className={`absolute top-0 bottom-0 w-4 bg-slate-300 transition-all border-r-2 border-b-2 border-slate-500 ${isOn ? 'right-0' : 'left-0'}`} />
        </div>
    </div>
);

// --- MAIN LEVEL COMPONENT ---
export default function RocketAscentLevel2({ onNextLevel, onBack }) {
    // Phase: 'pre-launch' | 'countdown' | 'ascent' | 'fail' | 'success'
    const [phase, setPhase] = useState('pre-launch');

    // Modals
    const [showBriefing, setShowBriefing] = useState(true);
    const [isInitialBriefing, setIsInitialBriefing] = useState(true);
    const [failData, setFailData] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Trivia State
    const [activeFact, setActiveFact] = useState(null);
    // Track if facts have been scheduled to ensure we don't double schedule
    const [factsScheduled, setFactsScheduled] = useState(false);

    // Toggles
    const [toggles, setToggles] = useState({
        retraction: false, water: false, fuel: false, guidance: false, power: false,
    });

    // Physics / Game State
    const [time, setTime] = useState(-10); // Start at T-10s
    const [altitude, setAltitude] = useState(0); // Meters
    const [velocity, setVelocity] = useState(0); // m/s
    const [thrustTrim, setThrustTrim] = useState(0); // -50 to 50
    const [logs, setLogs] = useState(["SYSTEM INITIALIZED. STANDING BY."]);

    // Fuel States (Internal Physics only)
    const [solidFuel, setSolidFuel] = useState(100);
    const [liquidFuel, setLiquidFuel] = useState(100);

    // Event Tracking
    const [completedEvents, setCompletedEvents] = useState([]);
    const [stage2IgnitionTime, setStage2IgnitionTime] = useState(null);
    const [isWarping, setIsWarping] = useState(false);

    // Refs for intervals
    const timerRef = useRef(null);

    // --- Logic Helpers ---
    const addLog = (msg) => setLogs(prev => [`T${time >= 0 ? '+' : ''}${Math.abs(time).toFixed(1)}: ${msg}`, ...prev].slice(0, 6));

    const failMission = (code) => {
        setPhase('fail');
        const err = MRD_CONTENT.failure_tips[code] || { title: "MISSION FAILURE", analysis: "Unknown Error", correction: "Retry Mission" };
        setFailData(err);
        addLog(`CRITICAL FAILURE: ${code}`);
        clearInterval(timerRef.current);
    };

    // --- Time Warp Educational Logic ---
    // Using real timeouts independent of simulation time
    useEffect(() => {
        if (isWarping && !factsScheduled && !phase.includes('fail')) {
            setFactsScheduled(true);

            // Sequence:
            // 0s: Start
            // 1s: Show Fact 1
            // 8s: Hide Fact 1 (Shown for 7s)
            // 9s: Show Fact 2
            // 16s: Hide Fact 2 (Shown for 7s)

            const t1 = setTimeout(() => setActiveFact(FUN_FACTS[0]), 1000);
            const t2 = setTimeout(() => setActiveFact(null), 8000);
            const t3 = setTimeout(() => setActiveFact(FUN_FACTS[1]), 9000);
            const t4 = setTimeout(() => setActiveFact(null), 16000);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
            };
        }
    }, [isWarping, factsScheduled, phase]);


    // --- Physics & Fail Checks ---
    useEffect(() => {
        if (phase !== 'ascent' && phase !== 'countdown') return;

        const interval = setInterval(() => {
            // Determine Warp State
            // Warp triggers 10s after Stage 2 ignition, until 70km altitude
            let warpActive = false;
            if (phase === 'ascent' && stage2IgnitionTime && (time - stage2IgnitionTime > 10) && altitude < 70000) {
                warpActive = true;
            }
            setIsWarping(warpActive);

            // Time Step (dt)
            const dt = warpActive ? 0.5 : 0.1;

            // Increment Time
            let newTime = 0;
            setTime(prev => {
                newTime = prev + dt;
                // Countdown -> Ascent transition check
                if (prev < 0 && newTime >= 0) {
                    setPhase('ascent');
                    addLog("LIFTOFF! WE HAVE LIFTOFF!");
                }
                return newTime;
            });

            if (phase !== 'ascent') return;

            // Trim Fail Check (Disabled during Warp for UX)
            if (!warpActive && Math.abs(thrustTrim) > 45) {
                failMission("TRIM_CRITICAL");
                return;
            }

            // Auto-Center Trim during Warp
            if (warpActive) {
                setThrustTrim(prev => prev * 0.9);
            }

            // --- Fuel Consumption Logic ---
            if (newTime > 0 && newTime < 25) {
                setSolidFuel(prev => Math.max(0, 100 - (newTime * 4)));
            }
            if (completedEvents.includes('ignite_stage2')) {
                setLiquidFuel(prev => Math.max(0, 100 - ((newTime - 28) * 0.8)));
            }

            // --- Physics Balancing ---
            let accel = 0;

            // Stage 1 Thrust
            if (newTime < 25) {
                accel += 13.5 + (newTime * 0.6);
            }

            // Stage 2 Thrust
            if (completedEvents.includes('ignite_stage2') && liquidFuel > 0) {
                accel += 18;
            }

            // Gravity & Drag
            let gravityDrag = 9.8;
            if (newTime > 30) gravityDrag = 8.5; // Lower drag at altitude
            accel -= gravityDrag;

            // Trim Penalty (drift adds drag)
            if (Math.abs(thrustTrim) > 15) accel -= 3;

            if (accel < 0) accel = 0;

            // Apply Physics proportional to dt
            setVelocity(v => v + (accel * dt));
            setAltitude(a => a + (velocity * dt));

            // Trim Drift (Only when not warping)
            if (!warpActive && Math.random() > 0.7) {
                setThrustTrim(prev => {
                    const drift = (Math.random() - 0.5) * 8;
                    return Math.min(50, Math.max(-50, prev + drift));
                });
            }

        }, 100);
        return () => clearInterval(interval);
    }, [phase, time, velocity, thrustTrim, liquidFuel, completedEvents, stage2IgnitionTime, altitude]);


    // --- Interaction Handlers ---

    const handleToggle = (key) => {
        if (phase !== 'pre-launch') return;
        setToggles(prev => {
            const next = { ...prev, [key]: !prev[key] };
            if (Object.values(next).every(v => v)) addLog("ALL CHECKS GREEN. READY FOR LAUNCH.");
            return next;
        });
    };

    const startCountdown = () => {
        if (!Object.values(toggles).every(v => v)) {
            addLog("ERROR: INCOMPLETE CHECKLIST");
            return;
        }
        setPhase('countdown');
        addLog("AUTO SEQUENCE START...");
    };

    const handleEventAction = (ev) => {
        if (ev.type === 'manual') {
            const diff = time - ev.time;

            // Check Windows
            if (diff < -ev.window) {
                failMission("TIMING_EARLY"); // Too early is still unsafe immediately
            } else if (diff > ev.window) {
                // Allow late click but it may fail dependencies later
                setCompletedEvents(prev => [...prev, ev.id]);
                addLog(`${ev.label} CONFIRMED`);

                if (ev.id === 'ignite_stage2') {
                    setStage2IgnitionTime(time);
                }

            } else {
                // Success (Inside Window)
                setCompletedEvents(prev => [...prev, ev.id]);
                addLog(`${ev.label} CONFIRMED`);

                if (ev.id === 'ignite_stage2') {
                    setStage2IgnitionTime(time);
                }
            }
        } else if (ev.type === 'altitude') {
            if (altitude > ev.minAlt * 1000) {
                // --- FINAL SUCCESS CHECK ---
                // Validate sequence before declaring victory
                const hasStraps = completedEvents.includes('sep_strapon');
                const hasStage1 = completedEvents.includes('sep_stage1');
                const hasStage2 = completedEvents.includes('ignite_stage2');

                if (!hasStraps) {
                    failMission("MISSED_STRAPS");
                    return;
                }
                if (!hasStage1) {
                    failMission("MISSED_STAGE1");
                    return;
                }
                if (!hasStage2) {
                    failMission("MISSED_STAGE2");
                    return;
                }

                setCompletedEvents(prev => [...prev, ev.id]);
                addLog("FAIRING JETTISON CONFIRMED");
                setTimeout(() => setShowSuccess(true), 2000);
            } else {
                failMission("FAIRING_EARLY");
            }
        }
    };

    const isEventActive = (ev) => {
        if (completedEvents.includes(ev.id)) return false;
        if (ev.type === 'manual') return Math.abs(time - ev.time) <= ev.window;
        if (ev.type === 'altitude') return altitude > ev.minAlt * 1000;
        return false;
    };

    const reset = () => {
        setPhase('pre-launch');
        setTime(-10);
        setAltitude(0);
        setVelocity(0);
        setThrustTrim(0);
        setSolidFuel(100);
        setLiquidFuel(100);
        setCompletedEvents([]);
        setStage2IgnitionTime(null);
        setIsWarping(false);
        setActiveFact(null);
        setFactsScheduled(false);
        setToggles({ retraction: false, water: false, fuel: false, guidance: false, power: false });
        setLogs(["SYSTEM RESET."]);
        setFailData(null);
        setShowSuccess(false);
    };

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-2 sm:p-4 select-none">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'); .font-pixel { font-family: 'Press Start 2P', monospace; }`}</style>

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

            {phase === 'fail' && failData && (
                <Modal
                    title={failData.title}
                    variant="danger"
                    onClose={reset}
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
                    onSecondary={reset}
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

                            {/* --- MISSION TRIVIA SECTION (NEW) --- */}
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

            {/* --- HEADER --- */}
            <div className="w-full max-w-5xl border-b-4 border-slate-800 pb-4 mb-4 flex justify-between items-end">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 flex items-center justify-center border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-lg">
                            <span className="text-white text-xl">←</span>
                        </button>
                    )}
                    <div className="bg-blue-600 p-2 border-2 border-white"><Rocket className="text-white" size={24} /></div>
                    <div>
                        <h1 className="text-lg font-pixel text-white">MISSION CONTROL</h1>
                        <p className="text-[10px] font-pixel text-blue-400">LEVEL 2 - LIVE TELEMETRY</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowBriefing(true)}
                        className="bg-slate-800 px-3 py-1 border border-slate-600 flex items-center gap-2 hover:bg-slate-700 transition-colors"
                    >
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[10px] font-pixel text-slate-300">MRD DOCS</span>
                    </button>
                    <div className={`px-3 py-1 border-2 text-[10px] font-pixel ${phase === 'fail' ? 'bg-red-900 border-red-500 text-red-200' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                        STATUS: {phase === 'fail' ? 'ABORTED' : phase.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- LEFT COLUMN: CAMERAS & MANUAL CONTROL --- */}
                <div className="lg:col-span-7 flex flex-col gap-4">

                    {/* VIEWPORT */}
                    <div className="bg-slate-900 border-4 border-slate-600 h-[350px] relative overflow-hidden shadow-2xl rounded-sm group">
                        <div className="absolute top-2 left-2 z-20 bg-black/60 px-2 py-1 border border-slate-500 text-[9px] font-pixel text-green-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> LIVE CAM
                        </div>

                        {/* WARP MODE OVERLAY */}
                        {isWarping && (
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-pulse">
                                <div className="text-cyan-400 font-pixel text-lg flex items-center gap-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                                    <FastForward size={24} fill="currentColor" /> TIME WARP
                                </div>
                                <div className="text-[9px] font-mono text-cyan-200 bg-black/50 px-2 py-1">ACCELERATING TO 70 KM</div>
                            </div>
                        )}

                        {/* --- FUN FACT POPUP (IN-GAME) --- */}
                        {activeFact && !phase.includes('fail') && (
                            // Repositioned to TOP LEFT to avoid center rocket. Portrait Aspect Ratio (max-w-[180px])
                            <div className="absolute top-12 left-4 z-40 w-[180px] animate-in slide-in-from-left-10 fade-in zoom-in-90 duration-500 origin-top-left">
                                <div className="bg-slate-900/95 border-2 border-cyan-500 p-3 shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-md relative overflow-hidden transform hover:scale-105 transition-transform">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 animate-pulse"></div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb size={16} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                        <span className="text-[10px] font-pixel text-cyan-300 leading-tight">{activeFact.title}</span>
                                    </div>
                                    <p className="text-[11px] text-white leading-snug font-sans">{activeFact.text}</p>
                                </div>
                            </div>
                        )}

                        {/* Background Sky */}
                        <div className={`absolute inset-0 w-full h-full transition-colors duration-[10s] ease-linear ${altitude > 40000 ? 'bg-black' : altitude > 10000 ? 'bg-indigo-950' : 'bg-sky-900'}`}>
                            {/* Stars */}
                            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

                            {/* Warp Streak Lines */}
                            {isWarping && (
                                <div className="absolute inset-0 z-0">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-[1px] bg-cyan-500/50"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: '-20%',
                                                height: '40%',
                                                animation: `fall 0.2s linear infinite`,
                                                animationDelay: `${Math.random() * 0.2}s`
                                            }}
                                        />
                                    ))}
                                    <style>{`@keyframes fall { from { transform: translateY(0); opacity: 0; } to { transform: translateY(800px); opacity: 1; } }`}</style>
                                </div>
                            )}
                        </div>

                        {/* Rocket Container */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 transition-transform duration-100 will-change-transform"
                            style={{
                                bottom: phase === 'pre-launch' ? '20px' : '30%',
                                transform: `translate(-50%, ${phase === 'countdown' ? (Math.random() * 2) + 'px' : '0px'}) rotate(${thrustTrim * 0.15}deg)`
                            }}
                        >
                            <div className="relative flex flex-col items-center">

                                {/* 3. PAYLOAD & FAIRING (Top) */}
                                <div className="relative z-30 w-12 flex justify-center">
                                    {completedEvents.includes('fairing') ? (
                                        // Exposed Payload
                                        <div className="w-8 h-12 bg-yellow-400 border-2 border-yellow-200 animate-pulse relative">
                                            <div className="w-6 h-8 border border-blue-900 bg-blue-500/50 grid grid-cols-2 gap-px">
                                                <div className="bg-blue-900/50"></div><div className="bg-blue-900/50"></div>
                                                <div className="bg-blue-900/50"></div><div className="bg-blue-900/50"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Fairing Cone
                                        <div className="w-8 h-16 bg-slate-200 border-2 border-slate-400 rounded-t-full relative overflow-hidden shadow-sm">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300 -translate-x-1/2"></div>
                                            <div className="absolute top-2 left-1 w-2 h-4 bg-white/40 rounded-full -rotate-12"></div>
                                            <div className="absolute bottom-0 w-full h-[1px] bg-slate-400"></div>
                                        </div>
                                    )}

                                    {/* Animated Fairing Halves */}
                                    <div className={`absolute top-0 left-1/2 -ml-4 w-4 h-16 bg-slate-200 border-l-2 border-t-2 border-slate-400 rounded-tl-full origin-bottom-left transition-all duration-[1500ms] ease-out z-10 ${completedEvents.includes('fairing') ? '-translate-x-12 -translate-y-4 -rotate-45 opacity-0 block' : 'translate-x-0 rotate-0 hidden'}`}></div>
                                    <div className={`absolute top-0 left-1/2 w-4 h-16 bg-slate-200 border-r-2 border-t-2 border-slate-400 rounded-tr-full origin-bottom-right transition-all duration-[1500ms] ease-out z-10 ${completedEvents.includes('fairing') ? 'translate-x-12 -translate-y-4 rotate-45 opacity-0 block' : 'translate-x-0 rotate-0 hidden'}`}></div>
                                </div>

                                {/* 2. STAGE 2 (Middle - Liquid) */}
                                <div className="relative z-20">
                                    <div className="w-8 h-16 bg-slate-300 border-2 border-slate-500 flex items-center justify-center overflow-hidden relative">
                                        <div className="w-full h-full bg-slate-400 opacity-20"></div>
                                        <div className="absolute top-2 w-full border-t border-slate-400/50"></div>
                                        <span className="text-[5px] font-pixel text-slate-500 -rotate-90">STAGE 2</span>

                                        {/* Engine Fire Stage 2 */}
                                        {completedEvents.includes('ignite_stage2') && liquidFuel > 0 && (
                                            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-4 h-12 bg-blue-400 blur-sm animate-pulse z-0 ${isWarping ? 'h-24 opacity-80' : 'h-12'}`}></div>
                                        )}
                                    </div>
                                    {/* Interstage Ring */}
                                    <div className="w-6 h-2 bg-slate-800 mx-auto"></div>
                                </div>

                                {/* 1. STAGE 1 (Bottom - Solid) - Animated Separation */}
                                <div className={`relative z-10 transition-all duration-[2000ms] ease-in ${completedEvents.includes('sep_stage1') ? 'translate-y-40 opacity-0' : 'translate-y-0'}`}>
                                    {/* Core Stage */}
                                    <div className="w-10 h-24 bg-slate-200 border-2 border-slate-400 relative">
                                        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 -rotate-90 text-[6px] font-pixel text-slate-500 whitespace-nowrap">PSLV CORE</span>
                                        <div className="absolute top-4 w-full h-1 bg-black/10"></div>
                                        <div className="absolute bottom-4 w-full h-1 bg-black/10"></div>

                                        {/* Left Booster */}
                                        <div className={`absolute bottom-0 -left-3 w-2 h-20 bg-red-700 border border-red-900 rounded-t-sm transition-all duration-[1500ms] ease-out ${completedEvents.includes('sep_strapon') ? '-translate-x-8 translate-y-10 -rotate-12 opacity-0' : 'translate-x-0'}`}></div>

                                        {/* Right Booster */}
                                        <div className={`absolute bottom-0 -right-3 w-2 h-20 bg-red-700 border border-red-900 rounded-t-sm transition-all duration-[1500ms] ease-out ${completedEvents.includes('sep_strapon') ? 'translate-x-8 translate-y-10 rotate-12 opacity-0' : 'translate-x-0'}`}></div>
                                    </div>

                                    {/* Main Engine Flames */}
                                    {(phase === 'ascent' || (phase === 'countdown' && time > -3)) && !completedEvents.includes('sep_stage1') && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-24 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent blur-sm animate-pulse origin-top transform scale-y-110"></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ground */}
                        {altitude < 500 && (
                            <div className="absolute bottom-0 w-full h-8 bg-slate-800 border-t-4 border-slate-600" style={{ transform: `translateY(${altitude}px)` }} />
                        )}
                    </div>

                    {/* MANUAL OVERRIDE CONSOLE */}
                    <div className="bg-slate-800 border-4 border-slate-600 p-4 relative shadow-lg">
                        <div className="absolute -top-3 left-4 bg-slate-600 px-2 text-[10px] font-pixel text-white border border-slate-500">FLIGHT CONTROLS</div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Trim Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-pixel text-slate-400">
                                    <span>L-YAW</span>
                                    <span className={Math.abs(thrustTrim) > 20 ? 'text-red-500 animate-pulse' : 'text-green-500'}>
                                        {thrustTrim > 0 ? 'R' : 'L'} {Math.abs(Math.round(thrustTrim))}%
                                    </span>
                                    <span>R-YAW</span>
                                </div>
                                <div className="relative h-8 w-full">
                                    <input
                                        type="range" min="-50" max="50"
                                        value={thrustTrim}
                                        onChange={(e) => setThrustTrim(Number(e.target.value))}
                                        disabled={phase !== 'ascent'}
                                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full h-2 bg-slate-900 absolute top-3 rounded-full overflow-hidden">
                                        <div className="w-1/3 h-full bg-red-900/50 absolute left-0"></div>
                                        <div className="w-1/3 h-full bg-green-900/50 absolute left-1/3"></div>
                                        <div className="w-1/3 h-full bg-red-900/50 absolute right-0"></div>
                                    </div>
                                    <div
                                        className={`absolute top-0 h-8 w-4 bg-blue-500 border-2 border-white shadow-lg pointer-events-none transition-all ${isWarping ? 'duration-1000' : 'duration-75'}`}
                                        style={{ left: `${((thrustTrim + 50) / 100) * 95}%` }} // Approximate centering
                                    ></div>
                                </div>
                                <div className="text-[9px] text-slate-500 text-center font-mono">
                                    {isWarping ? <span className="text-cyan-400 animate-pulse">WARP STABILIZATION ENGAGED</span> : "MAINTAIN GREEN ZONE"}
                                </div>
                            </div>

                            {/* Launch Button */}
                            <div className="flex items-end">
                                {phase === 'pre-launch' ? (
                                    <PixelButton
                                        onClick={startCountdown}
                                        className="w-full h-14"
                                        variant={Object.values(toggles).every(v => v) ? 'success' : 'disabled'}
                                    >
                                        INITIATE LAUNCH
                                    </PixelButton>
                                ) : (
                                    <div className="w-full h-14 bg-black border-2 border-slate-700 flex items-center justify-center">
                                        <span className="text-[10px] font-pixel text-slate-600 animate-pulse">CONTROLS LOCKED</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SYSTEMS & EVENTS --- */}
                <div className="lg:col-span-5 flex flex-col gap-4">

                    {/* TELEMETRY READOUT */}
                    <div className="bg-black border-4 border-slate-700 p-4 font-mono text-green-500 shadow-lg relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-20"><Activity size={48} /></div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 border-b border-slate-800 pb-2">
                            <div>
                                <span className="text-[9px] text-slate-500 block">MISSION CLOCK</span>
                                <span className={`text-xl font-bold tracking-widest ${isWarping ? 'text-cyan-400' : ''}`}>
                                    T{time >= 0 ? '+' : ''}{Math.abs(time).toFixed(2)}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] text-slate-500 block">ALTITUDE</span>
                                <span className="text-xl font-bold">{(altitude / 1000).toFixed(2)} <span className="text-sm font-normal">km</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                                <span className="text-slate-500 block">VELOCITY</span>
                                <span className="text-white">{velocity.toFixed(0)} m/s</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 block">APOAPSIS</span>
                                <span className="text-white">{(altitude / 1000 * 1.5).toFixed(2)} km</span>
                            </div>
                        </div>
                    </div>

                    {/* INTERFACE PANEL */}
                    <div className="bg-slate-800 border-4 border-slate-600 p-4 flex-1 flex flex-col">

                        {/* PRE-LAUNCH CHECKLIST */}
                        {phase === 'pre-launch' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-[10px] font-pixel text-blue-300 mb-3 border-b border-slate-600 pb-2 flex justify-between">
                                    <span>SYSTEM CONFIG</span>
                                    <span>{Object.values(toggles).filter(Boolean).length}/5</span>
                                </div>
                                <div className="space-y-2">
                                    <ToggleSwitch label="WATER INJECTION" isOn={toggles.water} onToggle={() => handleToggle('water')} />
                                    <ToggleSwitch label="INTERNAL POWER" isOn={toggles.power} onToggle={() => handleToggle('power')} />
                                    <ToggleSwitch label="SUPPORT RETRACTION" isOn={toggles.retraction} onToggle={() => handleToggle('retraction')} />
                                    <ToggleSwitch label="FLIGHT GUIDANCE" isOn={toggles.guidance} onToggle={() => handleToggle('guidance')} />
                                    <ToggleSwitch label="FUEL VALVES" isOn={toggles.fuel} onToggle={() => handleToggle('fuel')} />
                                </div>
                            </div>
                        )}

                        {/* FLIGHT EVENT SEQUENCER */}
                        {(phase === 'countdown' || phase === 'ascent') && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
                                <div className="text-[10px] font-pixel text-amber-300 mb-3 border-b border-slate-600 pb-2">FLIGHT PLAN</div>
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {FLIGHT_EVENTS.map((ev, i) => {
                                        const isActive = isEventActive(ev);
                                        const isDone = completedEvents.includes(ev.id);
                                        const isFuture = !isActive && !isDone;

                                        return (
                                            <div key={ev.id} className="flex items-center gap-2">
                                                <div className={`w-1 h-full min-h-[30px] ${isDone ? 'bg-green-500' : isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                                <button
                                                    onClick={() => handleEventAction(ev)}
                                                    disabled={!isActive}
                                                    className={`
                                                      flex-1 text-left p-2 border-2 relative overflow-hidden transition-all
                                                      ${isDone
                                                            ? 'bg-slate-900 border-slate-800 opacity-60'
                                                            : isActive
                                                                ? 'bg-amber-600 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-500'
                                                                : 'bg-slate-700 border-slate-600 text-slate-500'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-center relative z-10">
                                                        <div>
                                                            <div className={`text-[9px] font-pixel ${isDone ? 'text-green-500 line-through' : isActive ? 'text-white' : 'text-slate-400'}`}>{ev.label}</div>
                                                            {isActive && <div className="text-[8px] font-mono text-amber-200">CLICK TO EXECUTE</div>}
                                                        </div>
                                                        {isActive && <AlertTriangle size={12} className="text-white animate-bounce" />}
                                                        {isDone && <Check size={12} className="text-green-500" />}
                                                    </div>

                                                    {/* Timer Bar for Active Manual Events */}
                                                    {isActive && ev.type === 'manual' && (
                                                        <div className="absolute bottom-0 left-0 h-1 bg-white animate-[width_5s_linear]" style={{ width: '100%', animationDuration: `${ev.window}s` }}></div>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LOGS */}
                    <div className="bg-black border-2 border-slate-600 h-28 p-2 font-mono text-[9px] text-green-500 overflow-hidden flex flex-col shadow-inner">
                        {logs.map((line, i) => (
                            <div key={i} className="mb-1 opacity-90 border-b border-green-900/30 pb-1">{line}</div>
                        ))}
                    </div>

                </div>
            </div>

            {/* JSON DEFINITION BLOCK FOR EXPORT */}
            <script type="application/json" id="level-2-events">
                {JSON.stringify({
                    events: [
                        { id: "strap_on_sep", time: 12, window: 3 },
                        { id: "stage1_sep", time: 25, window: 3 },
                        { id: "stage2_ignite", time: 28, window: 3 },
                        { id: "fairing", altitude_km: 80 }
                    ]
                })}
            </script>
        </div>
    );
}