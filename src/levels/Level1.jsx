import React, { useState, useMemo, useEffect } from 'react';
import {
    Check, X, Rocket, Fuel, Zap, Radio, Shield, Box, Lock,
    Settings, RefreshCw, Sun, AlertTriangle, Target, Star, Medal, ChevronRight
} from 'lucide-react';
import SuccessModal from '../components/ui/SuccessModal';

// --- Constants & Config ---
const TARGET_DISTANCE = 100; // Arbitrary units for Mars
const GRAVITY = 9.8;

// Mission: MOM (Mars Orbiter Mission) - Requires PSLV-XL
// Puzzle: LVM3 is too expensive (budget constraint), PSLV-G is too weak. 
// User must balance Fuel vs Weight on the PSLV-XL.

const VEHICLES = [
    { id: 'pslv-g', name: 'PSLV-G', maxMass: 1600, thrust: 2000, cost: 20 },
    { id: 'pslv-xl', name: 'PSLV-XL', maxMass: 1950, thrust: 2400, cost: 30 }, // The sweet spot
    { id: 'lvm3', name: 'LVM3', maxMass: 4000, thrust: 6000, cost: 100 }, // Over budget
];

const COMPONENTS = {
    payload: { name: 'Orbiter', mass: 500, icon: Box, req: true, desc: "The main satellite." },
    guidance: { name: 'Guidance', mass: 50, icon: Settings, req: true, desc: "Navigation computer." },
    telemetry: { name: 'Telemetry', mass: 30, icon: Radio, req: true, desc: "Comms with Earth." },
    thermal: { name: 'Heat Shield', mass: 100, icon: Shield, req: true, desc: "Solar protection." },
    solar: { name: 'Power Sys', mass: 60, icon: Sun, req: true, desc: "Solar arrays." },
    strapOn: { name: 'Boosters', mass: 200, icon: Rocket, req: true, desc: "Extra thrust." },
};

// --- Helper Components ---

const PixelButton = ({ onClick, disabled, children, className = "", variant = "primary", title }) => {
    const baseStyles = "relative inline-flex items-center justify-center px-4 py-3 font-pixel text-[10px] sm:text-xs uppercase tracking-widest transition-transform active:translate-y-1 focus:outline-none select-none";

    const variants = {
        primary: "bg-blue-600 text-white border-b-4 border-r-4 border-blue-900 hover:bg-blue-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        danger: "bg-red-600 text-white border-b-4 border-r-4 border-red-900 hover:bg-red-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        success: "bg-emerald-600 text-white border-b-4 border-r-4 border-emerald-900 hover:bg-emerald-500 active:border-0 active:translate-y-1 active:mr-[-4px] active:mb-[-4px]",
        disabled: "bg-slate-700 text-slate-500 border-b-4 border-r-4 border-slate-900 cursor-not-allowed",
    };

    return (
        <button
            onClick={!disabled ? onClick : undefined}
            className={`${baseStyles} ${disabled ? variants.disabled : variants[variant]} ${className}`}
            title={title}
        >
            {children}
        </button>
    );
};

const ItemSlot = ({ icon: Icon, label, isActive, onClick, error }) => (
    <div
        onClick={onClick}
        className={`
      group relative w-full aspect-square border-4 cursor-pointer transition-all flex flex-col items-center justify-center select-none overflow-hidden
      ${isActive
                ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                : 'bg-slate-800 border-slate-600 hover:border-slate-400 hover:bg-slate-700'
            }
      ${error ? 'border-red-500 animate-pulse' : ''}
    `}
    >
        <div className={`absolute inset-0 bg-blue-500/10 transition-transform duration-300 ${isActive ? 'translate-y-0' : 'translate-y-full'}`} />
        <Icon size={24} className={`relative z-10 transition-all ${isActive ? 'text-blue-300 scale-110' : 'text-slate-500'}`} />
        <span className="relative z-10 mt-2 text-[8px] font-pixel text-center leading-tight text-slate-300 px-1 uppercase">{label}</span>
        {isActive && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]" />}
    </div>
);

