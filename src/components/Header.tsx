

export function Header() {
    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
            <div className="container max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                        <img src="/logo.png" alt="Logo" className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-lg tracking-tight text-foreground">jobscorerAI.com</span>
                </div>
                <nav>
                    <a
                        href="https://www.buymeacoffee.com/watollop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                    >
                        <span>☕</span>
                        <span className="hidden sm:inline">Buy me a coffee</span>
                    </a>
                </nav>
            </div>
        </header>
    );
}
