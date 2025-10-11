# 🤖 AI Task Master

An intelligent task management system powered by Google's Gemini AI. Automatically extract tasks from emails and text, get smart prioritization, daily planning, and productivity insights.

![AI Task Master](https://img.shields.io/badge/AI-Powered-brightgreen) ![Node](https://img.shields.io/badge/Node-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green) ![Gemini](https://img.shields.io/badge/Gemini-AI-orange)

## ✨ Features

### 🎯 Smart AI Features
- **Task Extraction**: Paste emails, meeting notes, or any text - AI extracts actionable tasks automatically
- **Intelligent Prioritization**: AI analyzes and prioritizes tasks using the Eisenhower Matrix
- **Daily Planning**: Generate optimized daily schedules based on your tasks and energy levels
- **Productivity Analytics**: Get AI-powered insights into your work patterns and productivity
- **Meeting Preparation**: Generate agendas, talking points, and follow-up tasks

### 📊 Task Management
- Create, update, and delete tasks
- Filter by status, priority, and category
- Set due dates and estimated times
- Add tags and subtasks
- Track completion and time spent

### 📈 Dashboard
- Real-time productivity score
- Today's tasks and upcoming deadlines
- Completion rate tracking
- Project progress overview

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or MongoDB Atlas)
- **Gemini API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone or use this repository**
```bash
cd aiwork
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure Environment Variables**

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-task-master
JWT_SECRET=your-super-secret-jwt-key-change-this
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=http://localhost:3000
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
```

⚠️ **Your Gemini API Key is already configured**: `AIzaSyAnESoyXNN7-4WYF9hl1vFu43ARQVAfyc4`

5. **Set up MongoDB**

Option A - Local MongoDB:
```bash
# Install MongoDB: https://www.mongodb.com/try/download/community
# Start MongoDB service
mongod
```

Option B - MongoDB Atlas (Free Cloud):
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- Create a free cluster
- Get your connection string
- Update `MONGODB_URI` in `backend/.env`

6. **Start the Application**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

## 🎮 Usage Guide

### 1. Register an Account
- Go to `http://localhost:3000/register`
- Create your account
- Login to access the dashboard

### 2. Extract Tasks with AI
- Navigate to **AI Assistant** page
- Paste any text (email, meeting notes, message)
- Click "Extract Tasks with AI"
- AI will automatically create tasks from your text

Example input:
```
Hi team, tomorrow we need to:
- Review the Q4 budget by 2pm
- Update the client presentation by EOD
- Schedule a meeting with marketing for next week
Also don't forget to send the report to John.
```

### 3. View Your Dashboard
- See all your tasks at a glance
- Track productivity score
- View today's tasks and upcoming deadlines

### 4. Manage Tasks
- Go to **Tasks** page
- Filter by status, priority, or search
- Mark tasks as complete
- Edit or delete tasks

### 5. Generate Daily Plan
- Go to **AI Assistant** → **Daily Plan**
- AI creates an optimized schedule for your day
- Get productivity tips and time blocking suggestions

### 6. Analyze Productivity
- Go to **AI Assistant** → **Productivity Analytics**
- Get insights into your work patterns
- See strengths and areas for improvement
- Receive personalized recommendations

## 📁 Project Structure

```
aiwork/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Gemini configuration
│   │   ├── models/          # MongoDB models (User, Task, Project)
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Authentication middleware
│   │   ├── services/        # Gemini AI service
│   │   └── server.js        # Express server
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand state management
│   │   └── App.tsx
│   ├── package.json
│   └── .env
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI Features
- `POST /api/ai/extract-tasks` - Extract tasks from text
- `POST /api/ai/prioritize` - Prioritize tasks with AI
- `POST /api/ai/daily-plan` - Generate daily plan
- `GET /api/ai/productivity-analysis` - Get productivity analytics
- `POST /api/ai/meeting-prep` - Generate meeting preparation
- `POST /api/ai/suggest-tasks` - Get AI task suggestions

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/analytics` - Get analytics data

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Google Generative AI** - Gemini AI integration
- **Helmet** - Security
- **CORS** - Cross-origin support

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 🎨 Key Features in Detail

### AI Task Extraction
The system uses Gemini Pro to:
1. Parse natural language text
2. Identify actionable items
3. Extract context and details
4. Determine priority levels
5. Suggest categories and tags
6. Estimate time requirements

### Smart Prioritization
AI analyzes tasks based on:
- Eisenhower Matrix (urgent vs important)
- Due dates and deadlines
- Task dependencies
- Estimated effort
- Business impact

### Daily Planning
AI creates schedules considering:
- Your energy levels throughout the day
- Task complexity and mental load
- Meeting schedules
- Break times
- Deep work blocks

### Productivity Analytics
Get insights on:
- Most productive times of day
- Task completion patterns
- Average task duration
- Category preferences
- Strengths and improvement areas

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Helmet.js security headers
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection

## 🚀 Deployment

### Backend (Railway/Render/Heroku)
1. Create account on Railway/Render
2. Create new project from Git
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Create account on Vercel/Netlify
2. Import Git repository
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)
- Already cloud-ready
- Free tier available
- Automatic backups

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string format
- For Atlas: Whitelist your IP address

### Gemini API Errors
- Verify API key is correct
- Check API quota/limits
- Ensure network connectivity

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Or use different port in .env
PORT=5001
```

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

- Google Gemini AI for powerful natural language processing
- MongoDB for flexible data storage
- React community for excellent tools and libraries

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review MongoDB and Gemini AI documentation
3. Check console logs for error messages

---

**Built with ❤️ using Google Gemini AI**

🎯 Start managing your tasks smarter today!
# AI Task Master
