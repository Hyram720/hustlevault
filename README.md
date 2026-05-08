# Hustle Vault — Production Repository (hustlevault.app) 🚀

This is the official production repository for the **Hustle Vault** platform. It contains the React/Vite frontend and the Node.js/Express backend, fully configured for **hustlevault.app**.

## 📁 Repository Structure
- **`src/`**: React frontend source code. (Configured for Netlify)
- **`server/`**: Node.js backend source code. (Configured for Render)
- **`public/`**: Static assets.
- **`research/`**: Original prototypes and single-file versions for reference.

---

## 🛠️ Step 1: Push to GitHub
Open your terminal in this folder and run:
1.  **Initialize**: `git init` (Already set up for you).
2.  **Add**: `git add .`
3.  **Commit**: `git commit -m "Initial Production Launch"`
4.  **Create Repo**: Go to [GitHub.com](https://github.com/new) and create a repository named `hustle-vault`.
5.  **Remote**: `git remote add origin https://github.com/YOUR_USERNAME/hustle-vault.git`
6.  **Push**: `git push -u origin main`

---

## 🌐 Step 2: Deploy the Backend (Render.com)
1.  Sign in to **Render** and create a **Web Service**.
2.  Select your GitHub repo.
3.  **Root Directory**: `server`
4.  **Build Command**: `npm install`
5.  **Start Command**: `node server.js`
6.  **Environment Variables**:
    *   `STRIPE_SECRET_KEY` = (Your Stripe Secret Key)
    *   `CLIENT_URL` = `https://hustlevault.app`

---

## 🎨 Step 3: Deploy the Frontend (Netlify.com)
1.  Sign in to **Netlify** and **Import from GitHub**.
2.  Select your GitHub repo.
3.  **Base Directory**: Leave as `.` (root)
4.  **Build Command**: `npm run build`
5.  **Publish Directory**: `dist`
6.  **Environment Variables**:
    *   `VITE_API_URL` = (The URL Render gives you)
    *   `VITE_STRIPE_PUBLISHABLE_KEY` = (Your Stripe Publishable Key)
7.  **Domain**: Go to **Domain Settings** and add `hustlevault.app`.

---

## 💳 Stripe Considerations
- Ensure the **`VAULT20`** coupon is active in your Stripe dashboard.
- This version uses **Stripe Checkout (Cards only)**.
- **Success URL**: Pointing to `https://hustlevault.app/success`
