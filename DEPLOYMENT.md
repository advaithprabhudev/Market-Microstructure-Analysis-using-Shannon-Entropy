# Deployment Guide for Vercel

This guide explains how to deploy the Market Microstructure Analysis Framework to Vercel.

## Overview

The project is structured as a monorepo with:
- Frontend: React/TypeScript application (deployed to Vercel CDN)
- Backend: FastAPI Python API (deployed as serverless functions)

Vercel handles both automatically through the configuration files provided.

## Prerequisites

1. Vercel account (free Hobby tier available at vercel.com)
2. GitHub repository with this code pushed
3. Project connected to Vercel dashboard

## File Structure for Deployment

The deployment uses these key files:

```
vercel.json              - Main Vercel configuration (routes, builds, rewrites)
.vercelignore            - Files to exclude from deployment
requirements.txt         - Python dependencies (root level)
api/index.py            - Serverless function wrapper for FastAPI
frontend/               - React frontend (builds to frontend/dist)
backend/                - FastAPI source code
```

## How It Works

1. **Build Phase**:
   - Frontend: `npm install && npm run build` in the frontend directory
   - Backend: Dependencies from requirements.txt are installed
   - Output: frontend/dist folder contains static assets

2. **Deployment Phase**:
   - Static assets (frontend/dist) deployed to Vercel CDN
   - Python files in api/ directory converted to serverless functions
   - Requests to /api/* routed to the Python serverless functions

3. **Request Routing**:
   - Requests to /api/* → api/index.py (FastAPI handler)
   - All other requests → frontend/index.html (React frontend)
   - Browser handles routing within the React app

## Deployment Steps

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Select "Other" as the framework
4. Click "Deploy"

Vercel will automatically detect vercel.json and use the configuration.

### Step 2: No Environment Variables Needed

The API client uses a relative path `/api`, which works automatically on Vercel:
- All API calls go to `/api/*` on the same domain
- Vercel's rewrites send `/api/*` to the serverless functions
- No secrets or environment variables needed for basic deployment

If you need custom configuration later, you can add variables in Vercel dashboard > Project Settings > Environment Variables.

### Step 3: Configure Build Settings

Vercel auto-detects from vercel.json. If you need to verify:

Vercel dashboard > Project Settings > General:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --legacy-peer-deps`

## Deployment Configuration Explained

### vercel.json Structure

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "functions": {
    "api/**.py": {
      "runtime": "python3.11",
      "memory": 2048,
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/(.+)",
      "destination": "/api/index.py"
    }
  ],
  "routes": [...]
}
```

**Key Sections**:

- `buildCommand`: What to run to build the project
- `outputDirectory`: Where the built frontend files are
- `framework`: Vite framework (auto-detects React/Vue/Svelte setup)
- `functions`: Configuration for Python serverless functions
  - `memory`: 2048 MB (Hobby plan limit). Upgrade to Pro for more.
  - `maxDuration`: 60 seconds timeout for API calls
- `rewrites`: Route all /api/* requests to the Python handler
- `routes`: Fallback routing for React SPA

### api/index.py Structure

This file wraps the FastAPI application for Vercel:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(...)
app.add_middleware(CORSMiddleware, ...)
app.include_router(...)

handler = app  # Vercel serverless function handler
```

**Why this wrapper?**:
- FastAPI is created normally
- Vercel's serverless runtime expects a `handler` object
- The wrapper exports the app as `handler` for Vercel to invoke

## Troubleshooting Deployment

### Issue: "Module not found" errors

**Cause**: Import paths are wrong or dependencies are missing.

**Solution**:
1. Check that sys.path is correctly set in api/index.py
2. Verify all imports in backend modules use relative paths
3. Check requirements.txt has all needed dependencies
4. View build logs in Vercel dashboard > Deployments

### Issue: API endpoints return 404

**Cause**: Routes are not being registered or rewrites are misconfigured.

**Solution**:
1. Check that vercel.json rewrites point to /api/index.py
2. Verify the backend routers are included in api/index.py
3. Check CORS configuration allows your frontend domain

### Issue: Frontend shows blank page or 404

**Cause**: Static files not being served or routing misconfigured.

**Solution**:
1. Check that outputDirectory in vercel.json is correct: `frontend/dist`
2. Verify the catch-all route sends non-API requests to /index.html
3. Check that frontend build completes successfully in logs

### Issue: "Serverless function timeout"

**Cause**: Analysis taking longer than 60 seconds.

**Solution**:
1. Upgrade to Pro plan to increase timeout limit
2. Optimize analysis algorithms for speed
3. Implement caching to reduce computation
4. Process requests in smaller batches

### Issue: CORS errors when calling API from frontend

**Cause**: Frontend and backend on different domains, CORS not properly configured.

**Solution**:
1. Check CORS middleware in api/index.py allows your Vercel domain
2. Vercel domain format: `https://<project>.vercel.app`
3. Wildcard `https://*.vercel.app` is included by default

## Memory and Performance

### Hobby Plan Limits

- **Memory**: 2048 MB (current setting)
- **Timeout**: 60 seconds
- **Executions**: Pay-as-you-go (minimal cost)

### If You Need More

Create a Pro team:
1. Vercel Dashboard > Settings > Teams
2. Create a new team
3. Upgrade to Pro plan
4. In vercel.json, increase memory to 3008 MB if needed

### Performance Tips

1. **Reduce Bundle Size**:
   - Remove unused dependencies
   - Use tree-shaking with Vite
   - Check build log for bundle size

2. **Reduce Function Runtime**:
   - Cache data fetching results
   - Optimize entropy calculations
   - Batch multiple ticker requests

3. **Improve Startup Time**:
   - Keep dependencies minimal
   - Use lazy imports for heavy libraries
   - Monitor cold start times in logs

## Monitoring and Logs

### View Deployment Logs

1. Vercel Dashboard > Deployments
2. Click on a deployment to view build and runtime logs
3. Check for errors, warnings, or timeout messages

### Monitor API Performance

1. Vercel Dashboard > Analytics
2. Check request counts, latency, error rates
3. Set up alerts for errors (requires upgrade)

## Rollback and Updates

### Rollback to Previous Deployment

1. Vercel Dashboard > Deployments
2. Click "Promote to Production" on a previous deployment
3. Automatic rollback completes instantly

### Update Application

1. Push changes to GitHub (main or master branch)
2. Vercel automatically redeploys
3. View deployment status in dashboard

## Custom Domain

1. Vercel Dashboard > Project Settings > Domains
2. Add your custom domain
3. Follow DNS instructions
4. DNS propagation takes 5-30 minutes

## Billing and Pricing

**Hobby Plan (Free)**:
- Unlimited deployments
- Unlimited static sites
- 100 GB bandwidth per month
- Serverless functions with 2048 MB memory
- 60-second timeout per function

**Pro Plan** (upgrade when needed):
- Everything in Hobby, plus:
- 3008 MB memory for functions
- 900-second timeout per function
- Priority support

## Next Steps After Deployment

1. Test all features on the production domain
2. Monitor logs for errors
3. Set up a custom domain if desired
4. Configure monitoring and alerts
5. Test with different portfolios and timeframes

## Environment-Specific Behavior

### Development (Local)

```
Frontend (localhost:5173) → Vite proxy → Backend (localhost:8000)
```

### Production (Vercel)

```
Frontend (vercel.app) → /api rewrites → Serverless function (vercel.app/api/*)
```

Both use the same `/api` relative path in the code, so no code changes needed.

## References

- Vercel Documentation: https://vercel.com/docs
- FastAPI with Vercel: https://vercel.com/guides/deploying-fastapi-with-vercel
- React with Vite: https://vitejs.dev/guide/
- Troubleshooting: https://vercel.com/support
