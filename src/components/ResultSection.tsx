import { useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultSectionProps {
    result: string;
}

interface AdviceCard {
    title: string;
    reason: string;
    proposal_before: string;
    proposal_after: string;
}

export function ResultSection({ result }: ResultSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && sectionRef.current) {
            // Small timeout to ensure DOM is ready and animation has started
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [result]);

    if (!result) return null;

    let cards: AdviceCard[] | null = null;
    let isJson = false;

    try {
        // Attempt to parse JSON (sometimes models wrap in code blocks despite instructions)
        const cleanResult = result.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cards = JSON.parse(cleanResult);
        isJson = Array.isArray(cards);
    } catch (e) {
        // Fallback to markdown view if parsing fails
        isJson = false;
    }

    return (
        <div
            ref={sectionRef}
            className="max-w-4xl mx-auto mt-12 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out scroll-mt-24"
        >
            <div className="flex items-center gap-2 mb-6 px-1">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {isJson ? "Top 5 Optimization Actions" : "Analysis Results"}
                </h2>
            </div>

            {isJson && cards ? (
                <div className="grid gap-6">
                    {cards.map((card, index) => (
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
                    ))}
                </div>
            ) : (
                // Fallback for non-JSON response
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 prose prose-slate max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

