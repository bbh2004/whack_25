
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Satellite, Radio, RotateCw, Navigation,
    AlertTriangle, CheckCircle, Flame, Battery, Signal,
    Crosshair, Zap, RefreshCw, Power, Activity, XCircle, Play
} from 'lucide-react';

// --- Constants ---
const TOTAL_DISTANCE = 100; // % to Mars
const CRUISE_SPEED = 0.05; // Slower for better gameplay
const PROBLEM_TYPES = ['TRAJECTORY', 'SIGNAL', 'ATTITUDE', 'SENSOR'];

// Problem Definitions
const PROBLEMS = {
    TRAJECTORY: {
        id: 'traj',
        title: 'TRAJECTORY DRIFT',
        desc: 'Spacecraft drifting off-course. Execute TCM.',
        icon: Crosshair
    },
    SIGNAL: {
        id: 'sig',
        title: 'SIGNAL LOSS',
        desc: 'HGA Misaligned. Realign antenna to Earth.',
        icon: Signal
    },
    ATTITUDE: {
        id: 'att',
        title: 'ATTITUDE UNSTABLE',
        desc: 'Reaction wheels saturated. Dump momentum.',
        icon: RotateCw
    },
    SENSOR: {
        id: 'sens',
        title: 'STAR TRACKER LOST',
        desc: 'Navigation blind. Switch to backup sensor.',
        icon: Navigation
    }
};

// --- Helper Components ---

