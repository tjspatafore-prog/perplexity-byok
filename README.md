# Perplexity BYOK - AI Search Engine

A full-featured Perplexity.ai clone with **Bring Your Own Key (BYOK)** support for:
- **Google Gemini** (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-pro`, `gemini-1.5-flash`)
- **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o3-mini`, `o1`)
- **Anthropic Claude** (`claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`)
- **xAI Grok** (`grok-2-1212`, `grok-2-vision-1212`, `grok-beta`)
- **Moonshot AI / Kimi** (`moonshot-v1-128k`, `moonshot-v1-32k`, `moonshot-v1-8k`)
- **Alibaba Cloud / Qwen** (`qwen-max`, `qwen-plus`, `qwen-turbo`, `qwen2.5-72b-instruct`)
- **Deepgram** (Nova-2 voice transcription for mic dictation + Aura text-to-speech)

---

## Key Features

1. **Real-time Web Grounding**:
   - Zero-configuration web search (powered by DuckDuckGo + web crawler) with no separate search key required.
   - Extracts top web results and page contents concurrently.
2. **Perplexity-Style Inline Citations**:
   - Numerical citation pills `[1]`, `[2]` placed directly next to factual statements.
   - Interactive source preview cards showing domain, title, snippet, and favicon.
   - Clicking citation pills highlights the matching source card.
3. **Multi-Model Selector**:
   - Switch between Google Gemini, OpenAI, Claude, Grok, Kimi, and Qwen seamlessly.
   - Visual indicators showing which providers currently have keys configured.
4. **Deepgram Voice Assistant**:
   - **Voice Input**: Microphone dictation directly inside the search bar using Deepgram Nova-2.
   - **Listen (TTS)**: Realistic audio readout of answers using Deepgram Aura models (Asteria, Luna, Stella, Orion, etc.).
5. **Dynamic Follow-Up Questions**:
   - AI automatically proposes 3-4 clickable related questions to continue exploring the topic.
6. **Focus Modes**:
   - **Web (Default)**: Comprehensive general web search.
   - **Academic**: Prioritizes research papers, preprints, and scientific studies.
   - **Writing / Reasoning**: Direct deep thinking without web scraping.
7. **Thread History & Local Persistence**:
   - All API keys and chat history are saved securely in your browser (`localStorage`).
   - Export and import your data anytime via JSON backups.

---

## Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 2. Enter Your API Keys
Click the **"Keys"** button in the top right or the gear icon in the sidebar to open Settings:
- Enter your keys for any or all providers:
  - **Google Gemini**: AI Studio API Key (`AIzaSy...`)
  - **OpenAI**: OpenAI API Key (`sk-proj-...`)
  - **Anthropic Claude**: Anthropic Key (`sk-ant-...`)
  - **xAI Grok**: xAI Key (`xai-...`)
  - **Moonshot Kimi**: Moonshot Key (`sk-...`)
  - **Alibaba Qwen**: DashScope Key (`sk-...`)
  - **Deepgram**: Deepgram Token for voice dictation & speech
- Click **Save Preferences**.

Your keys remain stored locally in your browser and are passed ephemerally to the backend proxy for API requests.
