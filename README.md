# 🧠 Serenity — Live Autism Stress Detection & Mitigation

**Developed at Cal Hacks 12.0 by Mahdi Alsalami, Cole Hartman, and Andrew Le**

Serenity is a **wearable EEG-based feedback and analytics system** designed to help caregivers and autistic individuals detect, understand, and manage stress in real time.  
By translating brainwave data into calming audio-visual experiences, Serenity bridges the gap between neuroscience and emotional support.

---

## Problem

Caregivers of individuals with autism often struggle to recognize early signs of anxiety or overstimulation.  
By the time visible symptoms appear, the individual may already be overwhelmed — leading to meltdowns, exhaustion, or shutdowns.  

**Key challenges:**
- Hard to identify triggers or emotional trends.
- No real-time insights into mental state.
- Limited tools for immediate, sensory-safe calming feedback.

---

## 💡 Solution

Serenity uses EEG brainwave data from a Muse headband to track **Alpha, Beta, and Theta** waves in real time.  
Through **cognitive state mapping**, the system recognizes patterns of stress and initiates adaptive visuals and soundscapes to restore calm.

### Core Features
- 🧠 **Live Dashboard:** Real-time EEG graph visualization (Alpha, Beta, Ratio).  
- 🎨 **Serenity Mode:** Dynamic visuals and 528Hz soundscapes that reduce sensory overload.  
- 📊 **History & Trends:** View long-term emotional patterns to improve care strategies.  
- 🤖 **AI-Powered Insights:** Claude analyzes EEG patterns to provide adaptive feedback and recommendations.

---

## ⚙️ How It Works

1. **Data Collection**  
   - BrainFlow captures EEG signals from the Muse headband.  
   - Supabase stores and streams this data in real time.

2. **Analysis & AI**  
   - Claude AI analyzes patterns to detect stress and map cognitive states.  
   - AI sends adaptive response signals to libraries for visuals and sound.

3. **Calming Output**  
   - Howler.js → Generates adaptive soundscapes.  
   - tsparticles → Creates floating, soothing visual effects.  
   - Recharts → Displays EEG wave graphs and ratios.  
   - BrainBrowser → Highlights active brain regions in 3D.  
   - Next.js + Tailwind + Framer Motion → Smooth, accessible web experience.

---

## 🧩 Tech Stack

| Layer | Tools |
|-------|-------|
| **Backend** | BrainFlow, Supabase |
| **AI** | Claude (Anthropic) |
| **Libraries** | Howler.js, Recharts, tsparticles, BrainBrowser |
| **Frontend** | Next.js, Tailwind CSS, Framer Motion |

---

## 💫 Impact

**For autistic individuals:**  
- Reduces sensory overload through calming visuals and sounds.  
- Brings back focus and calm using gentle, adaptive feedback.  
- Encourages independence by helping users manage stress early.  

**For caregivers:**  
- Provides clear insight into emotional and stress patterns.  
- Enables early intervention before meltdowns occur.  
- Strengthens communication and understanding.  

> *Serenity helps autistic individuals feel calm, confident, and understood.*

---

## 🔬 Research-Backed Design

Serenity’s design draws from neuroscience and sensory research:

- [Mental Stress Correlation to EEG Signals (PMC, 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9749579/)  
- [Effect of Visual Shape on Autism Regulation (PMC, 2017)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5276997/)  
- [528Hz Frequency & Autism Relaxation (SmartTMS, 2024)](https://www.smarttms.co.uk/news/the-miracle-sound-in-the-context-of-attention-hyperactivity-disorder-comorbid-with-autism-spectrum-disorder)  
- [Machine Learning for Stress Detection (ResearchGate, 2021)](https://www.researchgate.net/publication/356487895_Machine_Learning_Approach_for_Stress_Detection_based_on_Alpha-Beta_and_Theta-Beta_Ratios_of_EEG_Signals)  
- [EEG Stress Analysis on Alpha/Beta and Theta/Beta Ratios (ResearchGate, 2020)](https://www.researchgate.net/publication/339138049_Electroencephalogram_EEG_stress_analysis_on_alphabeta_ratio_and_thetabeta_ratio)

---

### ⭐ Support
If you like this project, consider starring ⭐ it on GitHub or following the contributors!  

