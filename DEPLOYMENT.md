# Deployment Guide for Vercel

This guide explains how to deploy the Market Microstructure Analysis Framework to Vercel.

## Overview

The project is structured as a monorepo with:
- Frontend: React/TypeScript application (deployed to Vercel CDN)
- Backend: FastAPI Python API (deployed as serverless functions)

Vercel handles both automatically through the configuration files provided.

## Prerequisites

1. Vercel account (free tier available at vercel.com)
2. GitHub repository with this code pushed
3. Project already connected to Vercel dashboard

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

### Step 2: Configure Environment Variables (if needed)

In Vercel dashboard:

1. Go to Project Settings > Environment Variables
2. Add any needed variables:
   - `VITE_API_BASE_URL`: URL of the API (auto-filled as your Vercel domain)
   - Any other configuration needed by the backend

3. Redeploy after adding variables

### Step 3: Configure Build Settings

In Vercel dashboard > Project Settings > General:

- **Build & Development Settings** should show:
  - Build Command: `cd frontend && npm install && npm run build`
  - Output Directory: `frontend/dist`
  - Install Command: `npm install --legacy-peer-deps`

If these are wrong, update them or they will be auto-detected from vercel.json.

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
      "memory": 3008,
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
- `functions`: Configuration for Python serverless functions (memory, timeout)
- `rewrites`: Route all /api/* requests to the Python handler
- `routes`: Fallback routing for SPA (single page application)

### api/index.py Structure

This file wraps the FastAPI application for Vercel:

```python
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI
# ... import routes ...

app = FastAPI(...)
# ... middleware and routers ...

handler = app  # Vercel serverless function handler
```

**Why this wrapper?**:
- FastAPI is created normally in code
- Vercel's serverless runtime expects a `handler` object
- The wrapper exports the app as `handler` for Vercel to invoke

## Troubleshooting Deployment

### Issue: "Module not found" errors

**Cause**: Import paths are wrong or dependencies are missing.

**Solution**:
1. Check that sys.path is correctly set in api/index.py
2. Verify all imports in backend modules use relative paths
3. Check requirements.txt has all needed dependencies

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
3. Check that frontend build completes successfully

### Issue: "Serverless function timeout"

**Cause**: Analysis taking longer than the timeout limit (60 seconds).

**Solution**:
1. Increase maxDuration in vercel.json functions section
2. Consider caching results to reduce computation
3. Optimize analysis algorithms for speed

### Issue: CORS errors when calling API from frontend

**Cause**: Frontend and backend on different domains, CORS not configured.

**Solution**:
1. Check CORS middleware in api/index.py includes your Vercel domain
2. Add https://*.vercel.app to allowed origins
3. Verify allow_methods includes GET, POST, PUT, DELETE, OPTIONS

## Environment Variables

### Production Variables

Set these in Vercel dashboard > Environment Variables:

```
VITE_API_BASE_URL=https://your-project.vercel.app
```

This tells the frontend where to find the API.

### Development Variables

For local development, create .env files:

**frontend/.env.local**:
```
VITE_API_BASE_URL=http://localhost:8000
```

**backend/.env**:
```
DEBUG=true
```

## Monitoring and Logs

### View Deployment Logs

1. Go to Vercel dashboard > Deployments
2. Click on a deployment
3. View build logs and runtime logs

### Monitor API Performance

1. Vercel dashboard > Analytics
2. Check request counts, latency, errors
3. Set up alerts for errors or slowdowns

## Performance Optimization

### Reduce Build Time

1. Use --legacy-peer-deps to skip peer dependency checks
2. Cache dependencies between builds
3. Remove unused dependencies

### Reduce Function Size

1. Remove dev dependencies from production (npm install --production)
2. Consider using lightweight alternatives for heavy libraries
3. Monitor function bundle size in logs

### Reduce Function Runtime

1. Cache data fetching results
2. Optimize entropy calculations for speed
3. Implement request rate limiting

## Rollback and Updates

### Rollback to Previous Deployment

1. Vercel dashboard > Deployments
2. Click "Promote to Production" on any previous deployment
3. Confirms and rolls back immediately

### Update Application

1. Push changes to GitHub
2. Vercel automatically redeploys main/master branch
3. Check deployment status in Vercel dashboard

## Custom Domain

1. Vercel dashboard > Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. DNS propagation takes 5-30 minutes

## Billing Considerations

Vercel's free tier includes:
- Unlimited static site deployments
- 100 serverless function invocations per day
- 6 hours total function runtime per month

For high usage:
- Upgrade to Pro plan for higher limits
- Consider caching to reduce function calls
- Implement request batching

## Next Steps

After deployment:

1. Test all features work on production domain
2. Monitor logs for errors
3. Set up custom domain if desired
4. Configure CI/CD for automated deployments
5. Set up monitoring and alerts

## References

- Vercel Documentation: https://vercel.com/docs
- FastAPI with Vercel: https://vercel.com/guides/deploying-fastapi-with-vercel
- Next.js/React Deployment: https://vercel.com/docs/frameworks/react
