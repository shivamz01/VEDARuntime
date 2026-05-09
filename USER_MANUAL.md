# VEDA Runtime: User Manual

Welcome to **VEDA Runtime**. This guide will help you understand what this system does, why it matters, and how you can use it to make your AI agents safe and reliable.

---

## 1. What is VEDA Runtime?
Think of VEDA Runtime as a **Security Guard** for AI. 

When an AI agent (like a coding assistant or an automated bot) wants to perform a task on your computer, VEDA Runtime sits in the middle. It checks the AI's instructions, makes sure they are safe, and keeps a permanent record of exactly what happened.

## 2. Why use it?
AI models can sometimes be unpredictable. VEDA Runtime solves three major problems:
*   **Safety:** It stops the AI from running dangerous commands (like deleting your files).
*   **Accountability:** It creates a "Black Box" recording (Audit Ledger) that proves exactly what the AI did.
*   **Recovery:** If the AI makes a mistake, the system can "Rollback" the changes to a previous safe state.

---

## 3. Core Safety Features
VEDA Runtime uses four main layers of protection:

### 🛡️ The Sandbox (The Playpen)
The AI is never allowed to touch your real system directly. It works inside a "Sandbox" where dangerous tools are blocked by default. It can't use `npm`, `git`, or `rm` without permission.

### 📋 Context Governor (The Filter)
Before the AI even starts working, VEDA filters the information it sees. It removes "Prompt Injections" (hidden malicious instructions) and makes sure the AI doesn't get overwhelmed with too much data.

### 🔗 Audit Ledger (The Record)
Every single move the AI makes is recorded and "chained" together using high-level cryptography. If even one letter in the log is changed, the system will detect it immediately.

### ⏪ Rollback Engine (The Undo Button)
Before the AI changes a file, VEDA takes a "snapshot." If the task fails or the AI goes off-track, you can instantly restore your file to exactly how it was before the AI touched it.

---

## 4. How to Get Started

### Prerequisites
You need **Node.js (Version 20 or higher)** installed on your computer.

### Quick Start
1.  **Download the project** from GitHub.
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the Safety Demo:**
    ```bash
    npm run demo:free
    ```

This will run a sample task where the AI tries to write a file. You will see the system validate the request, create a rollback point, and generate a "Cryptographic Proof" that the work was done safely.

---

## 5. Free vs. Pro Edition

| Feature | Free Edition | Pro Edition (Enterprise) |
| :--- | :--- | :--- |
| **Storage** | Local files on your PC | Secure Cloud (Supabase) |
| **Usage** | Individual Developers | Teams & Large Companies |
| **Dashboard** | Text-based status | Beautiful Web Dashboard |
| **History** | Recent logs only | Permanent Audit History |
| **Governance** | Standard Safety | Custom Compliance Profiles |

---

## 6. Understanding the "Proof"
When VEDA finishes a task, it gives you a **Cryptographic Proof**. 
*   **Verification:** This is a digital signature that guarantees the results haven't been tampered with.
*   **Trust:** You can give this proof to your manager or a client to prove that the AI followed all safety rules.

---

**Need Help?**
Check the `README.md` for technical documentation or open an issue on the GitHub repository.
