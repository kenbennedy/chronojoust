# 🚀 Quick Deployment Guide for GitHub Pages

## Files You Need

All files are ready in your outputs folder:
- ✅ `index.html` - The main webpage
- ✅ `ChronoJoust.jsx` - The game code
- ✅ `ChronoJoust_cover_art.png` - Cover art/favicon
- ✅ `README.md` - Repository documentation
- ✅ `.gitignore` - Git ignore rules

## Fast Track Deployment (5 minutes)

### Method 1: GitHub Web Interface (Easiest)

1. **Create Repository**
   - Go to https://github.com/new
   - Repository name: `chronojoust`
   - Make it Public
   - Don't check any initialization options
   - Click "Create repository"

2. **Upload Files**
   - Click "uploading an existing file"
   - Drag ALL 5 files from your outputs folder into the upload area
   - Commit message: "Initial commit"
   - Click "Commit changes"

3. **Enable GitHub Pages**
   - Click "Settings" tab
   - Click "Pages" in left sidebar
   - Under "Source", select branch: `main`
   - Click "Save"
   - Wait 1-2 minutes

4. **Done!**
   - GitHub shows you the URL: `https://YOUR_USERNAME.github.io/chronojoust/`
   - Click the link to play your game

### Method 2: Git Command Line (For Developers)

```bash
# 1. Navigate to a folder where you want to create the project
cd ~/Desktop  # or wherever you want

# 2. Create a new folder and enter it
mkdir chronojoust
cd chronojoust

# 3. Copy all 5 files from your outputs folder into this chronojoust folder

# 4. Initialize git
git init
git add .
git commit -m "Initial commit - ChronoJoust game"

# 5. Connect to GitHub (create repo first on GitHub.com)
git remote add origin https://github.com/YOUR_USERNAME/chronojoust.git
git branch -M main
git push -u origin main

# 6. Enable GitHub Pages via Settings → Pages → Source: main branch
```

## Testing Locally Before Deployment

**Using Python (already installed on Mac/Linux):**
```bash
cd chronojoust
python3 -m http.server 8000
# Visit: http://localhost:8000
```

**Using Node.js:**
```bash
npx http-server
# Visit: http://localhost:8080
```

## Troubleshooting

**Game won't load?**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors (F12)
- Make sure all 5 files are in the repository root

**GitHub Pages not working?**
- Wait 5 minutes - it takes time to deploy
- Check Settings → Pages shows "Your site is live at..."
- Make sure repository is Public
- Make sure source branch is set to `main`

**404 Error?**
- URL should be: `https://USERNAME.github.io/REPO_NAME/`
- Check you're using your actual GitHub username
- Check the repository name is correct

## Custom Domain (Optional)

Want to use your own domain like `chronojoust.com`?

1. Buy a domain from Namecheap, GoDaddy, etc.
2. In your repo, create a file named `CNAME` containing just your domain
3. In your domain's DNS settings, add a CNAME record pointing to `YOUR_USERNAME.github.io`
4. Wait for DNS propagation (can take up to 24 hours)

## Need Help?

- GitHub Pages Docs: https://docs.github.com/pages
- Test locally first before deploying
- Check that index.html loads without errors

---

**That's it! Your game is now live on the internet! 🎮**
