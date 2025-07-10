# 🧠 DocuChat - AI Document Analyzer

A full-stack web application that uses Anthropic's Claude to analyze PDF and DOCX documents, providing summaries, key points, and risk flags.

## ✨ Features

- 📁 **File Upload**: Support for PDF and DOCX documents (up to 10MB)
- 📝 **Text Input**: Direct text analysis via paste
- 🤖 **AI Analysis**: Powered by Anthropic Claude
- 📊 **Comprehensive Results**:
  - Document summary
  - Key important points
  - Risk flags with 🚩 emojis
- 💬 **Interactive Chat**: Ask follow-up questions about your document
- 🎨 **Modern UI**: Clean, responsive design with loading states
- 🔒 **Usage Limits**: Built-in rate limiting (1 request per IP per day)

## 🏗️ Architecture

- **Frontend**: React + Vite with modern CSS
- **Backend**: FastAPI with Python
- **AI**: Anthropic Claude API
- **File Processing**: PDF (pdfplumber) and DOCX (python-docx) support

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Anthropic API Key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**:
   Create a `.env` file in the backend directory:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   DAILY_REQUEST_LIMIT=1
   MAX_FILE_SIZE_MB=10
   MAX_TEXT_LENGTH=50000
   ```

5. **Run the backend**:
   ```bash
   python main.py
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## 📖 Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Choose input method**:
   - **Upload File**: Select a PDF or DOCX file (max 10MB)
   - **Paste Text**: Directly input text content (max 50,000 characters)

3. **Submit for analysis** - the AI will process your document and provide:
   - A concise summary of the document
   - Key important points as bullet points
   - Risk flags highlighting concerning or confusing sections

4. **Review results** with clear visual formatting and emoji indicators

5. **Chat about your document** - After analysis, use the interactive chat feature to:
   - Ask specific questions about sections of your document
   - Get clarifications on confusing parts
   - Explore the document's content in more detail
   - Request explanations of technical terms or concepts

## 🔧 API Endpoints

### Backend API (`http://localhost:8000`)

- `GET /` - Health check
- `POST /analyze-file` - Analyze uploaded PDF/DOCX file
- `POST /analyze-text` - Analyze pasted text content
- `POST /chat` - Chat about a previously analyzed document
- `GET /document/{document_id}/history` - Get chat history for a document

## 🌐 Deployment

### Backend Deployment (Render.com)

1. **Create a new Web Service** on [Render.com](https://render.com)

2. **Connect your repository** and configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     DAILY_REQUEST_LIMIT=1
     MAX_FILE_SIZE_MB=10
     MAX_TEXT_LENGTH=50000
     ```

3. **Deploy** - Render will automatically build and deploy your backend

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Update API URL**: After backend deployment, update the API calls in `src/App.jsx` to use your Render backend URL instead of `http://localhost:8000`

## 🔐 Configuration

### Environment Variables

**Backend (.env)**:
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `DAILY_REQUEST_LIMIT` - Requests per IP per day (default: 1)
- `MAX_FILE_SIZE_MB` - Maximum file size in MB (default: 10)
- `MAX_TEXT_LENGTH` - Maximum text length (default: 50000)

### Security Features

- **Rate Limiting**: 1 request per IP address per day
- **File Size Limits**: Maximum 10MB file uploads
- **File Type Validation**: Only PDF and DOCX files accepted
- **Text Length Limits**: Maximum 50,000 characters for direct text input
- **CORS Protection**: Configured for specific origins

## 🛠️ Development

### Backend Development

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend**:
```bash
cd frontend
npm run build
```

## 📝 File Structure

```
docuchat/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.css          # Application styles
│   │   ├── ChatInterface.jsx # Chat component for document Q&A
│   │   ├── ChatInterface.css # Chat component styles
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # React entry point
│   ├── index.html           # HTML template
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite configuration
└── README.md                # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues and questions:
- Check the [Issues](https://github.com/yourusername/docuchat/issues) page
- Review the deployment guides above
- Ensure your Anthropic API key is properly configured

## 🙏 Acknowledgments

- Anthropic for the Claude API
- FastAPI for the excellent Python web framework
- React and Vite for the modern frontend tools
- pdfplumber and python-docx for document processing 