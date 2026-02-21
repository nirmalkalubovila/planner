import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Zap, Hammer, Map, Heart, HeartPulse, Swords, Skull, Trophy, Star } from 'lucide-react';

export interface DailyThemeProps {
    completedPoints: number;
    totalPoints: number;
    completedTasksCount: number;
    totalTasksCount: number;
}

// 1. Combo Chain
export const ComboChain: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
    const [shake, setShake] = useState(false);
    const prev = useRef(completedTasksCount);
    const isPerfect = completedTasksCount > 0 && completedTasksCount === totalTasksCount;

    useEffect(() => {
        if (completedTasksCount > prev.current) {
            setShake(true);
            setTimeout(() => setShake(false), 400);
        }
        prev.current = completedTasksCount;
    }, [completedTasksCount]);

    return (
        <div className="flex flex-col items-center justify-center py-12 relative">
            {isPerfect && <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className={cn(
                "relative transition-all duration-300 ease-in-out z-10",
                shake && !isPerfect && "scale-110 translate-x-2 -translate-y-1",
                isPerfect && "scale-125 animate-[bounce_2s_infinite]"
            )}>
                <div className={cn(
                    "text-[6rem] font-black italic leading-none transition-colors duration-700",
                    isPerfect ? "text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)]" : "text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]"
                )}>
                    {completedTasksCount} <span className={cn("text-4xl", isPerfect ? "text-yellow-200" : "text-orange-300")}>HITS</span>
                </div>
                {isPerfect && (
                    <div className="absolute -inset-4 bg-yellow-400/40 blur-2xl rounded-full scale-150 animate-ping -z-10"></div>
                )}
            </div>

            <div className="mt-8 text-center z-10">
                {isPerfect ? (
                    <div className="text-2xl font-black text-yellow-400 animate-pulse uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                        Perfect Combo!
                    </div>
                ) : completedTasksCount > 0 ? (
                    <div className="text-sm font-bold text-orange-400/80 animate-pulse tracking-widest uppercase">
                        Keep the streak alive
                    </div>
                ) : (
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Start the combo
                    </div>
                )}
            </div>
        </div>
    );
};

// 2. Discipline Battery
export const DisciplineBattery: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isOverdrive = progress >= 100;

    return (
        <div className={cn("flex flex-col items-center justify-center py-10 transition-colors duration-1000 relative", isOverdrive && "py-12")}>
            {isOverdrive && <div className="absolute inset-0 bg-yellow-500/10 blur-[40px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className={cn(
                "relative w-24 h-48 border-4 border-slate-700 rounded-2xl p-1 overflow-visible bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-700 z-10",
                isOverdrive && "border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] scale-110"
            )}>
                <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 rounded-t-sm transition-colors duration-700", isOverdrive ? "bg-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,1)]" : "bg-slate-700")}></div>

                {/* External Arcs */}
                {isOverdrive && (
                    <>
                        <Zap className="absolute -left-12 top-1/4 w-10 h-10 text-yellow-400 animate-ping -rotate-45 opacity-70" />
                        <Zap className="absolute -right-12 bottom-1/4 w-10 h-10 text-yellow-400 animate-ping rotate-45 opacity-70" style={{ animationDelay: '0.5s' }} />
                    </>
                )}

                <div className="absolute inset-1 bottom-1 flex flex-col justify-end overflow-hidden rounded-sm">
                    <div
                        className={cn("w-full transition-all duration-1000 bg-gradient-to-t",
                            isOverdrive ? "from-yellow-500 to-yellow-100 animate-[pulse_0.5s_infinite] shadow-[0_0_30px_rgba(250,204,21,1)]" : "from-emerald-600 to-emerald-400"
                        )}
                        style={{ height: `${progress}%` }}
                    >
                        {progress > 0 && <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>}
                    </div>
                </div>

                {progress > 0 && <Zap className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 transition-all duration-500", isOverdrive ? "text-slate-900 w-16 h-16 animate-pulse" : "text-white/50")} />}
            </div>

            <div className="mt-8 text-center z-10">
                <div className={cn("text-2xl font-black tracking-[0.2em] uppercase transition-all duration-500", isOverdrive ? "text-yellow-400 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,1)] text-3xl" : "text-emerald-500")}>
                    {isOverdrive ? "OVERDRIVE MODE" : "Charging..."}
                </div>
                {!isOverdrive && <div className="text-sm font-medium text-muted-foreground mt-1">{progress.toFixed(0)}% Power</div>}
            </div>
            <style>{`@keyframes slide { from { background-position: 0 0; } to { background-position: 20px 20px; } }`}</style>
        </div>
    );
};

