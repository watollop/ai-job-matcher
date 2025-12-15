


export function Header() {
    return (
        <header className="sticky top-0 z-50 bg-[#111827] border-b border-white/10 text-white">
            <div className="container max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
                    <span className="font-serif font-bold text-lg tracking-tight text-white">jobscorerAI.com</span>
                </div>
            </div>
        </header>
    );
}
