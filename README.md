# SkillMirror AI

AI-powered resume analysis and career tools to help you land your dream job.

## Project Info

**Tech Stack**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase

## Features

- Resume analysis with AI-powered insights
- ATS score checking
- Resume rewriting and optimization
- Career roadmap generation
- Skill gap analysis
- Cover letter generation

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Database Setup

Run the SQL migrations in `supabase/migrations/` to set up:
- Profiles table
- Analyses table
- User sessions tracking
- Activity logging

## Deployment

Build the project:
```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting platform.

## License

Private - SkillMirror AI