// 3. Forge System
export const ForgeSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const [strike, setStrike] = useState(false);
    const prev = useRef(completedPoints);
    const isMasterpiece = progress >= 100;

    useEffect(() => {
        if (completedPoints > prev.current) {
            setStrike(true);
            setTimeout(() => setStrike(false), 300);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    return (
        <div className="flex flex-col items-center justify-center py-10 relative">
            {isMasterpiece && <div className="absolute inset-0 bg-orange-500/20 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className={cn("relative z-10 transition-all duration-1000", isMasterpiece && "scale-125")}>
                <Hammer className={cn(
                    "w-20 h-20 transition-all duration-500 origin-bottom-right drop-shadow-lg",
                    strike && !isMasterpiece && "rotate-[-45deg] scale-110 text-orange-300 drop-shadow-[0_0_15px_rgba(249,115,22,1)]",
                    isMasterpiece ? "text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" : "text-slate-400"
                )} />
                {strike && !isMasterpiece && <div className="absolute top-0 right-0 w-full h-full bg-orange-500/50 rounded-full blur-xl animate-ping"></div>}
                {isMasterpiece && <div className="absolute inset-0 bg-yellow-400/60 rounded-full blur-2xl animate-[spin_3s_linear_infinite]"></div>}
            </div>

            <div className={cn(
                "w-48 h-4 bg-slate-800 rounded-full mt-10 overflow-visible relative shadow-inner z-10 transition-all duration-1000",
                isMasterpiece && "h-6 shadow-[0_0_20px_rgba(249,115,22,1)]"
            )}>
                <div
                    className={cn(
                        "h-full bg-gradient-to-r transition-all duration-1000 rounded-full",
                        isMasterpiece ? "from-yellow-500 via-white to-yellow-500 animate-[pulse_1s_infinite] shadow-[0_0_20px_rgba(255,255,255,0.8)]" : "from-red-600 via-orange-500 to-yellow-400"
                    )}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="mt-6 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest transition-all duration-500",
                    isMasterpiece ? "text-yellow-400 text-3xl drop-shadow-[0_0_15px_rgba(250,204,21,1)]" : "text-orange-500"
                )}>
                    {isMasterpiece ? "Masterpiece Forged" : "Forging Identity"}
                </div>
                {!isMasterpiece && <div className="text-xs text-muted-foreground mt-1">Heat level: {progress.toFixed(0)}°C</div>}
            </div>
        </div>
    );
};

// 4. Territory Expansion
export const TerritoryExpansion: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
    const gridRows = 3;
    const gridCols = Math.max(4, Math.ceil(totalTasksCount / 3));
    const totalCells = gridRows * gridCols;
    const progressFill = Math.floor((completedTasksCount / Math.max(totalTasksCount, 1)) * totalCells);
    const isDomination = completedTasksCount > 0 && completedTasksCount === totalTasksCount;

    return (
        <div className="flex flex-col items-center justify-center py-8 relative">
            {isDomination && <div className="absolute inset-0 bg-blue-500/20 blur-[50px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className={cn(
                "grid gap-2 p-3 bg-slate-900 border-2 rounded-xl shadow-xl z-10 transition-all duration-1000",
                isDomination ? "border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.8)] scale-110 bg-blue-900/40" : "border-slate-700"
            )} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                {Array.from({ length: totalCells }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-8 h-8 rounded transition-all",
                            isDomination
                                ? "bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] animate-[pulse_1s_infinite]"
                                : i < progressFill
                                    ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] scale-105 duration-700"
                                    : "bg-slate-800/50 duration-700"
                        )}
                        style={isDomination ? { animationDelay: `${i * 0.1}s` } : undefined}
                    ></div>
                ))}
            </div>

            <div className="mt-8 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500",
                    isDomination ? "text-blue-300 text-3xl drop-shadow-[0_0_15px_rgba(96,165,250,1)]" : "text-blue-500"
                )}>
                    {isDomination ? <Trophy className="animate-bounce" /> : <Map size={20} />}
                    {isDomination ? "Total Domination" : "Territory"}
                </div>
                {!isDomination && <div className="text-sm font-medium text-slate-400 mt-2">{progressFill} / {totalCells} Zones Conquered</div>}
            </div>
        </div>
    );
};

