# 🧠 Serenity  
### *Live Autism Stress Pattern Detection and Mitigation*

> “Serenity helps caregivers and autistic individuals recognize and calm stress before it becomes overwhelming — using live EEG data, real-time dashboards, and soothing visual and audio feedback.”

---

## 🌍 Overview

**Serenity** is an EEG-powered system that detects early signs of **stress and sensory overload** in individuals on the autism spectrum.  
By analyzing **alpha and beta brain waves** from a Muse headset and visualizing them in real time, Serenity helps caretakers understand emotional patterns and intervene early.  

When stress is detected, **Serenity Mode** activates — generating calming **visuals and audio feedback** scientifically designed to help regulate sensory overstimulation.

---

## 💡 Problem

Many caregivers struggle to identify when a person with autism is becoming **anxious or overstimulated**, especially in unpredictable environments (crowds, noise, bright lights).  
By the time distress is visible, it’s often **too late**, leading to **meltdowns, exhaustion, or emotional shutdowns**.  

There’s currently no accessible, non-invasive way to **monitor live brain activity** and respond **before** stress escalates.

---

## 💖 Solution

Serenity combines **real-time EEG analytics** and **sensory regulation tools** into one seamless platform.

- Detect stress **before** it becomes visible  
- Visualize **alpha/beta wave patterns** over time  
- Enable caregivers to anticipate triggers (e.g., school drop-offs, crowded areas)  
- Activate **Serenity Mode** — calming visuals and sounds to restore emotional balance  

---

## 🧩 Core Components

### 🖥️ **Dashboard Analytics**

- Live EEG graph synced with Supabase in real time  
- Multi-time breakdowns of mood and stress data  
- Historical trend visualization for pattern recognition  
- Designed for caregivers to monitor multiple users or sessions  

### 🌈 **Serenity Mode**

When the system detects high stress (high beta/low alpha), Serenity Mode automatically activates:  

**Visual Feedback**  
- Smooth, color-changing shapes and ambient gradients  
- Gentle, predictable motion with low contrast  
- Powered by libraries like **Particles.js** or **p5.js**  

**Audio Feedback**  
- Adaptive soundscapes that match brain state  
- Rhythmic tones and soft melodies (via **Howler.js**)  
- No abrupt changes in pitch or volume  

📖 Research: [Visual Stimulation for Autism (PMC8217662)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8217662/)

---

## ⚙️ Implementation

### 🧠 Backend (Data Collection)

1. Read EEG signals (Alpha, Beta) from **Muse headset** via **BrainFlow**  
2. Stream data to **Supabase** for real-time processing and storage  
3. Analyze and compute Alpha/Beta ratio to determine stress state  

### 🪄 Frontend (Visualization & Interaction)

1. Fetch live EEG data from Supabase  
2. Render real-time charts using **Recharts**  
3. If stress ratio threshold exceeded → trigger **Serenity Mode**  
4. Serenity Mode generates visuals & sound via LLM-driven code  

---

## 📊 Brainwave Metrics

| Brainwave | Frequency (Hz) | Meaning | Interpretation |
|------------|----------------|----------|----------------|
| **Alpha (8–13 Hz)** | Calm, relaxed state | ↓ during stress, ↑ when relaxed |
| **Beta (13–30 Hz)** | Active, alert, stressed | ↑ during anxiety or sensory overload |

### 🔎 Alpha/Beta Ratio

- **High Ratio (3.0+) → Stressed / Overstimulated** → Trigger Serenity Mode 🚨  
- **Low Ratio (≤1.0) → Calm / Relaxed** → Maintain or reinforce calm environment  

---

## 🧠 Calibration Tips

- Ensure proper electrode contact before starting  
- Stay still during data collection (no facial movement)  
- Wait ~60 seconds for headset calibration  

---

## 🧰 Tech Stack

| Category | Tool / Library | Description |
|-----------|----------------|-------------|
| **Biosensor** | [BrainFlow](https://github.com/brainflow-dev/brainflow) / [Muse-LSL](https://github.com/alexandrebarachant/muse-lsl) | Collects and streams EEG data |
| **Database** | [Supabase](https://supabase.com/) | Realtime data pipeline, auth, and storage |
| **Frontend Framework** | React / Next.js | Visualization and interaction layer |
| **Charts** | [Recharts](https://recharts.org/) | Live EEG and mood analytics |
| **Graphics** | [Particles.js](https://particles.js.org/) / [p5.js](https://p5js.org/) | Calming visual feedback |
| **Audio** | [Howler.js](https://github.com/goldfire/howler.js) | Adaptive sound feedback |
| **3D Brain Model (Optional)** | [BrainBrowser](https://brainbrowser.cbrain.mcgill.ca/) | Visual 3D rendering of brain activity |

---

## 🧾 Research Inspiration

- [Duet Project – CalHacks Previous Winner](https://www.notion.so/PREV-WINNER-DUET-293a6df2ddb580c88f8fe7b528068d2e?pvs=21)  
- [Visual Stimulation for Autism (PMC8217662)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8217662/)  
- Studies on Alpha/Beta wave correlations with anxiety and sensory overload  

---

## 🚀 Roadmap

- [ ] Improve Alpha/Beta ratio calibration accuracy  
- [ ] Tune backend stress threshold model  
- [ ] Complete dashboard visualization  
- [ ] Design Serenity Mode visuals/audio library  
- [ ] Create final “Serenity Mode” experience  
- [ ] Build poster and final presentation for CalHacks  
- [ ] Record demo video for submission  

---

## 👥 Team

**Developers:**  
- [Cole Hartman](https://github.com/Cole-Hartman)  
- [Andrew Le](https://github.com/pandrewle)  
- [Mahdi Alsalami](https://github.com/MahdiAlsalami)  

---

## 🧩 Repository Structure

- in works

---

## 🧘‍♀️ Mission

> Serenity empowers autistic individuals and their caregivers to live with more peace, awareness, and confidence — transforming stress into calm through the power of technology and empathy.

---

## 🏁 License

MIT License © 2025 Serenity Team