const ProgressBar = ({ label, value, max, threshold, unit, reverse = false }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    // Logic: Generally higher is better, unless 'reverse' is true (like cost/weight limits)
    // Here we use simplified logic: There is a "safe zone".
    const isGood = value >= threshold;

    return (
        <div className="w-full mb-2 group">
            <div className="flex justify-between text-[8px] font-pixel text-slate-400 mb-1 uppercase">
                <span>{label}</span>
                <span className={isGood ? "text-green-400" : "text-amber-500"}>
                    {value.toFixed(1)} {unit}
                </span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-700 relative overflow-hidden">
                {/* Threshold Line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-20"
                    style={{ left: `${(threshold / max) * 100}%` }}
                />
                <div
                    className={`h-full transition-all duration-500 ${isGood ? 'bg-gradient-to-r from-emerald-800 to-emerald-500' : 'bg-gradient-to-r from-amber-900 to-amber-600'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// Main Application Component
export default function RocketAssembly({ onNextLevel, onBack }) {
    // --- State ---
    const [vehicleId, setVehicleId] = useState('pslv-g');
    const [items, setItems] = useState({
        payload: false, guidance: false, telemetry: false, thermal: false,
        solar: false, strapOn: false, fairing: false,
    });
    const [fuelLevel, setFuelLevel] = useState(50);
    const [fairingLocked, setFairingLocked] = useState(false);
    const [launchStatus, setLaunchStatus] = useState('idle'); // 'idle' | 'checking' | 'launched' | 'failed'
    const [showSuccess, setShowSuccess] = useState(false);
    const [log, setLog] = useState(["Mission Initialized. Build the rocket."]);
    const [confetti, setConfetti] = useState([]);

    // --- Logic & Math ---
    const selectedVehicle = VEHICLES.find(v => v.id === vehicleId);

    // 1. Calculate Mass
    const currentMass = useMemo(() => {
        let mass = 0;
        Object.entries(items).forEach(([key, isActive]) => {
            if (isActive && key !== 'fairing') mass += COMPONENTS[key].mass;
        });
        // Fairing adds mass
        if (items.fairing) mass += 100;

        // Fuel adds mass (Base hull mass included in vehicle, fuel is variable)
        // Simplified: Fuel creates mass up to 2000kg equivalent
        mass += (fuelLevel / 100) * 1000;
        return mass;
    }, [items, fuelLevel]);

    // 2. Calculate Thrust-to-Weight Ratio (Must be > 1.2 to lift safely)
    // TWR = Thrust / (Mass * Gravity)
    // We simplify units for the game
    const twr = useMemo(() => {
        const totalWeight = currentMass + 200; // +200 for base structure
        return selectedVehicle.thrust / totalWeight;
    }, [currentMass, selectedVehicle]);

    // 3. Calculate Delta-V (Range) - The Puzzle
    // More fuel = more range, BUT more mass reduces efficiency.
    // Range = (Fuel% * Efficiency) / TotalMass
    // This creates a curve. You need enough fuel, but not so much you become too heavy.
    const range = useMemo(() => {
        const baseEfficiency = 5000; // Arbitrary rocket science constant
        const totalMass = currentMass + 500; // Inert mass
        const fuelMass = (fuelLevel / 100) * 1000;

        // Rocket Equation simplified: ln(wet/dry)
        // But let's keep it linear enough for a casual user
        if (fuelLevel === 0) return 0;

        // Efficiency bonus for boosters
        const boosterBonus = items.strapOn ? 1.2 : 1.0;

        // Calculated Range in Million km (simulated)
        const calc = (fuelMass * baseEfficiency * boosterBonus) / (totalMass * 1.5);
        return calc;
    }, [currentMass, fuelLevel, items.strapOn]);

    const toggleItem = (key) => {
        if (launchStatus === 'launched') return;
        if (key === 'fairing') {
            if (!items.fairing) setItems(prev => ({ ...prev, fairing: true }));
            else {
                if (fairingLocked) setFairingLocked(false);
                setItems(prev => ({ ...prev, fairing: false }));
            }
        } else {
            setItems(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const addLog = (msg) => setLog(prev => [`> ${msg}`, ...prev].slice(0, 5));

    const handleLaunch = () => {
        if (launchStatus === 'launched') return;
        setLaunchStatus('checking');
        addLog("INITIATING LAUNCH SEQUENCE...");

        setTimeout(() => {
            const errors = [];

            // 1. Physical Checks
            if (!items.payload) errors.push("NO SATELLITE FOUND");
            if (!items.guidance) errors.push("NO GUIDANCE COMPUTER");
            if (!items.telemetry) errors.push("NO COMMS SYSTEM");
            if (!items.solar) errors.push("NO POWER SOURCE");
            if (!items.thermal) errors.push("NO HEAT SHIELD");

            // 2. Safety
            if (!items.fairing) errors.push("FAIRING MISSING");
            else if (!fairingLocked) errors.push("FAIRING NOT LOCKED");

            // 3. The Math Puzzle
            if (twr < 1.1) errors.push("TOO HEAVY FOR LIFT OFF");
            if (range < TARGET_DISTANCE) errors.push("INSUFFICIENT FUEL RANGE");

            // 4. Mission Specific
            if (selectedVehicle.id === 'lvm3') errors.push("BUDGET EXCEEDED (Use PSLV)");
            if (selectedVehicle.id === 'pslv-g') errors.push("VEHICLE TOO WEAK");

            if (errors.length === 0) {
                setLaunchStatus('launched');
                addLog("LIFT OFF! MOM IS ON WAY TO MARS!");
                triggerConfetti();
                // Wait for rocket animation (3s) to almost finish before showing success modal
                setTimeout(() => setShowSuccess(true), 2500);
            } else {
                setLaunchStatus('failed');
                addLog(`HALT: ${errors[0]}`);
            }
        }, 1500);
    };

    const resetSim = () => {
        setLaunchStatus('briefing');
        setFuelLevel(50);
        setShowSuccess(false);
        setItems({
            payload: false, guidance: false, telemetry: false, thermal: false,
            solar: false, strapOn: false, fairing: false,
        });
        setVehicleId('pslv-g');
        setFairingLocked(false);
        setLog(["Systems Reset."]);
        setConfetti([]);
    };

    const startMission = () => {
        setLaunchStatus('idle');
        addLog("Mission Initialized. Build the rocket.");
    };

    const triggerConfetti = () => {
        const colors = ['#00F0FF', '#FFFFFF', '#3B82F6', '#FCD34D', '#22C55E'];
        const shapes = ['★', '✦', '✧', '⬟', '◆'];
        const newConfetti = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            animDuration: 1.5 + Math.random() * 2,
            delay: Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            size: 12 + Math.random() * 12
        }));
        setConfetti(newConfetti);
    };

    // --- Visuals ---
    const getRocketGraphic = () => {
        const isLaunched = launchStatus === 'launched';

        return (
            <div className={`relative flex flex-col items-center transition-transform duration-[3000ms] ease-in ${isLaunched ? '-translate-y-[1200px]' : ''}`}>

                {/* Exhaust Fire (Only on Launch) */}
                {isLaunched && (
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-8 h-32 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent blur-md animate-pulse z-0" />
                )}

                {/* === PAYLOAD SECTION === */}
                <div className="relative z-30 flex flex-col items-center mb-[-2px]">
                    {/* Nose Cone / Fairing */}
                    <div className={`w-0 h-0 border-l-[16px] border-r-[16px] border-b-[32px] border-l-transparent border-r-transparent 
            ${items.fairing ? (fairingLocked ? 'border-b-slate-200' : 'border-b-amber-400') : 'opacity-0'} 
            transition-all duration-300`}
                    />

                    {/* Payload Bay */}
                    <div className={`w-14 h-20 bg-slate-800 border-x-4 border-slate-300 relative flex items-center justify-center overflow-hidden transition-all
            ${!items.payload ? 'bg-slate-900/50' : ''}
          `}>
                        {/* The Orbiter */}
                        {items.payload ? (
                            <div className="w-8 h-12 bg-amber-500 rounded-sm border-2 border-amber-300 relative animate-pulse shadow-inner">
                                {items.solar && <div className="absolute -left-3 top-2 w-3 h-8 bg-blue-900 border border-blue-700" />}
                                {items.solar && <div className="absolute -right-3 top-2 w-3 h-8 bg-blue-900 border border-blue-700" />}
                                {items.guidance && <div className="absolute top-1 left-1 w-2 h-2 bg-green-400 animate-ping" />}
                                {items.thermal && <div className="absolute inset-0 bg-yellow-600/30 border-2 border-yellow-600 rounded-sm" />}
                            </div>
                        ) : (
                            <div className="text-slate-600 text-[8px] font-pixel text-center px-1">EMPTY BAY</div>
                        )}

                        {/* Fairing Cover */}
                        {items.fairing && (
                            <div className={`absolute inset-0 bg-slate-200 border-x-2 border-slate-300 flex items-center justify-center transition-opacity duration-500 ${fairingLocked ? 'opacity-100' : 'opacity-80'}`}>
                                {fairingLocked
                                    ? <div className="w-8 h-8 rounded-full border-4 border-slate-300 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Indian_Space_Research_Organisation_Logo.svg" alt="ISRO" className="w-4 opacity-50 grayscale" onError={(e) => e.target.style.display = 'none'} /></div>
                                    : <Lock className="text-amber-500 w-4 h-4 animate-bounce" />
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* === ROCKET BODY === */}
                {/* Stage 3 */}
                <div className="w-14 h-16 bg-slate-200 border-x-4 border-slate-400 mt-[-1px] flex items-center justify-center">
                    <div className="w-full h-1 bg-slate-300" />
                </div>

                {/* Stage 2 (Fuel) */}
                <div className="w-14 h-28 bg-slate-300 border-x-4 border-slate-500 mt-[-1px] relative flex items-center justify-center overflow-hidden">
                    <div className={`absolute bottom-0 w-full bg-orange-500/40 transition-all duration-500 ease-out`} style={{ height: `${fuelLevel}%` }} />
                    <div className="relative z-10 flex flex-col items-center gap-1 opacity-60">
                        <span className="text-[8px] font-pixel text-slate-600 tracking-widest">ISRO</span>
                        <span className="text-[6px] font-pixel text-slate-600">{selectedVehicle.name}</span>
                    </div>
                </div>

                {/* Stage 1 */}
                <div className="w-16 h-36 bg-slate-100 border-x-4 border-slate-400 mt-[-1px] relative flex flex-col items-center justify-end shadow-lg">
                    {items.strapOn && (
                        <>
                            <div className="absolute -left-6 bottom-0 w-5 h-28 bg-red-700 border-2 border-red-900 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                                <div className="w-2 h-8 bg-red-900/30" />
                            </div>
                            <div className="absolute -right-6 bottom-0 w-5 h-28 bg-red-700 border-2 border-red-900 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                                <div className="w-2 h-8 bg-red-900/30" />
                            </div>
                        </>
                    )}

                    {/* Engine Detail */}
                    <div className="w-full h-8 border-t border-slate-300 bg-slate-200 flex justify-center gap-1 pt-1">
                        <div className="w-1 h-full bg-slate-400" />
                        <div className="w-1 h-full bg-slate-400" />
                    </div>
                </div>

                {/* Nozzle */}
                <div className="w-12 h-10 bg-slate-800 clip-path-trapezoid mt-[-2px] flex justify-center relative">
                    <div className="absolute top-0 w-full h-2 bg-black/20" />
                </div>
            </div>
        );
    };

    // Removed briefing screen - mission briefing is now shown in MissionSelection

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-2 sm:p-4 select-none">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        .clip-path-trapezoid { clip-path: polygon(20% 0, 80% 0, 100% 100%, 0% 100%); }
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
        @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

            {/* CONFETTI - Pixel Stars */}
            {confetti.map(c => (
                <div
                    key={c.id}
                    className="fixed z-50 pointer-events-none font-pixel"
                    style={{
                        left: `${c.left}%`,
                        top: '-20px',
                        color: c.color,
                        fontSize: `${c.size}px`,
                        textShadow: `0 0 10px ${c.color}`,
                        animation: `fall ${c.animDuration}s linear forwards`,
                        animationDelay: `${c.delay}s`
                    }}
                >
                    {c.shape}
                </div>
            ))}

            {/* MISSION SUCCESS POPUP */}
            {showSuccess && (
                <SuccessModal onRetry={resetSim} onNext={onNextLevel} />
            )}

            {/* HEADER */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 flex items-center justify-center border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-lg"
                            title="Back to Map"
                        >
                            <span className="text-white text-xl">←</span>
                        </button>
                    )}
                    <div className="w-12 h-12 bg-blue-600 flex items-center justify-center border-2 border-white shrink-0 shadow-lg shadow-blue-900/50">
                        <Rocket className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-pixel text-slate-100 flex items-center gap-2">
                            ISRO SIM <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-blue-200">LITE</span>
                        </h1>
                        <p className="text-[10px] text-blue-400 font-pixel mt-1">TARGET: MARS TRANSFER ORBIT</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 px-4 py-2 border border-slate-700 flex flex-col items-end">
                        <span className="text-[8px] font-pixel text-slate-500 uppercase">Mission Status</span>
                        <span className={`text-[10px] font-pixel ${launchStatus === 'failed' ? 'text-red-500' : 'text-green-400'}`}>
                            {launchStatus.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT: VISUALS (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-900 border-4 border-slate-700 rounded-sm relative h-[550px] flex flex-col shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 bg-slate-800 text-slate-400 text-[10px] font-pixel px-3 py-1 z-20 border-br-4 border-slate-700">
                        ASSEMBLY BAY 01
                    </div>

                    <div className="flex-1 relative bg-grid-pattern flex items-end justify-center pb-12 pt-20">
                        {getRocketGraphic()}
                        <div className="absolute bottom-0 w-full h-8 bg-slate-800 border-t-4 border-slate-600 z-10 flex justify-center gap-20">
                            <div className="w-2 h-2 bg-red-500/50 rounded-full animate-pulse mt-2" />
                            <div className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse mt-2" />
                            <div className="w-2 h-2 bg-red-500/50 rounded-full animate-pulse mt-2" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROLS (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">

                    {/* Top Row: Inventory & Computer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Inventory */}
                        <div className="bg-slate-900 border-4 border-slate-700 p-4 shadow-lg">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-[10px] font-pixel text-blue-300">COMPONENTS</div>
                                <span className="text-[8px] text-slate-500 font-pixel">REQ: ALL</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(COMPONENTS).map(([key, data]) => (
                                    <ItemSlot
                                        key={key}
                                        icon={data.icon}
                                        label={data.name}
                                        isActive={items[key]}
                                        onClick={() => toggleItem(key)}
                                    />
                                ))}
                            </div>

                            {/* Fairing Button */}
                            <div
                                onClick={() => toggleItem('fairing')}
                                className={`mt-2 w-full py-3 border-2 cursor-pointer flex items-center justify-center gap-3 transition-all
                        ${items.fairing
                                        ? 'bg-slate-800 border-slate-500 shadow-inner'
                                        : 'bg-slate-900 border-dashed border-slate-600 hover:bg-slate-800'
                                    }
                    `}
                            >
                                <Lock size={16} className={items.fairing ? 'text-white' : 'text-slate-600'} />
                                <span className="font-pixel text-[10px] text-slate-300">
                                    {items.fairing ? (fairingLocked ? "FAIRING LOCKED" : "FAIRING UNSECURED") : "INSTALL FAIRING"}
                                </span>
                                {items.fairing && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFairingLocked(!fairingLocked); }}
                                        className={`ml-2 px-2 py-1 text-[8px] font-pixel transition-colors ${fairingLocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}
                                    >
                                        {fairingLocked ? 'SECURE' : 'LOCK'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* FLIGHT COMPUTER (The Brain Part) */}
                        <div className="bg-black border-4 border-slate-700 p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-20"><Zap size={48} /></div>
                            <div className="text-[10px] font-pixel text-emerald-400 mb-1 flex items-center gap-2">
                                <Target size={12} /> FLIGHT SIMULATION
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                {/* Gauge 1: TWR */}
                                <ProgressBar
                                    label="LIFT-OFF THRUST"
                                    value={twr}
                                    max={2.0}
                                    threshold={1.1}
                                    unit="TWR"
                                />

                                {/* Gauge 2: Range */}
                                <ProgressBar
                                    label="EST. MARS RANGE"
                                    value={range}
                                    max={150}
                                    threshold={TARGET_DISTANCE}
                                    unit="Gm"
                                />

                                <div className="bg-slate-900 p-2 border border-slate-800 text-[8px] font-pixel text-slate-400 leading-relaxed">
                                    HINT: Adjust fuel to balance Weight vs Range. <br />
                                    <span className="text-blue-400">Green bars = Good to go.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Config & Launch */}
                    <div className="bg-slate-900 border-4 border-slate-700 p-4 flex-1 flex flex-col gap-4 shadow-lg">
                        <div className="text-[10px] font-pixel text-blue-300">LAUNCH CONFIGURATION</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-pixel text-slate-400 block mb-1">VEHICLE SELECTION</label>
                                    <select
                                        value={vehicleId}
                                        onChange={(e) => setVehicleId(e.target.value)}
                                        disabled={launchStatus === 'launched'}
                                        className="w-full bg-black border-2 border-slate-600 text-green-400 font-mono text-xs p-3 focus:border-blue-500 outline-none"
                                    >
                                        {VEHICLES.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} (Max Payload: {v.maxMass}kg)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="text-[9px] font-pixel text-slate-400 flex items-center gap-1"><Fuel size={10} /> FUEL LOAD</label>
                                        <span className={fuelLevel < 50 ? 'text-amber-400 text-[9px] font-pixel' : 'text-green-400 text-[9px] font-pixel'}>{fuelLevel}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100"
                                        disabled={launchStatus === 'launched'}
                                        value={fuelLevel} onChange={(e) => setFuelLevel(Number(e.target.value))}
                                        className="w-full h-6 bg-slate-800 appearance-none border border-slate-600 accent-blue-500 cursor-pointer hover:border-slate-500"
                                    />
                                    <div className="flex justify-between text-[8px] text-slate-600 font-pixel">
                                        <span>LIGHT</span>
                                        <span>HEAVY</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 h-full">
                                <div className="flex-1 bg-black border-2 border-slate-600 p-2 font-mono text-[10px] text-green-500 overflow-hidden flex flex-col shadow-inner min-h-[80px]">
                                    {log.map((line, i) => <div key={i} className="mb-1 border-b border-green-900/30 pb-1 last:border-0 opacity-90">{line}</div>)}
                                </div>

                                <div className="flex gap-2 h-12">
                                    <PixelButton onClick={resetSim} variant="danger" title="Reset System"><RefreshCw size={16} /></PixelButton>
                                    <PixelButton onClick={handleLaunch} className="flex-1 text-sm md:text-base" disabled={launchStatus === 'launched' || launchStatus === 'checking'} variant={launchStatus === 'launched' ? 'success' : 'primary'}>
                                        {launchStatus === 'checking' ? 'CHECKING SYSTEMS...' : launchStatus === 'launched' ? 'MISSION SUCCESS' : 'INITIATE LAUNCH'}
                                    </PixelButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
