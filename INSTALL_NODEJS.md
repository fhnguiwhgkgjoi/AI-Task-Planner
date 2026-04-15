# ⚡ Quick Installation - Node.js Backend

## ❌ Problem
Your system doesn't have Node.js or Python installed, so the backend can't run.

## ✅ Solution
Install Node.js (takes 5 minutes) - it will fix everything!

## Step-by-Step Installation

### 1. Download Node.js
Go to: **https://nodejs.org**
- Click **LTS (Long Term Support)** version
- It will auto-detect Windows 64-bit
- Click "Download"

### 2. Run Installer
- Open the downloaded `.msi` file
- Click "Next" through all screens
- Accept license
- Click "Install"
- Let it complete (1-2 minutes)
- **Restart your computer** when done

### 3. Verify Installation
Open a **NEW PowerShell** and run:
```powershell
node --version
npm --version
```

You should see version numbers like:
```
v20.10.0
10.2.1
```

### 4. Setup Project
```powershell
cd "c:\Users\Admin\OneDrive\Attachments\Desktop\Personal Project"
npm install
```

### 5. Start Backend
```powershell
npm start
```

You should see:
```
╔═══════════════════════════════╗
║ 🤖 AI ASSISTANT BACKEND       ║
╚═══════════════════════════════╝

✅ Server running on: http://localhost:3000
```

### 6. Test It
Open browser: **http://localhost:3000**

Try sending a message - it should work now! ✅

---

## Troubleshooting

### "npm: The term 'npm' is not recognized"
- You didn't restart your computer after installing Node.js
- **Restart and try again**

### "Port 3000 is already in use"
```powershell
netstat -ano | findstr :3000
taskkill /PID XXXX /F  # Replace XXXX with the PID
```

### Still having issues?
1. Completely close and reopen PowerShell
2. Make sure you're in the correct directory:
   ```powershell
   cd "c:\Users\Admin\OneDrive\Attachments\Desktop\Personal Project"
   ```
3. Try: `npm install` again
4. Then: `npm start`

---

## Once Node.js is installed, your setup will be:

```
Frontend (HTML/CSS/JS)
         ↓ (fetch request)
Backend (Node.js/Express)
         ↓ (API call)
Hugging Face API
         ↓ (response)
Backend
         ↓ (JSON response)
Frontend → Chat displayed! ✅
```

---

## Direct Download Links

**Node.js LTS (Recommended)**
https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi

**Alternative (Ubuntu)**
https://nodejs.org/

---

## After Installation

Once Node.js is installed, just type:
```powershell
npm start
```

That's it! No more 405 errors or installation issues! 🎉
