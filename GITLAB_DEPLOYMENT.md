        # GitLab Pages Deployment Guide

This guide will help you deploy the US Immigration Data Analysis app to GitLab Pages.

## Prerequisites

- A GitLab account
- Git installed on your machine
- The repository ready to push to GitLab

## Deployment Steps

### Option 1: Create a New GitLab Repository (Recommended)

1. **Create a new repository on GitLab:**
   - Go to https://gitlab.com
   - Click "New project" → "Create blank project"
   - Name: `gc-trend-indicator`
   - Visibility: Public or Private (your choice)
   - Click "Create project"

2. **Add GitLab as a remote and push:**
   ```bash
   cd /workspaces/gc-trend-indicator
   git remote add gitlab https://gitlab.com/YOUR_USERNAME/gc-trend-indicator.git
   git push gitlab main
   ```

3. **The CI/CD pipeline will automatically run:**
   - Go to your GitLab project → CI/CD → Pipelines
   - Watch the build and deploy jobs complete
   - This takes about 2-3 minutes

4. **Access your deployed site:**
   - After the pipeline succeeds, go to: Settings → Pages
   - Your site will be live at: `https://YOUR_USERNAME.gitlab.io/gc-trend-indicator/`

### Option 2: Mirror from GitHub to GitLab

1. **Create a new project on GitLab:**
   - Click "New project" → "Import project" → "Repository by URL"
   - Git repository URL: `https://github.com/rvasanthan/gc-trend-indicator`
   - Name: `gc-trend-indicator`
   - Click "Create project"

2. **The CI/CD pipeline will automatically trigger**
   - The `.gitlab-ci.yml` file will be detected and run automatically

3. **Access your deployed site:**
   - Go to Settings → Pages after the pipeline completes
   - Your site URL: `https://YOUR_USERNAME.gitlab.io/gc-trend-indicator/`

## Configuration Details

### Base Path Configuration
The app is already configured with the correct base path in `web/vite.config.js`:
```javascript
base: '/gc-trend-indicator/'
```

If you name your GitLab repository differently, update this value to match your repository name.

### CI/CD Pipeline
The `.gitlab-ci.yml` file includes:
- **Build stage**: Installs dependencies and builds the React app
- **Deploy stage**: Copies the build output to the `public` directory for GitLab Pages
- **Caching**: Speeds up builds by caching `node_modules`
- **Artifacts**: Preserves build output for 30 days

### Custom Domain (Optional)
To use a custom domain:
1. Go to Settings → Pages in your GitLab project
2. Click "New Domain"
3. Add your domain and follow the DNS configuration instructions

## Troubleshooting

### Pipeline Fails
- Check the pipeline logs: CI/CD → Pipelines → Click on the failed pipeline
- Common issues:
  - Node version mismatch (we use Node 20)
  - Build errors (check the build logs)

### 404 Errors
- Ensure the base path in `vite.config.js` matches your repository name
- Example: If your repo is `my-app`, set `base: '/my-app/'`

### Changes Not Appearing
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Wait 2-3 minutes for GitLab Pages to update
- Check if the pipeline completed successfully

## Continuous Deployment

Every time you push to the `main` branch, GitLab will:
1. Automatically build your app
2. Deploy the latest version to GitLab Pages
3. Make it live within minutes

## Monitoring

- View deployment status: Settings → Pages
- Check pipeline history: CI/CD → Pipelines
- View build logs: Click on any pipeline → View job logs

## Additional Resources

- [GitLab Pages Documentation](https://docs.gitlab.com/ee/user/project/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)

---

**Your app will be live at:** `https://YOUR_USERNAME.gitlab.io/gc-trend-indicator/`

Replace `YOUR_USERNAME` with your actual GitLab username.
