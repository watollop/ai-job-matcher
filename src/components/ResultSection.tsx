import { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb, Loader2, Coffee, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export interface ScoringResult {
    // ... existing interface ...
    candidate_profile: {
        name: string;
        current_role: string;
        calculated_experience_years: number;
        cpr_metric: number;
        stability_status: string;
    };
    compatibility_score: {
        total_score: number;
        rating_tier: string;
        vector_breakdown: {
            hard_skills: number;
            experience: number;
            soft_skills: number;
            education: number;
            logistics: number;
        };
    };
    analysis: {
        // ... existing interface ...
        critical_skills_missing: string[] | null;
        proficiency_highlights: string[];
        red_flags: string[];
        reasoning_summary: string;
    };
}

// ... existing props and AdviceCard interface ...
interface ResultSectionProps {
    scoringResult: ScoringResult | null;
    tipsResult: string | null;
    onGenerateTips: () => void;
    isGeneratingTips: boolean;
}

interface AdviceCard {
    title: string;
    reason: string;
    proposal_before: string;
    proposal_after: string;
}

const TOOLTIP_TEXTS: Record<string, string> = {
    hard_skills: "Technical capabilities, tools, and domain expertise required for the role.",
    experience: "Relevance of past roles, career progression, tenure stability, and growth trajectory.",
    soft_skills: "Evidence of leadership, communication, problem-solving, and cultural fit.",
    education: "Academic background, degrees, and relevant certifications.",
    logistics: "Location match, visa/work authorization status, and availability."
};

// ... BuyMeCoffeeButton ...
function BuyMeCoffeeButton() {
    return (
        <a
            href="https://www.buymeacoffee.com/watollop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#FFDD00] text-black font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            style={{ fontFamily: 'Cookie, cursive' }}
        >
            <Coffee className="w-5 h-5" />
            <span className="text-lg">Buy me a coffee</span>
        </a>
    );
}

export function ResultSection({ scoringResult, tipsResult, onGenerateTips, isGeneratingTips }: ResultSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    // ... existing refs and state ...
    const tipsRef = useRef<HTMLDivElement>(null);
    const [showAllTips, setShowAllTips] = useState(false);
    const [isLoadingMoreTips, setIsLoadingMoreTips] = useState(false);

    // ... existing effects ...
    // Auto-scroll to section on score result
    useEffect(() => {
        if (scoringResult && sectionRef.current) {
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [scoringResult]);

    // Auto-scroll to tips on tips result
    useEffect(() => {
        if (tipsResult && tipsRef.current) {
            setTimeout(() => {
                tipsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [tipsResult]);

    // ... existing handleShowMoreTips and parsing logic ...
    const handleShowMoreTips = () => {
        setIsLoadingMoreTips(true);
        setTimeout(() => {
            setIsLoadingMoreTips(false);
            setShowAllTips(true);
        }, 15000); // 15s delay
    };

    if (!scoringResult) return null;

    // --- Tips Parsing Logic ---
    let cards: AdviceCard[] | null = null;
    let isJson = false;
    if (tipsResult) {
        try {
            const cleanResult = tipsResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            cards = JSON.parse(cleanResult);
            isJson = Array.isArray(cards);
        } catch (e) {
            isJson = false;
        }
    }

    const firstFiveCards = cards?.slice(0, 5) || [];
    const remainingCards = cards?.slice(5) || [];
    const hasMoreCards = remainingCards.length > 0;

    const renderCard = (card: AdviceCard, index: number) => (
        <div
            key={index}
            className="group bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden"
        >
            <div className="p-3 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-sm">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground leading-tight">
                            {card.title}
                        </h3>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 ml-0 md:ml-12">
                    {/* Reason */}
                    <div className="bg-secondary/30 rounded-lg p-3 md:p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-3 text-primary/70">
                            <Lightbulb className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Why this matters</span>
                        </div>
                        <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-strong:text-foreground">
                            <ReactMarkdown>{card.reason}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Proposal (Before/After) */}
                    <div className="bg-white rounded-lg p-5 border border-border shadow-sm ring-1 ring-black/5 flex flex-col gap-4">

                        {/* Before Box */}
                        <div className="bg-destructive/10 rounded border border-destructive/20 p-3">
                            <div className="flex items-center gap-1.5 mb-2 text-destructive">
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-destructive/30 px-1 py-0.5 rounded bg-white">Before</span>
                            </div>
                            <div className="text-sm text-foreground/80 leading-relaxed font-mono text-xs opacity-80">
                                <ReactMarkdown>{card.proposal_before}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center -my-2 opacity-30 text-emerald-500">
                            <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>

                        {/* After Box */}
                        <div className="bg-emerald-50/50 rounded border border-emerald-100/60 p-3">
                            <div className="flex items-center gap-1.5 mb-2 text-emerald-700/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-emerald-200 px-1 py-0.5 rounded bg-white">After</span>
                            </div>
                            <div className="text-sm text-foreground/90 leading-relaxed font-medium">
                                <ReactMarkdown>{card.proposal_after}</ReactMarkdown>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );

    const { compatibility_score, analysis } = scoringResult;
    // ... scoreColor, scoreBg, scoreBorder ...
    const scoreColor = compatibility_score.total_score >= 80 ? 'text-emerald-600' : compatibility_score.total_score >= 60 ? 'text-amber-500' : 'text-destructive';
    const scoreBg = compatibility_score.total_score >= 80 ? 'bg-emerald-50' : compatibility_score.total_score >= 60 ? 'bg-amber-50' : 'bg-destructive/5';
    const scoreBorder = compatibility_score.total_score >= 80 ? 'border-emerald-100' : compatibility_score.total_score >= 60 ? 'border-amber-100' : 'border-destructive/10';


    return (
        <div
            ref={sectionRef}
            className="max-w-4xl mx-auto mt-12 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out scroll-mt-24 space-y-12"
        >
            {/* SCORE DASHBOARD */}
            <div className="bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-border/40">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compatibility Analysis</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Score Circle */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={cn("relative w-40 h-40 rounded-full border-8 flex items-center justify-center shadow-inner", scoreBorder, scoreBg)}>
                                <div className="text-center">
                                    <span className={cn("text-5xl font-bold block tracking-tighter", scoreColor)}>
                                        {compatibility_score.total_score}
                                    </span>
                                    <span className="text-xs uppercase font-medium text-muted-foreground mt-1 block">
                                        / 100
                                    </span>
                                </div>
                            </div>
                            <div className={cn("px-4 py-1.5 rounded-full text-sm font-bold border", scoreBg, scoreColor, scoreBorder)}>
                                {compatibility_score.rating_tier}
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="flex-1 w-full space-y-6">
                            <div className="grid gap-4">
                                {Object.entries(compatibility_score.vector_breakdown).map(([key, value]) => (
                                    <div key={key} className="space-y-1.5 group/item">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-1.5 relative">
                                                <span className="font-medium capitalize text-foreground/80">{key.replace('_', ' ')}</span>
                                                <div className="relative group/tooltip">
                                                    <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help hover:text-foreground transition-colors" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                                                        {TOOLTIP_TEXTS[key] || "Category score based on analysis."}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-bold text-foreground">{value}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                                                    value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-indigo-500" : "bg-amber-500"
                                                )}
                                                style={{ width: `${value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="mt-8 pt-6 border-t border-border/50 grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                                <AlertTriangle className="w-4 h-4" />
                                Attention Needed
                            </h4>
                            <ul className="space-y-2 text-sm text-foreground/80">
                                {analysis.critical_skills_missing && analysis.critical_skills_missing.length > 0 && (
                                    <li className="flex gap-2 items-start">
                                        <span className="text-destructive mt-1">•</span>
                                        <span>Missing: <span className="font-medium">{analysis.critical_skills_missing.join(", ")}</span></span>
                                    </li>
                                )}
                                {analysis.red_flags.map((flag, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                        <span className="text-destructive mt-1">•</span>
                                        <span>{flag}</span>
                                    </li>
                                ))}
                                {(!analysis.critical_skills_missing?.length && analysis.red_flags.length === 0) && (
                                    <span className="text-emerald-600 italic">No major red flags detected.</span>
                                )}
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                Key Strengths
                            </h4>
                            <ul className="space-y-2 text-sm text-foreground/80">
                                {analysis.proficiency_highlights.map((highlight, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                        <span className="text-emerald-500 mt-1">•</span>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground bg-secondary/20 p-4 rounded-lg italic">
                        "{analysis.reasoning_summary}"
                    </div>
                </div>

                {/* Call to Action for Tips */}
                <div className="p-6 bg-gray-50 flex flex-col items-center justify-center gap-4 text-center">
                    {!tipsResult && !isGeneratingTips && (
                        <>
                            <p className="text-foreground/80 max-w-lg">
                                Want to improve this score? Our AI can generate specific tailoring advice for your resume.
                            </p>
                            <button
                                onClick={onGenerateTips}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate Optimization Tips
                            </button>
                        </>
                    )}
                    {isGeneratingTips && (
                        <div className="flex items-center gap-3 text-primary animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Analyzing gap and generating specific advice...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* TIPS SECTION */}
            {tipsResult && (
                <div ref={tipsRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-2 mb-6 px-1">
                        <ArrowRight className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {isJson ? `Recommended Improvements` : "Analysis Results"}
                        </h2>
                    </div>

                    {isJson && cards ? (
                        <div className="grid gap-6">
                            {firstFiveCards.map((card, index) => renderCard(card, index))}

                            {hasMoreCards && !showAllTips && (
                                <div className="flex flex-col items-center gap-6 py-8 border-t border-border/50 mt-4">
                                    {isLoadingMoreTips ? (
                                        <>
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="flex items-center gap-3 text-primary">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span className="text-lg font-medium">Preparing more insights...</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground text-center max-w-md">
                                                    While you wait, consider supporting this free tool!
                                                </p>
                                            </div>
                                            <BuyMeCoffeeButton />
                                        </>
                                    ) : (
                                        <div className="flex flex-wrap items-center justify-center gap-4">
                                            <button
                                                onClick={handleShowMoreTips}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                                            >
                                                <span>Show {remainingCards.length} More Tips</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                            <BuyMeCoffeeButton />
                                        </div>
                                    )}
                                </div>
                            )}

                            {showAllTips && remainingCards.map((card, index) => renderCard(card, index + 5))}

                            {showAllTips && (
                                <div className="flex flex-col items-center gap-4 py-8 border-t border-border/50 mt-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Found these tips helpful? Support the creator!
                                    </p>
                                    <BuyMeCoffeeButton />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 prose prose-slate max-w-none">
                            <ReactMarkdown>{tipsResult}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
