
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Satellite, Flame, Rocket,
    CheckCircle, AlertTriangle, RefreshCw, XCircle, Crosshair, Navigation
} from 'lucide-react';

// --- Configuration ---
const TARGET_VELOCITY = 11.2; // km/s (Escape velocity for TMI)
const START_VELOCITY = 10.1; // km/s (Parking orbit velocity)
const SUCCESS_MIN = 11.1;
const SUCCESS_MAX = 11.3;

// --- Components ---

const GameButton = ({ children, className = "", variant = "primary", disabled, onClick, ...props }) => {
    const baseStyles = "relative inline-flex items-center justify-center px-4 py-3 font-pixel text-xs sm:text-sm uppercase tracking-widest transition-all focus:outline-none select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1",
        danger: "bg-red-500 text-white hover:bg-red-400 border-b-4 border-red-800 active:border-b-0 active:translate-y-1",
        success: "bg-emerald-500 text-white hover:bg-emerald-400 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1",
        warning: "bg-amber-500 text-white hover:bg-amber-400 border-b-4 border-amber-800 active:border-b-0 active:translate-y-1",
        neutral: "bg-slate-700 text-slate-200 hover:bg-slate-600 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1",
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

const StatGauge = ({ label, value, unit, status = "normal", max }) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    const getColor = () => {
        if (status === "success") return "text-green-400 border-green-900/50";
        if (status === "danger") return "text-red-500 border-red-900/50";
        return "text-blue-300 border-slate-700";
    };

    return (
        <div className={`bg-slate-900 border-2 p-3 rounded flex flex-col justify-between h-20 relative overflow-hidden ${getColor()}`}>
            <div className="flex justify-between items-center z-10">
                <span className="text-[10px] font-pixel opacity-70">{label}</span>
            </div>
            <div className="flex items-end gap-1 z-10">
                <span className="text-xl font-mono font-bold leading-none">{value}</span>
                <span className="text-[10px] font-pixel opacity-50 mb-1">{unit}</span>
            </div>
            {/* Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-800 w-full" />
            <div className="absolute bottom-0 left-0 h-1.5 bg-current transition-all duration-100" style={{ width: `${percent}%` }} />
        </div>
    );
};

export default function Level5TMI({ onBack, onNextLevel }) {
    // --- State ---
    const [velocity, setVelocity] = useState(START_VELOCITY);
    const [alignment, setAlignment] = useState(0); // 0 to 100%
    const [fuel, setFuel] = useState(100);

    // Game Flags
    const [isAligning, setIsAligning] = useState(false);
    const [isBurning, setIsBurning] = useState(false);
    const [isBurnWindow, setIsBurnWindow] = useState(false);

    // End States
    const [missionStatus, setMissionStatus] = useState('idle'); // idle, aligning, ready, burning, success, failed
    const [failureReason, setFailureReason] = useState(null);

    // Physics / Visuals
    const [orbitalAnomaly, setOrbitalAnomaly] = useState(180); // Start at Apogee (Left)
    const [trajectoryScale, setTrajectoryScale] = useState(1); // For expanding orbit visual

    const requestRef = useRef();
    const burnRef = useRef(false);

    // --- Physics Loop ---
    const updatePhysics = useCallback(() => {
        if (missionStatus === 'failed' || missionStatus === 'success') return;

        // 1. Orbital Motion
        // Fast at Perigee (0 deg), Slow at Apogee (180 deg)
        let speed = 0.3; // Base speed
        const rads = orbitalAnomaly * (Math.PI / 180);
        speed *= (1 + 0.8 * Math.cos(rads)); // Keplerian effect

        let nextAnomaly = orbitalAnomaly + speed;
        if (nextAnomaly >= 360) nextAnomaly -= 360;
        setOrbitalAnomaly(nextAnomaly);

        // 2. TMI Window Logic (Opens near Perigee)
        // Narrow window: +/- 15 degrees around 0
        const inWindow = nextAnomaly > 345 || nextAnomaly < 15;
        setIsBurnWindow(inWindow);

        // 3. Alignment Logic
        if (isAligning && alignment < 100) {
            setAlignment(prev => Math.min(100, prev + 0.5));
        } else if (isAligning && alignment >= 100) {
            setIsAligning(false);
            setMissionStatus('ready');
        }

        // 4. Burn Logic
        if (burnRef.current) {
            // Must be aligned
            if (alignment < 100) {
                failMission("VECTOR MISALIGNED", "Tried to burn without aligning trajectory.");
                return;
            }

            // Fuel Consumption
            setFuel(prev => Math.max(0, prev - 0.4));
            if (fuel <= 0) {
                failMission("FUEL EXHAUSTED", "Ran out of fuel before reaching escape velocity.");
                return;
            }

            // Velocity Increase
            // Efficiency multiplier based on window (Oberth effect simplified)
            const efficiency = inWindow ? 1.0 : 0.3;
            setVelocity(prev => prev + (0.015 * efficiency));

            // Visual Feedback
            setTrajectoryScale(prev => prev + 0.005);
        }

    }, [orbitalAnomaly, alignment, isAligning, fuel, missionStatus]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
    }, [updatePhysics]);

    // --- Actions ---

    const startAlign = () => {
        setIsAligning(true);
        setMissionStatus('aligning');
    };

    const startBurn = () => {
        if (missionStatus === 'failed' || missionStatus === 'success') return;
        if (alignment < 100) {
            failMission("ALIGNMENT ERROR", "Navigation computer not locked on Mars vector.");
            return;
        }

        burnRef.current = true;
        setIsBurning(true);
        setMissionStatus('burning');
    };

    const stopBurn = () => {
        if (!burnRef.current) return; // Already stopped or failed

        burnRef.current = false;
        setIsBurning(false);

        // Validate Burn using strict ranges (11.1 - 11.3)
        if (velocity >= SUCCESS_MIN && velocity <= SUCCESS_MAX) {
            // Check Timing (Must be reasonably close to Perigee)
            if (isBurnWindow) {
                setMissionStatus('success');
            } else {
                failMission("TIMING ERROR", "Correct velocity, but wrong position. Trajectory misses Mars.");
            }
        } else if (velocity < SUCCESS_MIN) {
            failMission("UNDERBURN", `Reached ${velocity.toFixed(2)} km/s. Needed at least ${SUCCESS_MIN} km/s to escape Earth.`);
        } else {
            failMission("OVERBURN", `Reached ${velocity.toFixed(2)} km/s. Velocity too high (> ${SUCCESS_MAX}), overshooting Mars interception.`);
        }
    };

    const failMission = (title, desc) => {
        burnRef.current = false;
        setIsBurning(false);
        setMissionStatus('failed');
        setFailureReason({ title, desc });
    };

    const resetLevel = () => {
        setVelocity(START_VELOCITY);
        setAlignment(0);
        setFuel(100);
        setOrbitalAnomaly(180);
        setTrajectoryScale(1);
        setMissionStatus('idle');
        setFailureReason(null);
        setIsAligning(false);
        setIsBurning(false);
        burnRef.current = false;
    };

    // --- Visuals ---
    const cx = 150;
    const cy = 150;

    // Visual Orbit
    // Highly elliptical parking orbit
    const r_perigee = 30;
    const r_apogee = 130 * trajectoryScale;
    const rx = (r_perigee + r_apogee) / 2;
    const ry = rx * 0.5; // Flattened
    const orbitCx = cx + r_perigee - rx;

    const rads = orbitalAnomaly * (Math.PI / 180);
    const satX = orbitCx + rx * Math.cos(rads);
    const satY = cy + ry * Math.sin(rads);

    // Velocity Status Color
    const getVelocityStatus = () => {
        if (velocity >= SUCCESS_MIN && velocity <= SUCCESS_MAX) return "success";
        if (velocity > SUCCESS_MAX) return "danger";
        return "normal";
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-2 sm:p-4 select-none flex flex-col items-center justify-center">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

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
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center border-2 border-white shadow-lg">
                        <Rocket className="text-white transform -rotate-45" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-pixel text-white">TRANS-MARS INJECTION</h1>
                        <p className="text-xs text-red-400 font-bold">FINAL MANEUVER</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500">TARGET RANGE</div>
                    <div className="font-mono text-xl text-blue-400">{SUCCESS_MIN} - {SUCCESS_MAX} km/s</div>
                </div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">

                {/* LEFT: ORBITAL VIEW */}
                <div className="flex flex-col gap-4">
                    <div className="relative aspect-square bg-black border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl">

                        {/* HUD Overlay - Single Clean Display (Smaller) */}
                        <div className="absolute top-4 left-4 z-20 space-y-2">
                            <div className="bg-black/50 p-2 rounded border border-slate-600 backdrop-blur-sm shadow-lg w-32">
                                <div className="text-[9px] text-slate-400 font-pixel mb-1">VELOCITY</div>
                                <div className={`text-2xl font-mono font-bold ${getVelocityStatus() === 'success' ? 'text-green-400' : (getVelocityStatus() === 'danger' ? 'text-red-500' : 'text-white')}`}>
                                    {velocity.toFixed(2)}
                                </div>
                                <div className="text-[9px] text-right text-slate-500">km/s</div>

                                {/* Target Marker */}
                                <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center text-[9px]">
                                    <span className="text-slate-400">TARGET</span>
                                    <span className="text-green-400 font-bold">11.2</span>
                                </div>
                            </div>
                        </div>

                        {/* Window Indicator */}
                        {isBurnWindow && (
                            <div className="absolute top-4 right-4 z-20 bg-green-900/80 px-3 py-1 rounded border border-green-500 animate-pulse font-pixel text-[10px] text-white">
                                TMI WINDOW OPEN
                            </div>
                        )}

                        {/* SVG Space */}
                        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 300 300">
                            <path d="M0 150 L300 150 M150 0 L150 300" stroke="#1e293b" strokeWidth="1" />

                            {/* Escape Trajectory Guide (Dotted Line) */}
                            {alignment >= 100 && (
                                <path d="M170 150 Q 250 150 280 50" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                            )}

                            {/* Perigee Highlight */}
                            <circle cx={150 + 30} cy={150} r="15" fill={isBurnWindow ? "rgba(34, 197, 94, 0.2)" : "rgba(30, 41, 59, 0.5)"} />
                            <circle cx={150 + 30} cy={150} r="2" fill="white" />

                            {/* Current Orbit */}
                            {missionStatus !== 'success' && (
                                <ellipse
                                    cx={orbitCx} cy={150} rx={rx} ry={ry}
                                    fill="none"
                                    stroke={isBurning ? "#fbbf24" : "#3b82f6"}
                                    strokeWidth="2"
                                />
                            )}

                            {/* Success Trajectory */}
                            {missionStatus === 'success' && (
                                <path d="M170 150 Q 250 150 280 50" fill="none" stroke="#22c55e" strokeWidth="3" className="animate-pulse" />
                            )}

                            {/* Earth */}
                            <circle cx={150} cy={150} r="12" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />

                            {/* Satellite */}
                            <g transform={`translate(${satX}, ${satY})`}>
                                <circle r="6" fill="white" stroke="#000" strokeWidth="1" />
                                {/* Engine Plume */}
                                {isBurning && (
                                    <path d="M-6 0 L-18 -5 L-18 5 Z" fill="#fbbf24" className="animate-pulse" />
                                )}
                                {/* Alignment Ring */}
                                {alignment > 0 && alignment < 100 && (
                                    <circle r="10" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray={`${(alignment / 100) * 62} 62`} transform="rotate(-90)" />
                                )}
                            </g>
                        </svg>
                    </div>

                    <StatGauge label="ALIGNMENT" value={alignment.toFixed(0)} unit="%" status={alignment === 100 ? "success" : "normal"} max={100} />
                </div>

                {/* RIGHT: CONTROL PANEL */}
                <div className="flex flex-col gap-4">

                    {/* INSTRUCTIONS */}
                    <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 shadow-lg">
                        <h3 className="font-pixel text-xs text-blue-300 mb-2">MISSION PROFILE</h3>
                        <ul className="text-xs text-slate-300 space-y-2 font-mono leading-relaxed">
                            <li className="flex gap-2"><span className="text-blue-500">1.</span> Align spacecraft vector.</li>
                            <li className="flex gap-2"><span className="text-blue-500">2.</span> Wait for TMI Window (Perigee).</li>
                            <li className="flex gap-2"><span className="text-blue-500">3.</span> Burn to reach <strong className="text-white">11.1 - 11.3 km/s</strong>.</li>
                        </ul>
                    </div>

                    {/* CONTROLS */}
                    <div className="bg-slate-900 border-4 border-slate-700 p-6 rounded-xl flex flex-col gap-6 shadow-xl flex-1">

                        {/* STEP 1: ALIGN */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-pixel text-slate-400">STEP 1: PREPARATION</label>
                                {alignment === 100 && <CheckCircle size={14} className="text-green-400" />}
                            </div>
                            <GameButton
                                variant={alignment === 100 ? "success" : "primary"}
                                onClick={startAlign}
                                disabled={isAligning || alignment === 100 || missionStatus === 'failed'}
                                className="w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <Navigation size={16} className={isAligning ? "animate-spin" : ""} />
                                    {isAligning ? "ALIGNING..." : (alignment === 100 ? "VECTOR ALIGNED" : "ALIGN VECTOR")}
                                </div>
                            </GameButton>
                        </div>

                        {/* STEP 2: BURN */}
                        <div className="flex-1 flex flex-col justify-end">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-pixel text-slate-400">STEP 2: INJECTION BURN</label>
                                <span className="text-[10px] text-slate-500 font-mono">HOLD TO FIRE</span>
                            </div>
                            <GameButton
                                variant={isBurnWindow ? "warning" : "neutral"}
                                onMouseDown={startBurn}
                                onMouseUp={stopBurn}
                                onMouseLeave={stopBurn}
                                onTouchStart={(e) => { e.preventDefault(); startBurn(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopBurn(); }}
                                disabled={alignment < 100 || missionStatus === 'failed' || missionStatus === 'success'}
                                className="w-full h-24 text-lg shadow-xl"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Flame size={32} className={isBurning ? "animate-bounce text-red-500" : "text-slate-400"} />
                                    <span>{isBurning ? "IGNITION" : "IGNITE TMI"}</span>
                                </div>
                            </GameButton>
                        </div>

                    </div>

                    <StatGauge label="PROPELLANT" value={fuel.toFixed(0)} unit="%" status={fuel < 20 ? "danger" : "normal"} max={100} />

                </div>
            </div>

            {/* --- OVERLAYS --- */}

            {/* SUCCESS */}
            {missionStatus === 'success' && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-green-900/90 border-4 border-green-500 p-8 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300">
                        <div className="animate-pulse">
                            <Rocket size={60} className="text-white mb-4 mx-auto transform rotate-45" />
                            <h2 className="text-2xl sm:text-4xl font-pixel text-white mb-2">MARS BOUND!</h2>
                            <p className="text-green-200 font-pixel text-xs mt-4 mb-6">ESCAPED EARTH GRAVITY WELL</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={resetLevel}
                                className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-pixel text-xs rounded border-b-4 border-slate-800 active:border-b-0 active:translate-y-1"
                            >
                                RETRY
                            </button>
                            <button
                                onClick={onNextLevel || onBack}
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-pixel text-xs rounded border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                            >
                                NEXT LEVEL →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAILURE */}
            {missionStatus === 'failed' && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-red-900/90 border-4 border-red-500 p-8 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300 max-w-md mx-4">
                        <XCircle size={60} className="text-white mb-4 mx-auto" />
                        <h2 className="text-2xl sm:text-3xl font-pixel text-white mb-4">MISSION FAILED</h2>
                        <div className="bg-black/40 p-4 rounded border border-red-500/50 mb-6">
                            <p className="text-red-300 font-pixel text-xs mb-1 opacity-70 uppercase">CAUSE</p>
                            <p className="text-white font-mono text-sm">{failureReason?.title}</p>
                            <p className="text-slate-300 text-xs mt-2">{failureReason?.desc}</p>
                        </div>
                        <button
                            onClick={resetLevel}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                        >
                            RETRY LEVEL
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}