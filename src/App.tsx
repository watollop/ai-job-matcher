import { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { extractTextFromPDF } from './utils/pdfParser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AlertCircle, Github, Linkedin } from 'lucide-react';

// Simple string hash function
const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // Convert to 32bit integer
  }
  return hash.toString();
};

function App() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // New Interfaces for Scoring
  interface ScoringResult {
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
      critical_skills_missing: string[] | null;
      proficiency_highlights: string[];
      red_flags: string[];
      reasoning_summary: string;
    };
    analysis: {
      critical_skills_missing: string[] | null;
      proficiency_highlights: string[];
      red_flags: string[];
      reasoning_summary: string;
    };
  }

  const [jobOffer, setJobOffer] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [tipsResult, setTipsResult] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
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

  const handleCalculateScore = async () => {
    if (!apiKey) {
      setError('Environment variable VITE_GEMINI_API_KEY is missing.');
      return;
    }
    if (!jobOffer || !cvFile) {
      setError('Please provide both the Job Description and your Resume.');
      return;
    }

    setIsScoring(true);
    setError(null);
    setScoringResult(null);
    setTipsResult(null);

    try {
      const cvText = await extractTextFromPDF(cvFile);
      // ... existing validation checks ...
      if (!cvText || cvText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from PDF. It might be a scanned image or empty. Please use a text-based PDF.');
      }

      // Check Cache
      const cacheKey = `jobscorer_score_${generateHash(jobOffer + cvText)}`;
      const cachedResult = localStorage.getItem(cacheKey);

      if (cachedResult) {
        console.log("Using cached score result");
        const parsed = JSON.parse(cachedResult);
        setScoringResult(parsed);
        setIsScoring(false);
        return;
      }

      // Heuristic Checks
      const cvKeywords = ['experience', 'education', 'skills', 'work history', 'employment', 'summary', 'profile', 'contact', 'curriculum', 'resume'];
      if (!cvKeywords.some(keyword => cvText.toLowerCase().includes(keyword))) {
        throw new Error('The uploaded document does not appear to be a CV/Resume.');
      }

      const jobKeywords = ['responsibilities', 'qualifications', 'requirements', 'skills', 'experience', 'role', 'team', 'work', 'job', 'position', 'duties', 'about us'];
      if (!jobKeywords.some(keyword => jobOffer.toLowerCase().includes(keyword)) || jobOffer.trim().length < 20) {
        throw new Error('The text provided does not look like a Job Description.');
      }


      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0, responseMimeType: "application/json" } });

      // PROMPT: Scoring Only (Fast)
      const scoringPrompt = `
      ROLE AND OBJECTIVE
      You are the "Algorithmic Auditor" and "Resume Optimizer." Your goal is to:
      1. QUANTIFY candidate compatibility (0-100) using a strict Multi-Vector Hub Model.
      2. Analyze GAPS for downstream optimization.

      INPUT DATA
      Job Description:
      ${jobOffer}

      Resume Content:
      ${cvText}

      --------------------------
      PART 1: SCORING ALGORITHM
      --------------------------
      VECTOR 1: Hard Skill Proficiency (Weight: 35%)
      Do not check keyword presence. Score based on context:
      Novice (0.5x), Competent (1.0x), Proficient (1.5x), Expert (2.0x).
      CRITICAL: If a "Must-Have" skill is missing, apply -15 point penalty.

      VECTOR 2: Experience & Trajectory (Weight: 30%)
      Relevance Filter: Only count years if "Direct" or "Transferable".
      CPR: (Promotions / Role Changes). Bonus +5 if CPR > 0.5.
      Stability: Tenure < 18 months = -10 point penalty.
      Gap Analysis: Penalize "Unexplained Gaps" > 6 months (-5 points).
      Concurrent Roles: Do not penalize overlapping dates. Treat simultaneous roles as positive evidence of work capacity or side projects.

      VECTOR 3: Behavioral Evidence (Weight: 15%)
      Score based on evidence ("Led", "Resolved"), not self-reports. 0 if no evidence found.

      VECTOR 4: Education & Certifications (Weight: 10%)
      Degree Match: Exact (100%), Related (75%), Lower (50%), Unrelated (25%).
      Obsolescence: >4 years old certs = 50% value.

      VECTOR 5: Operational Logistics (Weight: 10%)
      Location/Visa match. Fail = 0 points.

      CALCULATION LOGIC
      Raw Score -> Weighted Sum -> Penalties -> Final Constraint (0-100).
      Rounding Constraint: You MUST round the final Total Score AND each individual Vector Score to the nearest multiple of 10 (e.g., 68 -> 70, 72 -> 70, 0, 10, 20...). Never return a number like 65 or 68.

      OUTPUT FORMAT (JSON ONLY)
      {
        "candidate_profile": { ... },
        "compatibility_score": { ... },
        "analysis": { ... },
      }
      Analysis Schema:
      { "candidate_profile": { "name": "String", "current_role": "String", "calculated_experience_years": "Number", "cpr_metric": "Float", "stability_status": "String" }, "compatibility_score": { "total_score": "Number", "rating_tier": "String", "vector_breakdown": { "hard_skills": "Number", "experience": "Number", "soft_skills": "Number", "education": "Number", "logistics": "Number" } }, "analysis": { "critical_skills_missing": ["String"], "proficiency_highlights": ["String"], "red_flags": ["String"], "reasoning_summary": "String" } }
      `;

      const result = await model.generateContent(scoringPrompt);
      const response = await result.response;
      const jsonText = response.text();
      const parsedResult = JSON.parse(jsonText);

      // Save to Cache
      localStorage.setItem(cacheKey, JSON.stringify(parsedResult));

      setScoringResult(parsedResult);

    } catch (err: any) {
      console.error('Error during scoring:', err);
      setError(err.message || 'An unexpected error occurred during scoring.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleGenerateTips = async () => {
    if (!apiKey || !cvFile || !jobOffer || !scoringResult) return;

    setIsGeneratingTips(true);
    setError(null);

    // Minimum delay to ensure "Support" message is seen, even if API is fast
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 6000));

    try {
      const cvText = await extractTextFromPDF(cvFile);

      // Check Cache
      const cacheKey = `jobscorer_tips_${generateHash(jobOffer + cvText)}`;
      const cachedResult = localStorage.getItem(cacheKey);

      if (cachedResult) {
        console.log("Using cached tips result");
        await minDelayPromise; // Wait for delay
        setTipsResult(cachedResult);
        setIsGeneratingTips(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.7, responseMimeType: "application/json" } });

      const tipsPrompt = `
      ROLE: expert HR Recruiter and Resume Optimizer.
      TASK: Generate exactly 10 impactful resume optimization tips to bridge the gap between candidate and job.

      CONTEXT FROM ANALYSIS:
      - Missing Skills: ${scoringResult.analysis.critical_skills_missing?.join(', ') || "None"}
      - Red Flags: ${scoringResult.analysis.red_flags.join(', ') || "None"}

      INPUT DATA:
      JOB DESCRIPTION:
      ${jobOffer}

      RESUME CONTENT:
      ${cvText}

      INSTRUCTIONS:
      1. Address the "Missing Skills" and "Red Flags" immediately in the first 3-4 tips.
      2. Provide concrete rewrite proposals.

      OUTPUT FORMAT (JSON ARRAY):
      [
        {
          "title": "String",
          "reason": "String",
          "proposal_before": "String",
          "proposal_after": "String"
        },
        ...
      ]
      `;

      // Run API call and Delay in parallel
      const [result] = await Promise.all([
        model.generateContent(tipsPrompt),
        minDelayPromise
      ]);

      const response = await result.response;
      const text = response.text();

      // Save to Cache
      localStorage.setItem(cacheKey, text);

      setTipsResult(text);

    } catch (err: any) {
      console.error('Error generating tips:', err);
      setError(err.message || 'Could not generate optimization tips.');
    } finally {
      setIsGeneratingTips(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/10 selection:text-primary">
      <Header />

      <section className="w-full py-16 md:py-24 pb-32 relative overflow-hidden border-b-4 border-[#7C3AED]" style={{ background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #312e81 100%)' }}>
        {/* Animated glow effect */}
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, hsl(262 83% 58% / 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(280 70% 60% / 0.2) 0%, transparent 50%)' }}></div>
        <div className="container max-w-5xl mx-auto px-4 md:px-6 text-center space-y-6 relative z-10">
          <h1 className="text-3xl md:text-6xl font-serif font-medium tracking-tight text-white text-balance">
            AI-Powered Resume Alignment
          </h1>
          <p className="text-lg text-white/85 leading-relaxed font-sans max-w-2xl mx-auto font-light">
            Drop your resume and a job description. Our AI analyzes the alignment and gives you 5 actionable tips to <span className="font-bold text-white underline decoration-[#7C3AED] decoration-4 underline-offset-4">triple your interview chances</span>
          </p>
        </div>
      </section>

      <main className="container max-w-5xl mx-auto px-4 md:px-6 relative z-10 pb-20">
        <div className="mt-4 max-w-3xl mx-auto">
          <div className="bg-background rounded-2xl shadow-xl p-6 md:p-8 border border-border/50">
            {error && (
              <div className="mb-8 bg-destructive/5 border border-destructive/20 p-4 rounded-lg flex items-start gap-3 shadow-sm bg-white">
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
              onAnalyze={handleCalculateScore}
              isLoading={isScoring}
            />
          </div>
        </div>

        <ResultSection
          scoringResult={scoringResult}
          tipsResult={tipsResult}
          onGenerateTips={handleGenerateTips}
          isGeneratingTips={isGeneratingTips}
        />

        {/* Footer */}
        <footer className="mt-20 border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a href="https://github.com/watollop/ai-job-matcher" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span>View Source</span>
            </a>
            <a href="https://www.linkedin.com/in/jordi-llopez/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <span>Jordi Llopez</span>
            </a>
          </div>
          <p>© {new Date().getFullYear()} Job Scorer AI. Built with Gemini 2.5 Flash.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