// 5. Heartbeat System
export const HeartbeatSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const [pulse, setPulse] = useState(false);
    const prev = useRef(completedPoints);
    const isFullVitality = progress >= 100;

    useEffect(() => {
        if (completedPoints > prev.current) {
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    const beatDuration = isFullVitality ? '0.6s' : progress > 50 ? '1.2s' : '2s';

    return (
        <div className="flex flex-col items-center justify-center py-12 relative overflow-visible">
            {pulse && !isFullVitality && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/30 blur-3xl rounded-full scale-150 animate-ping pointer-events-none"></div>}
            {isFullVitality && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/20 blur-[60px] rounded-full animate-pulse pointer-events-none"></div>}

            <div
                className={cn(
                    "relative z-10 transition-all duration-500",
                    pulse && !isFullVitality && "scale-125 drop-shadow-[0_0_30px_rgba(239,68,68,1)]",
                    isFullVitality && "scale-150 drop-shadow-[0_0_50px_rgba(239,68,68,1)] text-white"
                )}
                style={{ animation: `heartbeat ${beatDuration} ease-in-out infinite` }}
            >
                <Heart size={isFullVitality ? 100 : 80} fill={isFullVitality ? "#ef4444" : "currentColor"} className={isFullVitality ? "text-red-400" : "text-red-600"} />
                {isFullVitality && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HeartPulse className="text-white w-12 h-12 mix-blend-overlay animate-pulse" />
                    </div>
                )}
            </div>

            <div className="mt-12 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-500",
                    isFullVitality ? "text-red-400 text-3xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "text-red-500"
                )}>
                    {!isFullVitality && <HeartPulse size={20} />}
                    {isFullVitality ? "Full Vitality" : "Signs of Life"}
                </div>
                {!isFullVitality && <div className="text-sm font-medium text-red-500/70 mt-1">{progress.toFixed(0)} BPM</div>}
            </div>
            <style>{`
                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    15% { transform: scale(1.15); }
                    30% { transform: scale(1); }
                    45% { transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
};

// 6. XP Burst + Level Identity
export const XpBurst: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isRelentless = progress >= 100;

    let levelIdentity = "Unstable";
    let levelColor = "text-slate-400";
    let levelNum = 1;

    if (isRelentless) { levelIdentity = "Relentless"; levelColor = "text-purple-300"; levelNum = 10; }
    else if (progress >= 80) { levelIdentity = "Disciplined"; levelColor = "text-blue-400"; levelNum = 8; }
    else if (progress >= 50) { levelIdentity = "Consistent"; levelColor = "text-green-400"; levelNum = 5; }
    else if (progress >= 20) { levelIdentity = "Awakening"; levelColor = "text-yellow-400"; levelNum = 2; }

    return (
        <div className="flex flex-col items-center justify-center py-10 w-full max-w-sm mx-auto relative">
            {isRelentless && <div className="absolute inset-0 bg-purple-500/20 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className="flex items-end justify-between w-full mb-4 px-1 z-10">
                <div className="flex flex-col">
                    {!isRelentless && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</span>}
                    <span className={cn(
                        "text-2xl font-black uppercase tracking-widest transition-all duration-700",
                        levelColor,
                        isRelentless && "text-5xl drop-shadow-[0_0_30px_rgba(192,132,252,1)]"
                    )}>
                        {levelIdentity}
                    </span>
                </div>
                {!isRelentless && (
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase">Level {levelNum}</span>
                    </div>
                )}
            </div>

            <div className={cn(
                "w-full bg-slate-900 border-2 rounded-lg overflow-hidden relative shadow-inner skew-x-[-10deg] transition-all duration-1000 z-10",
                isRelentless ? "h-8 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.8)] scale-105" : "h-6 border-slate-700"
            )}>
                <div
                    className={cn(
                        "h-full bg-gradient-to-r transition-all duration-1000",
                        isRelentless ? "from-purple-600 via-pink-500 to-purple-600 animate-[pulse_1s_infinite]" : "from-blue-600 to-cyan-400"
                    )}
                    style={{ width: `${progress}%` }}
                >
                    <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                    {isRelentless && <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>}
                </div>
            </div>

            <div className="mt-4 z-10">
                {isRelentless ? (
                    <div className="flex gap-1 animate-bounce">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    </div>
                ) : (
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {completedPoints.toFixed(0)} / {totalPoints.toFixed(0)} XP
                    </div>
                )}
            </div>
        </div>
    );
};

// 7. Engine Dashboard
export const EngineDashboard: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const [rpm, setRpm] = useState(0);
    const [isShifting, setIsShifting] = useState(false);
    const prevPointsRef = useRef(completedPoints);

    const progressPercentage = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isMaxGear = progressPercentage >= 100;
    const gear = isMaxGear ? "MAX" : Math.min(Math.floor(progressPercentage / 20) + 1, 6);

    useEffect(() => {
        if (isMaxGear) {
            // Keep it bouncing at redline
            const interval = setInterval(() => {
                setRpm(8500 + Math.random() * 500);
            }, 100);
            return () => clearInterval(interval);
        }

        if (completedPoints > prevPointsRef.current) {
            setRpm(8500);
            setIsShifting(true);
            const shiftTimeout = setTimeout(() => {
                setRpm(1500 + (typeof gear === 'number' ? gear : 6) * 500);
                setIsShifting(false);
            }, 600);
            prevPointsRef.current = completedPoints;
            return () => clearTimeout(shiftTimeout);
        } else if (completedPoints < prevPointsRef.current) {
            prevPointsRef.current = completedPoints;
            setRpm(1000);
            setTimeout(() => setRpm(1500), 400);
        } else {
            setRpm(completedPoints > 0 ? 1500 + (typeof gear === 'number' ? gear : 6) * 400 + Math.random() * 200 - 100 : 0);
        }
    }, [completedPoints, gear, isMaxGear]);

    const calculateRotation = (currentRpm: number) => {
        const minRotation = -120;
        const rpmRatio = Math.min(Math.max(currentRpm / 9000, 0), 1);
        return minRotation + (rpmRatio * 240);
    };

    const needleRotation = calculateRotation(rpm);

    return (
        <div className="w-full max-w-md mx-auto space-y-6 my-6 relative">
            {isMaxGear && <div className="absolute inset-0 bg-red-500/10 blur-[40px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className="relative flex justify-center items-center z-10">
                <div className={cn(
                    "relative w-48 h-48 rounded-full bg-slate-900 border-4 border-slate-800 shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300",
                    isMaxGear ? "shadow-[0_0_60px_rgba(239,68,68,0.8)] border-red-500 animate-pulse" : (isShifting && "shadow-[0_0_40px_rgba(239,68,68,0.5)] border-red-500/50")
                )}>
                    <div className="absolute inset-2 rounded-full border border-slate-700/50"></div>
                    <div className={cn("absolute inset-0 p-4 text-xs font-bold transition-colors", isMaxGear ? "text-red-400" : "text-slate-400")}>
                        <div className="absolute bottom-6 left-6">0</div>
                        <div className="absolute top-12 left-4">3</div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">5</div>
                        <div className="absolute top-12 right-4 text-red-500 font-black scale-125">7</div>
                        <div className="absolute bottom-6 right-6 text-red-500 font-black scale-150">9</div>
                    </div>

                    <div
                        className="absolute w-2 h-24 bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom transition-transform z-10"
                        style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)`, transitionDuration: (isShifting || isMaxGear) ? "100ms" : "800ms" }}
                    >
                        <div className={cn(
                            "w-1 h-20 bg-red-500 mx-auto rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]",
                            (isShifting || isMaxGear) && "bg-white shadow-[0_0_20px_rgba(255,255,255,1)] w-1.5"
                        )}></div>
                    </div>

                    <div className="absolute w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 z-20 flex items-center justify-center shadow-inner"></div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className={cn("font-mono font-bold tracking-tight drop-shadow-md", isMaxGear ? "text-red-500 text-3xl animate-bounce" : "text-white text-xl")}>
                            {isMaxGear ? "MAX" : Math.floor(rpm / 100) * 100}
                        </span>
                        {!isMaxGear && <span className="text-[9px] uppercase tracking-widest text-slate-500">RPM</span>}
                    </div>
                </div>
            </div>

            <div className={cn(
                "bg-card border rounded-xl p-4 space-y-3 z-10 relative transition-all duration-1000",
                isMaxGear ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "shadow-sm"
            )}>
                <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gear</span>
                        <span className={cn("font-bold leading-none transition-all", isMaxGear ? "text-3xl text-red-500 animate-pulse italic" : "text-xl text-primary")}>
                            GEAR {gear}
                        </span>
                    </div>
                    {!isMaxGear && <div className="text-right text-sm font-mono font-bold">{progressPercentage.toFixed(1)}%</div>}
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full transition-all duration-1000 ease-out",
                            isMaxGear ? "bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.8),rgba(0,0,0,0.8)_10px,white_10px,white_20px)] animate-[slide_0.5s_linear_infinite]" : "bg-gradient-to-r from-blue-500 to-red-500"
                        )}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// 8. Daily Boss Fight
