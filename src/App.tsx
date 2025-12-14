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
  }

  const [jobOffer, setJobOffer] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [tipsResult, setTipsResult] = useState<string | null>(null); // Renamed from result
  // Keep isLoading for generic loading state, or split if needed
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
        setScoringResult(JSON.parse(cachedResult));
        setIsScoring(false);
        return;
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0, responseMimeType: "application/json" } });

      const scoringPrompt = `
      ROLE AND OBJECTIVE
      You are the "Algorithmic Auditor," an expert AI recruitment engine designed to quantify candidate compatibility with zero bias. Your goal is to compare a Job Description (JD) against a Candidate Resume (CV) and generate a precise Compatibility Score (0-100) using a strict Multi-Vector Scoring Model.

      INPUT DATA
      Job Description:
      ${jobOffer}

      Resume Content:
      ${cvText}

      SCORING ALGORITHM (5 VECTORS)
      You must analyze the candidate across 5 specific vectors. Use the specific weights and logic defined below.

      VECTOR 1: Hard Skill Proficiency (Weight: 35%)
      Do not simply check for keyword presence. You must score skills based on the Contextual Proficiency Scale:
      Novice (0.5x): Skill appears in a list only; no context provided.
      Competent (1.0x): Skill appears with standard action verbs ("Used", "Assisted").
      Proficient (1.5x): Skill linked to quantifiable outcomes ("Built", "Reduced latency by 20%").
      Expert (2.0x): Skill linked to strategy or leadership ("Architected", "Mentored team"). CRITICAL: If a "Must-Have" skill from the JD is entirely missing (and no semantic equivalent is found), apply a -15 point penalty to the final score.

      VECTOR 2: Experience & Trajectory (Weight: 30%)
      Relevance Filter: Only count years of experience if the role is a "Direct" or "Transferable" match to the JD. Ignore unrelated roles.
      Career Path Ratio (CPR): Calculate CPR = (Total Promotions / Total Role Changes).
      Bonus: If CPR > 0.5 (demonstrates high growth), add +5 points to this vector.
      Stability Risk: If average tenure is < 18 months (excluding explicit contract/internship roles), apply a -10 point penalty to the final score.
      Gap Analysis: Ignore gaps labeled "Sabbatical", "Education", or "Caregiving". Penalize "Unexplained Gaps" > 6 months (-5 points).

      VECTOR 3: Behavioral Evidence (Weight: 15%)
      Ignore self-reported traits (e.g., "I am a leader"). Score based on Behavioral Evidence found in the text:
      Look for evidence of: Leadership ("Led", "Oversaw"), Problem Solving ("Resolved", "Optimized"), and Communication ("Presented", "Negotiated").
      If the JD requires a soft skill but no behavioral evidence is found in the CV, score 0 for that trait.

      VECTOR 4: Education & Certifications (Weight: 10%)
      Degree Match: Exact match (100%), Related field (75%), Lower level (50%), Unrelated (25%).
      Obsolescence: If a required technical certification is >4 years old and has not been renewed, reduce its value by 50%.

      VECTOR 5: Operational Logistics (Weight: 10%) - THE KNOCK-OUT GATES
      This is binary. If a candidate fails a Knock-Out constraint, the Logistics score is 0.
      Location: Is the candidate in the required region? (Or "Willing to relocate").
      Visa/Work Authorization: If JD says "No Sponsorship" and candidate requires it, Score = 0.

      CALCULATION LOGIC
      Calculate a raw score (0-100) for each Vector.
      Apply Weights: (V1*0.35) + (V2*0.30) + (V3*0.15) + (V4*0.10) + (V5*0.10).
      Apply Penalties: Subtract points for Missing Critical Skills, Job Hopping, or Unexplained Gaps.
      Final Score Constraint: The score cannot be < 0 or > 100.

      OUTPUT FORMAT (JSON ONLY)
      Respond only with a valid JSON object. Do not include markdown formatting or chat.
      { "candidate_profile": { "name": "String (Anonymized if preferred)", "current_role": "String", "calculated_experience_years": "Number (Relevance Filtered)", "cpr_metric": "Float (0.0 - 1.0)", "stability_status": "String (Stable/Job Hopper/Contractor)" }, "compatibility_score": { "total_score": "Number (0-100)", "rating_tier": "String (Top Tier/Strong Contender/Potential Fit/Mismatch)", "vector_breakdown": { "hard_skills": "Number (0-100)", "experience": "Number (0-100)", "soft_skills": "Number (0-100)", "education": "Number (0-100)", "logistics": "Number (0-100)" } }, "analysis": { "critical_skills_missing": ["List strings or null"], "proficiency_highlights": ["List top 3 'Expert' level skills found"], "red_flags": ["List penalties applied or logistics failures"], "reasoning_summary": "String (Max 50 words explaining the score calculation)" } }
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
    if (!apiKey || !cvFile || !jobOffer) return;

    setIsGeneratingTips(true);
    setError(null);

    try {
      const cvText = await extractTextFromPDF(cvFile);

      // Check Cache
      const cacheKey = `jobscorer_tips_${generateHash(jobOffer + cvText)}`;
      const cachedResult = localStorage.getItem(cacheKey);

      if (cachedResult) {
        console.log("Using cached tips result");
        setTipsResult(cachedResult);
        setIsGeneratingTips(false);
        return;
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
          Your task is to analyze the gap between the two and provide strictly the top 10 most impactful changes to tailor the resume for this specific role.
    
          ${scoringResult ? `
          PRIORITY INSTRUCTIONS:
          An initial algorithmic analysis has detected the following specific weaknesses in the candidate's profile. You MUST address these in your tips if they are relevant:
          - Missing Critical Skills: ${scoringResult.analysis.critical_skills_missing?.join(', ') || "None predicted"}
          - Red Flags/Risks: ${scoringResult.analysis.red_flags.join(', ') || "None predicted"}
          
          Ensure your first few tips explicitly suggest how to add or demonstrate these missing skills/mitigate these risks.
          ` : ''}

          Output Requirement:
          - Return ONLY a valid JSON array. Do not wrap it in markdown code blocks (e.g. no \`\`\`json).
          - The array must contain exactly 10 objects.
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

      <section className="w-full py-16 md:py-24 pb-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(250 60% 50%), hsl(280 70% 55%), hsl(250 80% 45%))' }}>
        {/* Animated glow effect */}
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, hsl(185 80% 60% / 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(280 70% 60% / 0.3) 0%, transparent 50%)' }}></div>
        <div className="container max-w-5xl mx-auto px-4 md:px-6 text-center space-y-6 relative z-10">
          <h1 className="text-3xl md:text-6xl font-serif font-medium tracking-tight text-white text-nowrap">
            AI-Powered Resume Alignment
          </h1>
          <p className="text-lg text-white/85 leading-relaxed font-sans max-w-2xl mx-auto font-light">
            Drop your resume and a job description. Our AI analyzes the alignment and gives you 5 actionable tips to <span className="font-semibold text-cyan-300">triple your interview chances</span>
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
