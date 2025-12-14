import { useRef, useState, useEffect } from 'react';
import { Upload, FileText, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingWithSupport } from './LoadingWithSupport';

interface InputSectionProps {
    jobOffer: string;
    setJobOffer: (offer: string) => void;
    fileName: string | null;
    onFileUpload: (file: File) => void;
    onAnalyze: () => void;
    isLoading: boolean;
}

const LOADING_MESSAGES = [
    "Reading Resume...",
    "Analyzing Job Description...",
    "Comparing Experience...",
    "Generating Insights...",
    "Polishing Suggestions..."
];

export function InputSection({
    jobOffer,
    setJobOffer,
    fileName,
    onFileUpload,
    onAnalyze,
    isLoading
}: InputSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        if (!isLoading) {
            setLoadingText(LOADING_MESSAGES[0]);
            return;
        }

        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingText(LOADING_MESSAGES[index]);
        }, 5000);

        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Job Offer Input */}
            <div className="group space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-foreground/80">
                    <Briefcase className="w-4 h-4" />
                    <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Job Description</h2>
                    <span className="text-xs text-muted-foreground/60 ml-auto italic">
                        Note: We only support English at this time.
                    </span>
                </div>
                <div className="relative">
                    <textarea
                        className="w-full h-48 rounded-xl bg-white border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all p-3 md:p-5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring/20 placeholder:text-muted-foreground/80"
                        placeholder="Paste the job offer details here..."
                        value={jobOffer}
                        onChange={(e) => setJobOffer(e.target.value)}
                    />
                </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground/80">
                    <FileText className="w-4 h-4" />
                    <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Your Resume</h2>
                </div>

                <div
                    className={cn(
                        "relative group cursor-pointer overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white hover:bg-gray-50/50 transition-all duration-300",
                        fileName ? "border-green-200 bg-green-50/30" : ""
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                    />

                    <div className="flex items-center justify-between p-3 md:p-4 min-h-[80px]">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                fileName ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                            )}>
                                {fileName ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-medium text-sm text-foreground">
                                    {fileName || "Click to upload PDF"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {fileName ? "Ready for analysis" : "Maximum file size 10MB"}
                                </p>
                            </div>
                        </div>
                        {fileName && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                                Uploaded
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 space-y-3">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || !jobOffer || !fileName}
                    className={cn(
                        "w-full h-12 rounded-lg text-sm font-medium shadow-md transition-all",
                        isLoading ? "hidden" : "",
                        !jobOffer || !fileName
                            ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
                    )}
                >
                    Check Compatibility
                </button>
                {isLoading && (
                    <div className="pt-2">
                        <LoadingWithSupport message={loadingText} />
                    </div>
                )}
                <p className="text-xs text-center text-muted-foreground/70">
                    🔒 Your data stays private — we don't store your resume or job descriptions.
                </p>
            </div>
        </div>
    );
}
