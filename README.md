# Job Scorer AI

**Job Scorer AI** is an intelligent resume optimization tool that uses Google's Gemini Flash model to analyze the compatibility between a CV and a Job Description. 

It goes beyond simple keyword matching by using a **Multi-Vector Scoring Engine** to evaluate Hard Skills, Experience, Behavioral Evidence, Education, and Logistics.

## Features

- **Compatibility Scoring Engine**: instant 0-100 score based on 5 deep-analysis vectors.
- **Detailed Vector Breakdown**: Visual gauge and bar charts showing exactly where you stand.
- **Actionable Analysis**: Highlights "Key Strengths" and "Attention Needed" (missing skills, red flags).
- **Optimization Tips**: Generates specific, before/after examples to tailor your resume for the role.
- **Smart Caching**: Results are cached locally (localStorage) for instant re-analysis of the same documents.
- **Privacy First**: No data is stored on our servers.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React
- **AI**: Google Gemini API (gemini-2.5-flash)
- **PDF Parsing**: pdf.js

## Author

**Jordi Llopez**
- [LinkedIn](https://www.linkedin.com/in/jordi-llopez/)
- [GitHub](https://github.com/watollop/ai-job-matcher)

