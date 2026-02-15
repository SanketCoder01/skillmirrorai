

# SkillMirror AI – Intelligent Career Copilot

## Overview
A futuristic AI-powered career analysis SaaS app with 3D visuals, glassmorphism design, and real AI-powered resume analysis using Lovable AI (Gemini). Dark neon theme throughout.

---

## Phase 1: Foundation & Design System

### Futuristic Dark Theme
- Neon gradient color palette (cyan, purple, pink accents on dark backgrounds)
- Glassmorphism card styles with backdrop blur and subtle borders
- Custom CSS variables for the dark futuristic theme
- Smooth page transitions using Framer Motion `AnimatePresence`

### Layout & Navigation
- Glass-style top navbar with logo, nav links, and auth buttons
- Responsive sidebar on dashboard pages
- Footer with links and branding

---

## Phase 2: Landing Page (Hackathon Hero)

### 3D Hero Section
- Animated 3D rotating holographic resume card using React Three Fiber (`@react-three/fiber@^8.18`, `three@>=0.133`, `@react-three/drei@^9.122.0`)
- Floating glowing particle background in 3D canvas
- Gradient animated headline: "Your AI Career Copilot"
- Subheading: "Analyze. Optimize. Dominate Your Dream Job."
- Two CTA buttons: "Start Free Analysis" and "Watch Demo"

### Animated Stats Section
- Three glass cards with animated counters: 92% Accuracy, 50K+ Resumes Analyzed, 120+ Career Fields
- Scroll-triggered fade-in animations

### AI Intelligence Timeline
- Step-by-step animated timeline: Upload → AI Analysis → Match Score → Career Plan
- Each step revealed on scroll with Framer Motion

### 3D Skill Galaxy Preview
- Interactive 3D node visualization showing sample skills floating in space
- Green glowing nodes (matched) and red glowing nodes (missing)

### Testimonials Section
- Animated carousel of testimonial cards with glassmorphism styling

### Live Demo Preview
- Animated mockup of the dashboard with typing effects

---

## Phase 3: Authentication

### Lovable Cloud Auth
- Email/password signup and login using Supabase Auth (via Lovable Cloud)
- User profiles table (name, email, created_at)
- Protected dashboard routes — redirect to login if unauthenticated
- Auth state management with `onAuthStateChange`

---

## Phase 4: Dashboard – Core AI Analysis

### Upload & Input Section
- PDF resume upload with drag-and-drop zone
- Job description textarea
- Optional LinkedIn profile URL input
- Animated "Analyze" button with glow effect

### AI Processing Animation
- Full-screen overlay during analysis
- Typing animation: "Gemini AI is evaluating your profile..."
- Pulsing neural network/brain animation

### Backend Edge Function
- Edge function to receive resume text + job description
- Call Lovable AI gateway (Gemini) with structured prompt
- Return JSON with: resumeSkills, jobSkills, matchedSkills, missingSkills, matchScore, ATSScore, careerFieldSuggestions, strengthsSummary, weaknessesSummary, suggestedProjects, certificationRecommendations, salaryInsight, jobLevelFit, 30DayRoadmap

### Note on PDF Parsing
- Extract text from PDF on the client side using a browser-compatible library (pdf.js) since edge functions can't run pdf-parse
- Send extracted text to the edge function for AI analysis

---

## Phase 5: Results Dashboard (Premium Animated)

### Score Cards
- Animated circular progress for Match Score and ATS Score
- Job Level Fit badge (Junior/Mid/Senior)
- Salary Insight card with gradient styling
- Resume Rank Badge (Beginner/Rising/Pro/Elite) based on scores

### Skill Analysis
- Interactive 3D Skill Map showing matched (green) vs missing (red) skills
- Skill Heatmap — horizontal bar chart showing strength levels per skill
- Career Field Suggestions as animated tags

### Summary Sections
- Strengths and Weaknesses summaries in glass cards
- Certification Recommendations list
- Suggested Projects with descriptions

### 30-Day Roadmap
- Timeline/accordion view with daily/weekly milestones
- Animated reveal on scroll

### Bonus AI Features
- Career Path Predictor — next 3 suggested job roles
- AI Resume Rewrite Suggestions — improved bullet points
- Market Demand Indicator — High/Medium/Low badges per field

---

## Phase 6: History & Persistence

### Analysis History Page
- List of past analyses stored in Lovable Cloud database
- Each entry shows date, job title, match score
- Actions: View full results, Delete, Re-analyze
- Animated list with Framer Motion

### Database Tables
- `analyses` table: user_id, resume_text, job_description, linkedin_url, results_json, created_at
- RLS policies so users only see their own data

---

## Phase 7: Settings Page

- Dark mode toggle (default dark, option for light)
- Update display name
- Clear all analysis history
- Delete account (with confirmation)

---

## Phase 8: PDF Export

### Professional Report Generation
- Generate PDF using jsPDF on the client side
- Includes: User name, date, match score, ATS score, skill breakdown, missing skills, career fields, salary insight, suggested projects, 30-day roadmap
- Clean formatted layout with headings and sections
- Download button on results page

---

## Design Summary
- **Theme**: Dark futuristic with neon cyan/purple/pink gradients
- **Cards**: Glassmorphism with backdrop-blur, subtle glow borders
- **Animations**: Framer Motion throughout — page transitions, scroll reveals, hover effects
- **3D**: Three.js hero section, skill galaxy, floating particles
- **Responsive**: Mobile-first, works beautifully on all screen sizes
- **Typography**: Clean sans-serif with gradient text accents