const PanelButton = ({ label, onClick, active, disabled, color = "blue", className = "" }) => {
    const colors = {
        blue: "bg-blue-700 border-blue-900 hover:bg-blue-600",
        red: "bg-red-700 border-red-900 hover:bg-red-600",
        green: "bg-emerald-700 border-emerald-900 hover:bg-emerald-600",
        amber: "bg-amber-600 border-amber-800 hover:bg-amber-500",
        gray: "bg-slate-700 border-slate-900 hover:bg-slate-600"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative px-2 py-2 sm:px-4 sm:py-3 border-b-4 border-r-4 active:border-0 active:translate-y-1 active:translate-x-1
        font-pixel text-[10px] text-white uppercase tracking-wider transition-all
        ${disabled ? "bg-slate-800 border-slate-900 opacity-50 cursor-not-allowed" : colors[color]}
        ${active ? "brightness-125 border-t-2" : ""}
        ${className}
      `}
        >
            {label}
        </button>
    );
};

const CRTOverlay = () => (
    <>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-16 pointer-events-none z-10" />
    </>
);

export default function Level6MarsTransfer({ onBack, onNextLevel }) {
    // --- Game State ---
    const [hasStarted, setHasStarted] = useState(false); // New Start State
    const [progress, setProgress] = useState(0);
    const [fuel, setFuel] = useState(100);
    const [signalStrength, setSignalStrength] = useState(100);
    const [battery, setBattery] = useState(100);
    const [activeProblem, setActiveProblem] = useState(null);
    const [missionStatus, setMissionStatus] = useState('cruising');
    const [message, setMessage] = useState("AWAITING LAUNCH COMMAND...");

    // --- Problem Specific State ---
    const [driftX, setDriftX] = useState(0);
    const [driftY, setDriftY] = useState(0);
    const [antennaAngle, setAntennaAngle] = useState(50);
    const [targetAngle, setTargetAngle] = useState(50);
    const [spinValue, setSpinValue] = useState(0);
    const [sensorStep, setSensorStep] = useState(0);
    const [problemQueue, setProblemQueue] = useState([]); // Pre-generated problem queue
    const [problemIndex, setProblemIndex] = useState(0); // Current problem index
    const [problemTriggers, setProblemTriggers] = useState([]); // Progress points to trigger problems

    const requestRef = useRef();

    // --- Game Loop ---
    const updateGame = useCallback(() => {
        // Only run loop if game has started and not ended
        if (!hasStarted || missionStatus === 'failed' || missionStatus === 'success') return;

        // Continuous Drain
        setBattery(b => {
            // 0.8x slower drain rate for better gameplay
            const newBat = Math.max(0, b - 0.01);
            if (newBat <= 0) {
                failMission("POWER FAILURE - BATTERY DEAD");
                return 0;
            }
            return newBat;
        });

        // Global Failure Checks
        if (fuel <= 0) {
            failMission("FUEL DEPLETED - JETS DRY");
            return;
        }
        if (signalStrength <= 0) {
            failMission("COMMUNICATION LOST - LINK SEVERED");
            return;
        }

        // Progress
        if (!activeProblem) {
            setProgress(p => {
                if (p >= TOTAL_DISTANCE) {
                    setMissionStatus('success');
                    setMessage("MARS ORBIT INSERTION REACHED. MISSION ACCOMPLISHED.");
                    return 100;
                }
                return p + CRUISE_SPEED;
            });

            // Check if we should trigger next problem from queue
            const nextTrigger = problemTriggers[problemIndex];
            if (nextTrigger && progress >= nextTrigger && problemIndex < problemQueue.length) {
                triggerQueuedProblem();
            }
        } else {
            // Penalties while problem is active (0.8x slower)
            if (activeProblem.id === 'sig') {
                setSignalStrength(s => Math.max(0, s - 0.1));
            }

            // Attitude problem consumes extra battery (0.8x slower)
            if (activeProblem.id === 'att') {
                setBattery(b => Math.max(0, b - 0.03));
            }
        }

        // Continue Loop
        requestRef.current = requestAnimationFrame(updateGame);

    }, [activeProblem, progress, missionStatus, fuel, battery, signalStrength, hasStarted]);

    useEffect(() => {
        if (hasStarted) {
            requestRef.current = requestAnimationFrame(updateGame);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [updateGame, hasStarted]);

    // --- Logic ---

    // Generate problem queue: 4-6 problems, each type at least once, no consecutive duplicates
    const generateProblemQueue = () => {
        const numProblems = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
        const queue = [];

        // First, ensure each type appears at least once (shuffle the 4 types)
        const shuffledTypes = [...PROBLEM_TYPES].sort(() => Math.random() - 0.5);
        queue.push(...shuffledTypes);

        // Add remaining problems (random, but no consecutive duplicates)
        while (queue.length < numProblems) {
            const lastType = queue[queue.length - 1];
            const availableTypes = PROBLEM_TYPES.filter(t => t !== lastType);
            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            queue.push(randomType);
        }

        // Verify no consecutive duplicates (shuffle if needed)
        for (let i = 1; i < queue.length; i++) {
            if (queue[i] === queue[i - 1]) {
                // Swap with a later non-duplicate
                for (let j = i + 1; j < queue.length; j++) {
                    if (queue[j] !== queue[i - 1] && queue[j] !== queue[i + 1]) {
                        [queue[i], queue[j]] = [queue[j], queue[i]];
                        break;
                    }
                }
            }
        }

        // Generate evenly spaced trigger points (between 10% and 85%)
        const triggers = [];
        const spacing = 75 / numProblems; // Spread across 75% of journey
        for (let i = 0; i < numProblems; i++) {
            const base = 10 + (i * spacing) + (spacing / 2);
            const jitter = (Math.random() - 0.5) * spacing * 0.5; // Add some randomness
            triggers.push(Math.round(base + jitter));
        }

        return { queue, triggers };
    };

    const startGame = () => {
        const { queue, triggers } = generateProblemQueue();
        setProblemQueue(queue);
        setProblemTriggers(triggers);
        setProblemIndex(0);
        setHasStarted(true);
        setMessage("CRUISE PHASE INITIATED. SYSTEMS NOMINAL.");
    };

    const resetLevel = () => {
        setHasStarted(false);
        setProgress(0);
        setFuel(100);
        setSignalStrength(100);
        setBattery(100);
        setActiveProblem(null);
        setMissionStatus('cruising');
        setMessage("AWAITING LAUNCH COMMAND...");
        setDriftX(0); setDriftY(0);
        setAntennaAngle(50); setTargetAngle(50);
        setSpinValue(0);
        setSensorStep(0);
        setProblemQueue([]);
        setProblemTriggers([]);
        setProblemIndex(0);
    };

    const triggerQueuedProblem = () => {
        if (problemIndex >= problemQueue.length) return;

        const problemType = problemQueue[problemIndex];
        const problem = PROBLEMS[problemType];

        setProblemIndex(prev => prev + 1);
        setActiveProblem(problem);
        setMissionStatus('solving');
        setMessage(`WARNING: ${problem.title}`);

        // Init Problem State
        if (problem.id === 'traj') {
            setDriftX((Math.random() > 0.5 ? 40 : -40));
            setDriftY((Math.random() > 0.5 ? 40 : -40));
        } else if (problem.id === 'sig') {
            setSignalStrength(40);
            setAntennaAngle(Math.floor(Math.random() * 100));
            setTargetAngle(Math.floor(Math.random() * 80) + 10);
        } else if (problem.id === 'att') {
            setSpinValue(Math.random() > 0.5 ? 1 : -1);
        } else if (problem.id === 'sens') {
            setSensorStep(0);
        }
    };

    const resolveProblem = () => {
        setActiveProblem(null);
        setMissionStatus('cruising');
        setMessage("PROBLEM RESOLVED. RESUMING CRUISE.");
        if (signalStrength < 100) setSignalStrength(100);
    };

    const failMission = (reason) => {
        setMissionStatus('failed');
        setActiveProblem(null);
        setMessage(reason);
        cancelAnimationFrame(requestRef.current);
    };

    // --- Interaction Handlers ---

    const handleTCMBurn = (direction) => {
        if (activeProblem?.id !== 'traj') return;
        if (fuel <= 0) { failMission("FUEL DEPLETED"); return; }

        const step = 20; // Step size
        let dx = 0;
        let dy = 0;

        // FIX: Correct coordinate directions for CSS transform
        // X: Negative = Left, Positive = Right
        // Y: Negative = Up, Positive = Down
        if (direction === 'UP') dy = -step;
        if (direction === 'DOWN') dy = step;
        if (direction === 'LEFT') dx = -step;
        if (direction === 'RIGHT') dx = step;

        setFuel(f => Math.max(0, f - 1)); // Fuel cost

        // Check with new values
        // Using current state to calculate next position
        // We clamp the values to keep the dot visible within the radar circle (radius ~85px)
        const newX = Math.max(-85, Math.min(85, driftX + dx));
        const newY = Math.max(-85, Math.min(85, driftY + dy));

        setDriftX(newX);
        setDriftY(newY);

        // Success zone is radius 15px (30px diameter)
        if (Math.abs(newX) < 15 && Math.abs(newY) < 15) {
            resolveProblem();
        }
    };

    const handleAntennaAdjust = (val) => {
        if (activeProblem?.id !== 'sig') return;
        setAntennaAngle(val);

        if (Math.abs(val - targetAngle) < 10) {
            setSignalStrength(Math.min(100, 40 + (10 - Math.abs(val - targetAngle)) * 6));
        } else {
            setSignalStrength(40);
        }
    };

    const handleTransmitterBoost = () => {
        if (activeProblem?.id !== 'sig') return;

        if (Math.abs(antennaAngle - targetAngle) < 5) {
            resolveProblem();
        } else {
            setMessage("ANTENNA NOT ALIGNED! CANNOT BOOST.");
            setBattery(b => Math.max(0, b - 5)); // Penalty
        }
    };

    const handleMomentumDump = (thruster) => {
        if (activeProblem?.id !== 'att') return;

        const required = spinValue > 0 ? 'LEFT' : 'RIGHT';

        if (thruster === required) {
            setSpinValue(0);
            setFuel(f => Math.max(0, f - 2));
            setTimeout(resolveProblem, 500);
        } else {
            setMessage("WRONG THRUSTER! SPIN INCREASING.");
            setFuel(f => Math.max(0, f - 5));
            setSpinValue(prev => prev * 1.5);
        }
    };

    const handleSensorAction = (action) => {
        if (activeProblem?.id !== 'sens') return;

        if (action === 'BACKUP' && sensorStep === 0) {
            setSensorStep(1);
            setMessage("BACKUP SENSOR ONLINE. REACQUIRING...");
        } else if (action === 'REACQUIRE' && sensorStep === 1) {
            setSensorStep(2);
            setTimeout(resolveProblem, 1000);
        }
    };

    // --- Visual Renderers ---

    const renderViewport = () => {
        return (
            <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">

                {/* Forward Moving Starfield (Warp Effect) */}
                {hasStarted && missionStatus === 'cruising' && (
                    <>
                        <div className="absolute inset-0 opacity-80 animate-star-warp-1 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                        <div className="absolute inset-0 opacity-60 animate-star-warp-2 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                    </>
                )}
                {/* Static stars for paused/failed state */}
                {(!hasStarted || missionStatus !== 'cruising') && (
                    <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                )}

                {/* Mars (Approaching from Center) */}
                {hasStarted && (
                    <div
                        className="absolute bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all duration-300 z-10"
                        style={{
                            width: `${Math.min(200, 4 + progress * 2)}px`,
                            height: `${Math.min(200, 4 + progress * 2)}px`,
                            left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                            opacity: Math.max(0.1, progress / 100)
                        }}
                    />
                )}

                {/* --- PROBLEM VISUALS OVERLAY --- */}

                {/* 1. Trajectory Drift Visual */}
                {activeProblem?.id === 'traj' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="relative w-64 h-64 border-2 border-red-500/30 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-red-500 font-pixel text-[10px] bg-black px-2 border border-red-900">TARGET PATH</div>
                            <Crosshair className="text-red-500/50 absolute" size={180} strokeWidth={1} />

                            {/* The Drifting Point */}
                            <div
                                className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_yellow] transition-all duration-200 ease-out border-2 border-white"
                                style={{ transform: `translate(${driftX}px, ${driftY}px)` }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-yellow-300 font-pixel whitespace-nowrap bg-black/50 px-1 rounded">OFFSET</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Signal Static Visual */}
                {activeProblem?.id === 'sig' && (
                    <div className="absolute inset-0 bg-white mix-blend-overlay opacity-10 animate-noise pointer-events-none flex items-center justify-center z-20">
                        <div className="text-red-500 font-pixel text-4xl animate-pulse tracking-widest border-4 border-red-500 p-4 bg-black/50">
                            NO CARRIER
                        </div>
                    </div>
                )}

                {/* 3. Attitude Spin Visual */}
                {activeProblem?.id === 'att' && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-[2000ms] z-20 ${spinValue !== 0 ? 'rotate-12 scale-110' : ''}`}>
                        <div className="border-4 border-amber-500 w-[80%] h-[80%] rounded-lg flex items-center justify-center">
                            <RotateCw className={`text-amber-500 w-32 h-32 ${spinValue > 0 ? 'animate-spin' : 'animate-spin-reverse'}`} />
                        </div>
                    </div>
                )}

                {/* 4. Sensor Blind Visual */}
                {activeProblem?.id === 'sens' && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center font-mono text-green-500 z-20">
                        {sensorStep === 0 && <div className="text-red-500 blink">★ STAR TRACKER ERROR ★</div>}
                        {sensorStep === 1 && <div className="text-yellow-400">BACKUP SENSOR CALIBRATING...</div>}
                        {sensorStep === 2 && <div className="text-green-400">TARGET ACQUIRED</div>}
                    </div>
                )}

                {/* START SCREEN OVERLAY */}
                {!hasStarted && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                        <div className="bg-slate-900 border-4 border-blue-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                            <Satellite size={48} className="text-blue-400 mx-auto mb-4 animate-bounce" />
                            <h2 className="text-xl font-pixel text-white mb-2">MARS TRANSFER MISSION</h2>
                            <p className="text-slate-400 font-mono text-xs mb-6 max-w-xs text-center mx-auto">
                                Prepare for 300 days of deep space cruise. Monitor systems and correct anomalies.
                            </p>
                            <p className="text-white font-pixel text-sm mb-6 text-center">ARE YOU READY FOR MARS?</p>
                            <button
                                onClick={startGame}
                                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-pixel text-xs border-b-4 border-green-800 active:border-0 active:translate-y-1 transition-all mx-auto block"
                            >
                                LAUNCH MISSION
                            </button>
                        </div>
                    </div>
                )}

                {/* Cockpit Frame (Simulated) */}
                <div className="absolute inset-0 border-[16px] border-slate-800 pointer-events-none rounded-t-2xl z-20 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"></div>

                {/* HUD Overlay */}
                {hasStarted && (
                    <div className="absolute top-4 left-4 z-30 font-pixel text-green-500 text-xs">
                        POS: INTERPLANETARY<br />
                        DEST: MARS<br />
                        DIST: {(225 - progress * 2.25).toFixed(1)}M km
                    </div>
                )}
                <CRTOverlay />
            </div>
        );
    };

    const renderControlPanel = () => {
        if (!activeProblem) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Activity className="animate-pulse text-green-500" size={32} />
                    <div className="font-pixel text-xs">SYSTEMS MONITORING...</div>
                    <div className="font-mono text-[10px] text-slate-600">AWAITING TELEMETRY EVENTS</div>
                </div>
            );
        }

        switch (activeProblem.id) {
            case 'traj':
                return (
                    <div className="flex flex-col h-full gap-2">
                        <div className="text-[10px] text-blue-300 font-pixel mb-1">CORRECTION BURN VECTOR</div>
                        <div className="grid grid-cols-3 gap-1 flex-1">
                            <div />
                            <PanelButton label="▲ PITCH UP" onClick={() => handleTCMBurn('UP')} />
                            <div />
                            <PanelButton label="◀ YAW L" onClick={() => handleTCMBurn('LEFT')} />
                            <div className="bg-slate-900 flex items-center justify-center rounded border border-slate-700">
                                <Crosshair size={20} className="text-red-500" />
                            </div>
                            <PanelButton label="YAW R ▶" onClick={() => handleTCMBurn('RIGHT')} />
                            <div />
                            <PanelButton label="▼ PITCH DN" onClick={() => handleTCMBurn('DOWN')} />
                            <div />
                        </div>
                    </div>
                );
            case 'sig':
                return (
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex justify-between text-[10px] font-pixel text-slate-400 mb-1">
                                <span>ANTENNA AZIMUTH</span>
                                <span className={Math.abs(antennaAngle - targetAngle) < 5 ? "text-green-400" : "text-red-400"}>{antennaAngle}°</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                value={antennaAngle}
                                onChange={(e) => handleAntennaAdjust(Number(e.target.value))}
                                className="w-full h-4 bg-slate-800 accent-green-500 appearance-none border border-slate-600"
                            />
                            <div className="relative w-full h-2 mt-1 bg-slate-900 rounded">
                                <div className="absolute h-full w-1 bg-green-500/50" style={{ left: `${targetAngle}%` }} />
                            </div>
                        </div>
                        <PanelButton
                            label="BOOST SIGNAL POWER"
                            color={Math.abs(antennaAngle - targetAngle) < 5 ? "green" : "gray"}
                            onClick={handleTransmitterBoost}
                        />
                    </div>
                );
            case 'att':
                return (
                    <div className="flex flex-col h-full justify-around">
                        <div className="bg-amber-900/30 border border-amber-600 p-2 text-center text-amber-400 font-pixel text-[10px] animate-pulse">
                            ⚠ MOMENTUM SATURATION ⚠
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <PanelButton label="DUMP LEFT (RW-A)" onClick={() => handleMomentumDump('LEFT')} color="amber" />
                            <PanelButton label="DUMP RIGHT (RW-B)" onClick={() => handleMomentumDump('RIGHT')} color="amber" />
                        </div>
                        <div className="text-[9px] text-center text-slate-400">FIRE OPPOSITE TO SPIN</div>
                    </div>
                );
            case 'sens':
                return (
                    <div className="flex flex-col h-full justify-center gap-3 px-8">
                        <PanelButton
                            label="1. SWITCH TO BACKUP"
                            onClick={() => handleSensorAction('BACKUP')}
                            disabled={sensorStep !== 0}
                            color={sensorStep === 0 ? "blue" : "gray"}
                        />
                        <PanelButton
                            label="2. REACQUIRE STARS"
                            onClick={() => handleSensorAction('REACQUIRE')}
                            disabled={sensorStep !== 1}
                            color={sensorStep === 1 ? "green" : "gray"}
                        />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-2 font-sans select-none relative">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        @keyframes scan { from { background-position: 0 0; } to { background-position: 0 4px; } }
        @keyframes star-warp-1 { 
            0% { transform: scale(0.5); opacity: 0; } 
            50% { opacity: 1; }
            100% { transform: scale(2); opacity: 0; } 
        }
        @keyframes star-warp-2 { 
            0% { transform: scale(0.5); opacity: 0; } 
            25% { opacity: 1; }
            100% { transform: scale(3); opacity: 0; } 
        }
        .animate-star-warp-1 { animation: star-warp-1 3s ease-in infinite; }
        .animate-star-warp-2 { animation: star-warp-2 4s ease-out infinite; animation-delay: 1.5s; }
        .animate-spin-reverse { animation: spin 1s linear infinite reverse; }
        .blink { animation: pulse 0.5s infinite; }
      `}</style>

            {/* Main Bezel */}
            <div className="w-full max-w-4xl bg-slate-800 p-3 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-slate-700 ring-4 ring-black relative z-10">

                {/* Header */}
                <div className="flex justify-between items-center mb-3 px-2">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 flex items-center justify-center border border-slate-500 hover:border-slate-400 transition-colors rounded"
                                title="Back to Level Selection"
                            >
                                <span className="text-white text-lg">←</span>
                            </button>
                        )}
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                        <h1 className="text-slate-200 font-pixel text-xs sm:text-sm">MOM FLIGHT DECK</h1>
                    </div>
                    <div className="font-mono text-green-500 text-sm">MET: T+ 142D 04H</div>
                </div>

                {/* 1. TOP VIEWPORT */}
                <div className="h-[50vh] sm:h-[60vh] bg-black rounded-t-lg border-x-4 border-t-4 border-slate-600 relative shadow-inner overflow-hidden">
                    {renderViewport()}

                    {/* Master Alarm Overlay */}
                    {activeProblem && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-pixel text-xs px-4 py-2 border-2 border-white animate-pulse z-40 shadow-lg">
                            ⚠ MASTER ALARM: {activeProblem.title} ⚠
                        </div>
                    )}
                </div>

                {/* 2. BOTTOM DASHBOARD */}
                <div className="h-48 bg-slate-900 border-4 border-slate-600 rounded-b-lg p-3 grid grid-cols-12 gap-3 relative shadow-2xl">

                    {/* Left: Status */}
                    <div className="col-span-3 bg-black border-2 border-slate-700 p-2 flex flex-col justify-between">
                        <div>
                            <div className="text-[9px] text-slate-500 font-pixel mb-1">FUEL</div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full" style={{ width: `${fuel}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-500 font-pixel mb-1">SIGNAL</div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${signalStrength < 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${signalStrength}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-500 font-pixel mb-1">BATTERY</div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${battery < 30 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${battery}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Center: Interaction */}
                    <div className="col-span-6 bg-slate-800 border-2 border-slate-600 p-3 relative shadow-inner">
                        {/* Panel Screws */}
                        <div className="absolute top-1 left-1 text-slate-600">+</div>
                        <div className="absolute top-1 right-1 text-slate-600">+</div>
                        <div className="absolute bottom-1 left-1 text-slate-600">+</div>
                        <div className="absolute bottom-1 right-1 text-slate-600">+</div>

                        {renderControlPanel()}
                    </div>

                    {/* Right: Message Log */}
                    <div className="col-span-3 bg-black border-2 border-slate-700 p-2 font-mono text-[9px] text-green-400 leading-tight overflow-hidden flex flex-col justify-end">
                        <div className="opacity-50 mb-1">{`> SYS_CHECK: OK`}</div>
                        <div className="opacity-70 mb-1">{`> TRAJ: NOMINAL`}</div>
                        <div className="text-white bg-green-900/30 p-1 border-l-2 border-green-500 animate-pulse">
                            {`> ${message}`}
                        </div>
                    </div>

                </div>

                {/* Global Progress Bar */}
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-pixel text-blue-400">EARTH</span>
                    <div className="flex-1 h-3 bg-slate-900 rounded-full border border-slate-700 relative">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                        <Satellite className="absolute top-1/2 -translate-y-1/2 text-white drop-shadow-md transition-all duration-300" size={16} style={{ left: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-pixel text-red-500">MARS</span>
                </div>

            </div>

            {/* --- OVERLAYS --- */}

            {/* SUCCESS OVERLAY */}
            {missionStatus === 'success' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-green-900/90 border-4 border-green-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                        <CheckCircle size={64} className="text-white mx-auto mb-4" />
                        <h2 className="text-3xl font-pixel text-white mb-2">MISSION ACCOMPLISHED</h2>
                        <p className="text-green-300 font-mono mb-6">MARS ORBIT INSERTION SUCCESSFUL</p>
                        <p className="text-yellow-300 font-pixel text-sm mb-6">🎉 ALL LEVELS COMPLETE! 🎉</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={resetLevel}
                                className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-pixel text-xs border-b-4 border-slate-800 active:border-0 active:translate-y-1"
                            >
                                PLAY AGAIN
                            </button>
                            <button
                                onClick={onBack}
                                className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-pixel text-xs border-b-4 border-green-900 active:border-0 active:translate-y-1"
                            >
                                RETURN TO MENU
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAILURE OVERLAY */}
            {missionStatus === 'failed' && (
                <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-red-900/90 border-4 border-red-500 p-8 rounded-xl text-center animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                        <AlertTriangle size={64} className="text-white mx-auto mb-4" />
                        <h2 className="text-3xl font-pixel text-white mb-2">MISSION FAILED</h2>
                        <p className="text-red-300 font-mono mb-6 uppercase">{message}</p>
                        <button
                            onClick={resetLevel}
                            className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-pixel text-xs border-b-4 border-red-900 active:border-0 active:translate-y-1"
                        >
                            RETRY
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}