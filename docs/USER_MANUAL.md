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
Before the AI changes a file, VEDA takes a "snapshot." The runtime now exposes a restore path for existing-file checkpoints, so a verified snapshot can be written back if a guarded task fails.

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
3.  **Run the Safety Pipeline:**
    ```bash
    npm run pipeline:proof
    ```

This will build the project, run the safety tests, execute a sample task, create a rollback point, and generate a "Cryptographic Proof" that the work was done safely.

### Built-in Pipelines

These pipelines are included in this project. You do not need to install the larger VEDA OS workspace, Python pipeline templates, or external `AGENTS.md` files to use them.

| Command | When to use it |
| :--- | :--- |
| `npm run pipeline:proof` | Check the local Free Edition proof chain |
| `npm run pipeline:audit` | Check cryptographic handoff and audit evidence |
| `npm run pipeline:ship` | Run the full release-candidate gate before sharing the package |

Each pipeline stops at the first failed gate and writes a JSON report into the `logs/` folder.

---

## 5. Support Bundle

If something fails, run:

```bash
npm run support:collect
```

This creates a redacted support file inside `logs/`. It shows versions, package scripts, environment-key presence, and recent pipeline results. It does not collect your API key values.

---

## 6. Free vs. Pro Edition

| Feature | Free Edition | Pro Edition |
| :--- | :--- | :--- |
| **Price** | $0/month | $20/month |
| **Founding Offer** | Not applicable | $13/month for first 3 months, first 2000 paid users only |
| **Storage** | Local files on your PC | Secure Cloud (Supabase) |
| **Usage** | Individual Developers | Builders & Small Teams |
| **Status Surface** | Text-based status | API and web status page |
| **History** | Recent logs only | Permanent Audit History |
| **Governance** | Standard Safety | Custom Compliance Profiles |

---

## 7. Customer Tracking

The founding discount must be tracked outside the public repo. The Excel-compatible template is:

```bash
docs/templates/founding_customer_tracker.csv
```

Make a private copy and add one row per paid customer. Free users do not consume the first-2000 paid-user discount slots.

---

## 8. Understanding the "Proof"
When VEDA finishes a task, it gives you a **Cryptographic Proof**. 
*   **Verification:** This is a digital signature that guarantees the results haven't been tampered with.
*   **Trust:** You can give this proof to your manager or a client to prove that the AI followed all safety rules.

---

**Need Help?**
Run `npm run support:collect`, then check `TROUBLESHOOTING.md` and `SUPPORT.md`.
