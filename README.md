# S2TT Crowdsourcing App

A web-based crowdsourcing application frontend for Speech-to-Text (ASR) and Machine Translation (MT). This platform facilitates a Human-in-the-Loop (HITL) workflow to improve machine learning models through manual corrections and Continual Learning (CL).

Backend: [Github Repo](https://github.com/6ill/api-speech-text-translation-crowdsourcing-app)

## Background & Overview

The S2TT (Speech-to-Text-Translation) application allows users to upload audio/video files which are automatically processed using automatic speech recognition model (for transcription) and machine translation model (for translation). 

The core value of the platform is its **Crowdsourcing & Continual Learning pipeline**:
1. **Automated Inference:** ML models provide initial transcriptions and translations.
2. **Human Correction:** Users edit and refine the ML output.
3. **Admin Review:** Administrators approve or reject these corrections.
4. **Model Fine-Tuning:** Approved corrections trigger a QLoRA-based fine-tuning pipeline to improve model accuracy (WER/BLEU scores) over time.

---

## Tech Stack

### Frontend
- **Framework:** Vite, React, TypeScript
- **Styling:** Tailwind CSS, shadcn-ui
- **State Management:** TanStack Query (React Query)
- **API Client:** Axios (with JWT interceptors)
- **Routing:** React Router DOM

---

## User Roles & Permissions

| Role | Permissions |
| :--- | :--- |
| **Standard User** | Upload media, edit own transcriptions/translations, trigger MT tasks. |
| **Admin** | Access Admin Dashboard, review all files/segments, Approve/Reject corrections, trigger CL pipelines. |

---

## Key Workflows

### 1. Media Processing
- **Upload:** When users upload files, it will trigger an asynchronous ASR task to backend.
- **Polling:** The frontend implements short-polling to track status changes (`TRANSCRIBING` -> `TRANSCRIBED`).
- **Translation:** Once transcribed, users can trigger the MT pipeline to generate translations.

### 2. Correction & Review
- **Batch Edits:** Users can edit multiple segments at once. Submitting updates the UI immediately and creates "Pending" tickets in the background.
- **Audio Sync:** Clicking a segment block in the editor seeks the global player to the specific start timestamp of audio segment.
- **Review:** Admins use the review interface to approve high-quality data for future model training.

---

## Setup

### Prerequisites
- Node.js & npm (Latest LTS recommended)
- Access to the [S2TT Backend API](https://github.com/6ill/api-speech-text-translation-crowdsourcing-app)

### Installation
1. **Clone the repo:**
   ```bash
   git clone https://github.com/6ill/speech-to-text-translation-frontend.git
   cd speech-to-text-translation-frontend
   ```
2. Install dependencies:
    ```bash
    npm install
    Configure Environment:
    Create a .env file based on .env.example and add your VITE_API_URL.
    ```
3. Run Development Server:
    ```bash
    npm run dev
    ```