export const DailyBossFight: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const bossHp = 100 - progress;
    const isVictory = bossHp <= 0;

    const [hit, setHit] = useState(false);
    const prev = useRef(completedPoints);

    useEffect(() => {
        if (completedPoints > prev.current) {
            setHit(true);
            setTimeout(() => setHit(false), 400);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    return (
        <div className="flex flex-col items-center justify-center py-6 w-full max-w-sm mx-auto relative overflow-visible">
            {isVictory && <div className="absolute inset-0 bg-yellow-400/30 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}

            <div className={cn(
                "font-black uppercase tracking-widest mb-6 flex items-center gap-3 transition-all duration-700 z-10",
                isVictory ? "text-yellow-400 text-4xl drop-shadow-[0_0_20px_rgba(250,204,21,1)]" : "text-red-500 text-xl"
            )}>
                {!isVictory && <Swords />}
                {isVictory ? "VICTORY" : "The Daily Grind"}
                {!isVictory && <Swords />}
            </div>

            <div className="relative mb-10 z-10">
                <div className={cn(
                    "transition-all",
                    isVictory ? "scale-125 drop-shadow-[0_0_40px_rgba(250,204,21,0.5)] duration-1000 translate-y-4" : hit ? "scale-90 translate-x-2 brightness-150 drop-shadow-[0_0_20px_rgba(239,68,68,1)] duration-75" : "drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] duration-500"
                )}>
                    {isVictory ? (
                        <div className="relative flex items-center justify-center">
                            <Skull size={120} className="text-slate-800 opacity-20" strokeWidth={1} />
                            <Trophy size={80} className="absolute text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,1)] animate-bounce" fill="currentColor" />
                        </div>
                    ) : (
                        <div className="relative">
                            <Skull size={100} className="text-slate-800" strokeWidth={1.5} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
                                <Skull size={100} className="text-red-500 opacity-50 blur-sm" />
                            </div>
                        </div>
                    )}
                </div>
                {hit && !isVictory && <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white italic drop-shadow-lg z-10 animate-bounce">CRITICAL!</div>}
                {!isVictory && bossHp > 0 && bossHp <= 15 && <div className="absolute -bottom-8 w-full text-center text-sm font-black text-red-500 animate-pulse uppercase tracking-widest drop-shadow-md">FINISH HIM!</div>}
            </div>

            {!isVictory && (
                <div className="w-full z-10">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2 px-1">
                        <span>Boss HP</span>
                        <span>{bossHp.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-5 bg-slate-900 border-2 border-slate-700 rounded-sm overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-red-600 transition-all duration-500 float-right shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                            style={{ width: `${bossHp}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};
