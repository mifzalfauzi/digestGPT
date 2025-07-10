# 🚀 Deployment Guide

This guide provides detailed instructions for deploying DigestGPT to production using Render.com for the backend and Vercel for the frontend.

## 📋 Prerequisites

- GitHub repository with your code
- Anthropic API key
- Render.com account
- Vercel account

## 🔧 Backend Deployment (Render.com)

### Step 1: Prepare Your Repository

1. **Ensure your backend code is in the `backend/` directory**
2. **Verify `requirements.txt` is present** with all dependencies
3. **Add a `render.yaml` file** (optional but recommended) in the backend directory:

```yaml
services:
  - type: web
    name: digestgpt-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: DAILY_REQUEST_LIMIT
        value: "1"
      - key: MAX_FILE_SIZE_MB
        value: "10"
      - key: MAX_TEXT_LENGTH
        value: "50000"
```

### Step 2: Deploy on Render

1. **Sign up/Login** to [Render.com](https://render.com)

2. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**:
   - **Name**: `digestgpt-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `DAILY_REQUEST_LIMIT`: `1`
   - `MAX_FILE_SIZE_MB`: `10`
   - `MAX_TEXT_LENGTH`: `50000`

5. **Deploy**: Click "Create Web Service"

6. **Wait for deployment** - Render will build and deploy your backend

7. **Note your backend URL** - it will be something like `https://digestgpt-backend.onrender.com`

### Step 3: Verify Backend Deployment

Visit your backend URL and check:
- `GET /` should return `{"message": "DigestGPT API is running"}`
- `GET /docs` should show the FastAPI documentation

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update API Configuration

1. **Update API URLs** in `frontend/src/App.jsx`:
   
   Replace:
   ```javascript
   response = await axios.post('http://localhost:8000/analyze-file', formData, {
   ```
   
   With:
   ```javascript
   response = await axios.post('https://your-backend-url.onrender.com/analyze-file', formData, {
   ```

   Do the same for the `/analyze-text` endpoint.

### Step 2: Deploy on Vercel

#### Option A: Using Vercel Web Interface

1. **Sign up/Login** to [Vercel](https://vercel.com)

2. **Import Project**:
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Deploy**: Click "Deploy"

5. **Note your frontend URL** - it will be something like `https://digestgpt.vercel.app`

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

5. **Follow the prompts**:
   - Set root directory to current directory
   - Choose build settings (Vite should be auto-detected)

## 🔄 Continuous Deployment

### Render.com Auto-Deploy

Render automatically redeploys when you push to your main branch. To customize:

1. **Go to your service settings**
2. **Configure auto-deploy settings**
3. **Set branch and build triggers**

### Vercel Auto-Deploy

Vercel automatically deploys on every push to your main branch:

1. **Production deployments**: `main` branch
2. **Preview deployments**: Feature branches
3. **Configure** in project settings if needed

## 🔧 Environment Configuration

### Backend Environment Variables

Set these in your Render service settings:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-api-key
DAILY_REQUEST_LIMIT=1
MAX_FILE_SIZE_MB=10
MAX_TEXT_LENGTH=50000
```

### Frontend Environment Variables (if needed)

If you want to make the backend URL configurable:

1. **Create** `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

2. **Update** `frontend/src/App.jsx` to use:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
   
   response = await axios.post(`${API_URL}/analyze-file`, formData, {
   ```

## 🔒 Security Considerations

### Backend Security

1. **CORS Configuration**: Update allowed origins in `main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend-domain.vercel.app"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Environment Variables**: Never commit API keys to your repository

3. **Rate Limiting**: The built-in rate limiting helps prevent abuse

### Frontend Security

1. **HTTPS**: Both Render and Vercel provide HTTPS by default
2. **Environment Variables**: Use Vercel's environment variables for sensitive data

## 📊 Monitoring and Logs

### Render.com

- **Logs**: Available in the service dashboard
- **Metrics**: CPU, Memory, and Request metrics
- **Alerts**: Set up alerts for downtime or errors

### Vercel

- **Function Logs**: Available in the Functions tab
- **Analytics**: Built-in web analytics
- **Speed Insights**: Performance monitoring

## 🐛 Troubleshooting

### Common Backend Issues

1. **Build Failures**:
   - Check `requirements.txt` is correct
   - Verify Python version compatibility
   - Check build logs for specific errors

2. **Runtime Errors**:
   - Verify Anthropic API key is set correctly
   - Check environment variables
   - Review application logs

3. **CORS Errors**:
   - Update allowed origins in FastAPI CORS middleware
   - Ensure frontend URL is included

### Common Frontend Issues

1. **Build Failures**:
   - Check `package.json` dependencies
   - Verify Node.js version
   - Check build command and output directory

2. **API Connection Issues**:
   - Verify backend URL is correct
   - Check CORS configuration
   - Test backend endpoints directly

## 🔄 Updates and Maintenance

### Updating Your Deployment

1. **Push changes** to your GitHub repository
2. **Automatic deployment** will trigger on both platforms
3. **Monitor logs** for any issues
4. **Test** the deployed application

### Scaling Considerations

- **Render**: Upgrade your plan for better performance
- **Vercel**: Consider Vercel Pro for higher limits
- **Database**: Consider adding a database for persistent storage
- **Caching**: Implement caching for better performance

## 💰 Cost Estimation

### Render.com (Backend)

- **Free Tier**: Available but with limitations
- **Starter Plan**: $7/month for better performance
- **Pro Plan**: $25/month for production use

### Vercel (Frontend)

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use
- **Enterprise**: Custom pricing

### Anthropic API

- **Claude-3-Sonnet**: ~$0.003 per 1K tokens input, ~$0.015 per 1K tokens output
- **Estimated cost**: $0.02-$0.15 per document analysis

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs** on both platforms
2. **Review the troubleshooting section** above
3. **Consult platform documentation**:
   - [Render.com Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
4. **Check GitHub Issues** for known problems 