# EcoSort Bangladesh

Smart AI-assisted **Reverse Vending Machine (RVM)** prototype built for cleaner streets and incentivized recycling across Bangladesh. Citizens can scan discarded items (plastic bottles, aluminum cans, paper/cardboard, or general waste), route them into color-coded sorting bins, earn virtual **BDT (৳)** rewards on an **EcoCard**, and compete on a live street cleanliness leaderboard.

## Key Features
- **AI Trash Vision Scanner (`/kiosk`):** Uses `@tensorflow/tfjs` to classify items via webcam (supports a Teachable Machine model in `public/model/` with instant demo fallback triggers for testing).
- **Automated Sorting Bin Simulation:** Animates internal sorting compartments with `framer-motion` and shows per-item Taka rewards.
- **Virtual EcoCard Wallet (`/wallet`):** Issue new `ECO-XXXXXX` cards, look up balances and deposit history, and simulate **bKash**, **Nagad**, or **Mobile Recharge** redemptions.
- **Community Leaderboard (`/leaderboard`):** Tracks top EcoCard contributors, recycled item counts, and recent kiosk scans stored in MongoDB.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React, TypeScript
- **Styling & Animation:** Tailwind CSS, Framer Motion, Lucide Icons
- **AI / Vision:** TensorFlow.js (`@tensorflow/tfjs`)
- **Database:** MongoDB with Mongoose

## Requirements to Run Locally
1. **Node.js** (v18.18+ or v20+ recommended) and **npm**
2. **MongoDB** — either a **MongoDB Atlas** cloud connection string or a local **MongoDB Community Server** (`mongodb://127.0.0.1:27017/ecosort_bd`)
3. *(Optional)* A webcam for live vision scanning (the kiosk also includes one-click material test buttons)
4. *(Optional)* Teachable Machine exported files (`model.json`, `metadata.json`, and weight shards) placed inside `public/model/`

## Setup & Installation
1. Clone the repository and enter the project folder:
   ```bash
   git clone [https://github.com/Nadira-Fairuza/BruteForce.git](https://github.com/Nadira-Fairuza/BruteForce.git)
   cd BruteForce

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
