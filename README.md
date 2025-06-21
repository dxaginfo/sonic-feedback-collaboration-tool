# Sonic Feedback Collaboration Tool

A modern web application for musicians, producers, and collaborators to share audio tracks, provide timestamped feedback, and track version history throughout the music creation process.

## 🎵 Project Overview

The Sonic Feedback Collaboration Tool streamlines the music creation and review process by allowing:

- Audio track sharing with precise timestamped feedback
- Multi-track version comparison and history tracking
- Structured feedback categorization (mixing, composition, performance)
- Real-time collaboration between artists, producers, and collaborators
- Project organization and workflow management

## ✨ Features

- **User Authentication System**
  - Secure login and user management
  - Role-based permissions (artist, collaborator, producer)

- **Track Upload and Management**
  - Support for multiple audio formats (MP3, WAV, FLAC)
  - Metadata tagging (title, description, genre, BPM, key)
  - Version control and history tracking

- **Interactive Waveform Display**
  - Visual representation of audio tracks
  - Zoom and navigation controls
  - Playback functionality

- **Timestamped Feedback System**
  - Point-specific comments anchored to timeline positions
  - Comment threading for discussions
  - Feedback categorization by type

- **Version Comparison**
  - Side-by-side waveform comparison
  - A/B listening tests
  - Change highlighting between versions

## 🛠️ Technology Stack

### Frontend
- React.js with TypeScript
- Redux for state management
- Material-UI components
- Web Audio API and Wavesurfer.js for audio visualization
- Socket.IO for real-time updates

### Backend
- Node.js with Express
- RESTful API with OpenAPI specification
- JWT authentication
- Socket.IO server for real-time communication

### Database
- PostgreSQL for relational data
- AWS S3 for audio file storage
- Redis for caching

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis
- AWS S3 bucket or compatible storage service

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/dxaginfo/sonic-feedback-collaboration-tool.git
   cd sonic-feedback-collaboration-tool
   ```

2. Install dependencies
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables
   ```bash
   # In server directory
   cp .env.example .env
   # Edit .env with your database, S3, and other configuration details
   ```

4. Run database migrations
   ```bash
   cd server
   npm run migrate
   ```

5. Start development servers
   ```bash
   # Start backend server
   cd server
   npm run dev

   # In a separate terminal, start frontend development server
   cd client
   npm start
   ```

6. Access the application at `http://localhost:3000`

## 📁 Project Structure

```
.
├── client                  # Frontend React application
│   ├── public              # Static assets
│   └── src                 # React source code
│       ├── assets          # Images, styles, etc.
│       ├── components      # Reusable UI components
│       ├── contexts        # React contexts
│       ├── hooks           # Custom React hooks
│       ├── pages           # Page components
│       ├── services        # API service functions
│       └── utils           # Utility functions
│
├── server                  # Backend Node.js application
│   ├── src
│   │   ├── config          # Configuration files
│   │   ├── controllers     # Route controllers
│   │   ├── middleware      # Express middleware
│   │   ├── models          # Data models
│   │   ├── routes          # API routes
│   │   ├── services        # Business logic
│   │   └── utils           # Utility functions
│   │
│   ├── migrations          # Database migrations
│   └── tests               # Backend tests
│
└── docs                    # Documentation
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.