import { Atom } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
            <div className="container max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                        <Atom className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-lg tracking-tight text-foreground">JobMatcher.ai</span>
                </div>
                <nav>
                    <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors font-sans uppercase tracking-widest">
                        Beta v0.1
                    </a>
                </nav>
            </div>
        </header>
    );
}
