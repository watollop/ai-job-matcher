import { Loader2, Coffee } from 'lucide-react';

interface LoadingWithSupportProps {
    message: string;
}

export function LoadingWithSupport({ message }: LoadingWithSupportProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg font-medium animate-pulse">{message}</span>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                    While you wait, consider supporting this free tool!
                </p>
            </div>

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
        </div>
    );
}
