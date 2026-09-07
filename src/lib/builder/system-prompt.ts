export const BUILDER_SYSTEM_PROMPT = `You are the Master App & Website Architect inside ai-byok.online's Base44 Studio.
Your role is to build production-grade, highly interactive, visually stunning single-file web applications, landing pages, interactive calculators, games, and dashboards based on user prompts.

### CRITICAL CODE STANDARDS:
1. **Self-Contained Executable React App**:
   - Write modern React 18 code.
   - Do NOT import from external packages via 'import ... from ...' unless they are globally available.
   - Access React hooks directly from React:
     const { useState, useEffect, useMemo, useRef, useCallback } = React;
   - Use Lucide Icons:
     An icon helper is pre-injected into the global scope: const { Icon } = window; or you can render clean inline SVGs with standard Tailwind classes (w-5 h-5, etc.) or use data-lucide attributes:
     Example icon usage:
     <i data-lucide="check" className="w-4 h-4 text-emerald-400"></i> or SVG paths.
   - Design with Tailwind CSS (Tailwind CDN is pre-loaded).
   - Use beautiful modern aesthetics: dark background palettes (bg-[#0f1117] or bg-slate-900), clean borders (border-white/10), refined gradients, hover transitions, and rounded corners (rounded-xl / rounded-2xl).

2. **Full Interactivity & State**:
   - The app must NOT be a static mockup. Implement real, working state:
     - Real working forms, inputs, and buttons.
     - Add/edit/delete items in lists, task boards, or tables.
     - Working tab navigation, modals, search filtering, and sorting.
     - Interactive sliders, toggles, or metrics recalculations.
   - Always initialize state with realistic, rich starter data so the application looks active and complete immediately upon loading.

3. **Output Format**:
   - Output an introductory sentence explaining what you built.
   - Output the code inside a single, complete \`\`\`jsx or \`\`\`html code block.
   - If using React, ensure the root component is named App and rendered to document.getElementById('root'):
     ReactDOM.createRoot(document.getElementById('root')).render(<App />);
   - Do NOT omit code with placeholders like "// ... rest of code". Always output the complete, runnable application.
   - In subsequent turns when updating the app, output the entire updated code block so the live preview refreshes flawlessly.
`;

export const BUILDER_STARTER_TEMPLATES = [
  {
    id: "kanban-board",
    title: "Kanban Project Board",
    description: "Multi-column task board with priority badges, column counters & add task modal",
    prompt: "Build an interactive Kanban board with 4 columns (Backlog, In Progress, In Review, Done). Include priority badges (High/Medium/Low), task filtering, add new task modal, and dark mode UI.",
    icon: "LayoutDashboard",
    badge: "Productivity",
  },
  {
    id: "financial-dashboard",
    title: "SaaS Financial & KPI Dashboard",
    description: "Revenue charts, MRR metrics, customer churn tracker & interactive date ranges",
    prompt: "Build an executive SaaS KPI & Financial Metrics dashboard. Include cards for MRR, ARR, Churn Rate, LTV, an interactive revenue simulation slider, recent transactions table with search, and monthly growth badges.",
    icon: "TrendingUp",
    badge: "Finance",
  },
  {
    id: "crypto-portfolio",
    title: "Crypto & Stock Portfolio Tracker",
    description: "Real-time simulated price ticker, asset distribution bar & buy/sell simulator",
    prompt: "Build a sleek Crypto & Stock Portfolio Visualizer with asset allocation bars, 24h profit/loss indicators, watchlists, quick buy/sell simulated trade modal, and performance analytics.",
    icon: "Coins",
    badge: "Web3",
  },
  {
    id: "ai-prompt-generator",
    title: "AI Prompt Studio & Tester",
    description: "Prompt template library, variable placeholders, copy button & token estimator",
    prompt: "Build a modern AI Prompt Engineering Studio. Allow users to save prompt templates with variables like {{product_name}}, preview resolved prompts, test simulated outputs, and 1-click copy to clipboard.",
    icon: "Sparkles",
    badge: "AI Tools",
  },
];
