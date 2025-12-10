import { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { extractTextFromPDF } from './utils/pdfParser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AlertCircle } from 'lucide-react';

function App() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [jobOffer, setJobOffer] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported. Please upload a valid PDF.');
      setCvFile(null);
      return;
    }
    setCvFile(file);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Environment variable VITE_GEMINI_API_KEY is missing.');
      return;
    }
    if (!jobOffer || !cvFile) {
      setError('Please provide both the Job Description and your Resume.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const cvText = await extractTextFromPDF(cvFile);

      if (!cvText || cvText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from PDF. It might be a scanned image or empty. Please use a text-based PDF.');
      }

      // Heuristic: Check for common CV keywords
      const cvKeywords = ['experience', 'education', 'skills', 'work history', 'employment', 'summary', 'profile', 'contact', 'curriculum', 'resume'];
      const hasKeywords = cvKeywords.some(keyword => cvText.toLowerCase().includes(keyword));

      if (!hasKeywords) {
        throw new Error('The uploaded document does not appear to be a CV/Resume. We couldn\'t find common sections like "Experience", "Education", or "Skills".');
      }

      // Heuristic: Check for common Job Description keywords
      const jobKeywords = ['responsibilities', 'qualifications', 'requirements', 'skills', 'experience', 'role', 'team', 'work', 'job', 'position', 'duties', 'about us'];
      const hasJobKeywords = jobKeywords.some(keyword => jobOffer.toLowerCase().includes(keyword));

      if (!hasJobKeywords || jobOffer.trim().length < 20) {
        throw new Error('The text provided does not look like a Job Description. Please ensure it contains details about the role, requirements, or responsibilities.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      const generateWithFallback = async (currentPrompt: string) => {
        try {
          // Try primary model
          console.log("Attempting with model: gemini-2.5-flash");
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          return await model.generateContent(currentPrompt);
        } catch (error: any) {
          // Check for 503 or overload error
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            console.log('Primary model overloaded, switching to fallback setup...');
            console.log("Attempting with fallback model: gemini-2.5-flash-lite");
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            return await fallbackModel.generateContent(currentPrompt);
          }
          throw error;
        }
      };

      const systemPrompt = `
Act as an expert HR Recruiter and Resume Optimizer. I will provide a Job Description and a Generic Resume. 
Your task is to analyze the gap between the two and provide strictly the top 5 most impactful changes to tailor the resume for this specific role.

Output Requirement:
- Return ONLY a valid JSON array. Do not wrap it in markdown code blocks (e.g. no \`\`\`json).
- The array must contain exactly 5 objects.
- Each object must have exactly these keys:
  - "title": (String) A short, punchy headline of what to change.
  - "reason": (String) Why this change increases the chances of getting an interview.
  - "proposal_before": (String) The value/text as it currently appears (or 'N/A' if missing).
  - "proposal_after": (String) The optimized rewrite or addition.

JOB DESCRIPTION:
${jobOffer}

RESUME CONTENT:
${cvText}
      `;

      const result = await generateWithFallback(systemPrompt);
      const response = await result.response;
      const text = response.text();

      setResult(text);
    } catch (err: any) {
      console.error('Error during analysis:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/10 selection:text-primary">
      <Header />

      <main className="container max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground text-nowrap">
            Align perfectly with the role.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-sans max-w-lg mx-auto">
            Intelligent analysis to bridge the gap between your experience and the job requirements.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-destructive/5 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Unable to process</h3>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <InputSection
          jobOffer={jobOffer}
          setJobOffer={setJobOffer}
          fileName={cvFile ? cvFile.name : null}
          onFileUpload={handleFileUpload}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />

        <ResultSection result={result || ''} />
      </main>
    </div>
  );
}

export default App;
