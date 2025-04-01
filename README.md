# PharmaTrack Web Portal

A web portal for pharmacists to view patient prescriptions and communicate with patients using the PharmaTrack iOS app.

## Features

- Secure pharmacist login portal
- View patient list with search functionality
- Detailed patient profiles with prescription history
- Messaging system between pharmacists and patients
- Real-time updates through Firebase integration

## Tech Stack

- React (Frontend library)
- Firebase (Authentication, Firestore, Storage)
- React Router (Client-side routing)
- Styled Components (Styling)
- Vite (Build tool)

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Firebase account with project setup

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pharmatrack-web.git
cd pharmatrack-web
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure Firebase
   - Create a `.env` file at the root of your project
   - Copy the contents from `.env.example` into your `.env` file and add your Firebase configuration values
   - The Firebase config is now securely loaded from environment variables

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Build for production
```bash
npm run build
# or
yarn build
```

## Project Structure

```
/src
  /components       # Reusable UI components
  /pages            # Page components
  /services         # Firebase and other service integrations
  /utils            # Utility functions
  App.jsx           # Main app component
  index.jsx         # Application entry point
  index.css         # Global styles
```

## Firebase Configuration

This application requires the following Firebase services:

- Authentication (Email/Password)
- Firestore Database
- Cloud Storage

Firestore collections:
- `patients` - Patient information
- `prescriptions` - Prescription details with references to patients
- `conversations` - Message threads between patients and pharmacists
- `messages` - Individual messages within conversations

### Environment Variables

For security, Firebase credentials are loaded from environment variables. Create a `.env` file with these variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Note:** Never commit your `.env` file to version control. The `.env` file is included in `.gitignore` to prevent accidental commits.

## License

MIT
