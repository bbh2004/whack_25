import React from 'react';
import { Rocket, Star, RefreshCw, ChevronRight } from 'lucide-react';

const SuccessModal = ({ onRetry, onNext }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-slate-900 border-4 border-green-500 p-8 max-w-md w-full relative shadow-[0_0_80px_rgba(34,197,94,0.3)] animate-in zoom-in-95 duration-500">
                {/* Stamp Badge */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-black font-pixel text-xs px-6 py-3 border-2 border-white transform -rotate-2 shadow-lg z-20">
                    MISSION ACCOMPLISHED
                </div>

                <div className="flex flex-col items-center text-center space-y-6 mt-4">
                    {/* Icon Circle */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500 blur-xl opacity-30 animate-pulse" />
                        <div className="w-24 h-24 bg-green-900/40 rounded-full flex items-center justify-center border-4 border-green-500 shadow-inner relative z-10">
                            <Rocket size={48} className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                            <Star className="absolute top-0 right-0 text-yellow-400 animate-bounce" size={24} fill="currentColor" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl text-white font-pixel text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-600">ORBIT ACHIEVED</h2>
                        <p className="text-slate-300 text-xs font-mono leading-relaxed px-4">
                            Congratulations Commander! The Mangalyaan orbiter has successfully entered the Mars Transfer Trajectory.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-px w-full bg-green-900 border border-green-700 overflow-hidden rounded-sm">
                        <div className="bg-slate-900/90 p-3 text-[9px] font-pixel text-green-400 flex flex-col gap-1">
                            <span className="text-slate-500">STATUS</span>
                            <span className="text-white">NOMINAL</span>
                        </div>
                        <div className="bg-slate-900/90 p-3 text-[9px] font-pixel text-green-400 flex flex-col gap-1">
                            <span className="text-slate-500">APOAPSIS</span>
                            <span className="text-white">TARGETED</span>
                        </div>
                        <div className="bg-slate-900/90 p-3 text-[9px] font-pixel text-green-400 flex flex-col gap-1">
                            <span className="text-slate-500">FUEL REM</span>
                            <span className="text-white">SUFFICIENT</span>
                        </div>
                        <div className="bg-slate-900/90 p-3 text-[9px] font-pixel text-green-400 flex flex-col gap-1">
                            <span className="text-slate-500">SIGNAL</span>
                            <span className="text-white">100%</span>
                        </div>
                    </div>

                    <button
                        onClick={onRetry}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-pixel py-4 border-b-4 border-green-800 active:border-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                    >
                        <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={16} />
                        RETRY LEVEL
                    </button>
                    <button
                        onClick={onNext}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-pixel py-4 border-b-4 border-blue-800 active:border-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 group animate-pulse"
                    >
                        NEXT LEVEL
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Decorative Corner Pixels */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-white" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-white" />
            </div>
        </div>
    );
};

export default SuccessModal;
