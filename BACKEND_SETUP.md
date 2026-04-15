# 🚀 Quick Start - Backend Setup

## The Bug & Solution

**Problem**: "Failed to fetch" error
**Cause**: CORS (Cross-Origin Resource Sharing) - browsers block direct API calls to external services

**Solution**: Use a Node.js backend server as a proxy between your frontend and Hugging Face API

## Installation & Setup

### Step 1: Install Node.js
Download from https://nodejs.org (LTS version recommended)

### Step 2: Install Dependencies
Open PowerShell in this folder and run:
```powershell
npm install
```

This installs Express and CORS packages needed for the backend.

### Step 3: Start the Server
```powershell
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   🤖 AI ASSISTANT SERVER RUNNING       ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:3000
```

### Step 4: Open Your Chatbot
Go to: **http://localhost:3000**

That's it! The chatbot now works without CORS errors. ✅

## What Changed

**Before (❌ Doesn't work)**:
```
Browser → Hugging Face API (BLOCKED by CORS)
```

**After (✅ Works)**:
```
Browser → Backend Server (localhost:3000) → Hugging Face API
```

## File Structure
```
Personal Project/
├── index.html              (Chat interface)
├── style.css               (Styling)
├── ai-assistant.js         (Frontend logic - UPDATED)
├── server.js               (Backend proxy - NEW)
├── package.json            (Dependencies - NEW)
└── SETUP.md               (Original setup guide)
```

## Troubleshooting

### "npm: The term 'npm' is not recognized"
- Node.js not installed properly
- Restart PowerShell after installing Node.js
- Run `node --version` to verify installation

### "npm ERR! code ENOENT"
- Make sure you're in the correct directory:
  ```powershell
  cd "c:\Users\Admin\OneDrive\Attachments\Desktop\Personal Project"
  ```

### Server not starting
- Port 3000 might be in use
- Check by opening http://localhost:3000 in browser
- If something is there, kill it with: `netstat -ano | findstr :3000`

### Still getting "Failed to fetch"
- Make sure server is running (you should see the startup message)
- Make sure you're accessing http://localhost:3000 (not file://)
- Check browser console for error details (F12)

## Features Now Working

✅ Real AI responses from Hugging Face  
✅ No CORS errors  
✅ Intent detection  
✅ Emotion recognition  
✅ Conversation history  
✅ Mobile friendly  
✅ Typing effect animation  

## To Stop the Server
Press **Ctrl+C** in the PowerShell terminal

## Next Steps

- Test by typing messages in the chatbot
- Monitor backend console for any errors
- Customize the assistant further in ai-assistant.js

---

**Happy coding!** 🎉
