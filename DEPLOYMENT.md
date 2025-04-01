# Deployment Guide for PharmaTrack Web

This guide provides instructions for deploying the PharmaTrack Web application using Firebase Hosting.

## Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Firebase project created at [firebase.google.com](https://firebase.google.com)
4. Firebase Authentication email/password sign-in method enabled
5. Firestore Database set up

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Firebase

Make sure your Firebase configuration in `src/services/firebase.js` is correctly set up with your Firebase project details.

## Step 3: Populate Sample Data (Optional)

To populate your Firebase project with sample data for testing:

```bash
npm run sample-data
```

This will create:
- A pharmacist user (email: pharmacist@example.com, password: password123)
- Sample patients
- Sample prescriptions
- Sample conversations and messages

## Step 4: Build the Application

```bash
npm run build
```

This creates a `dist` directory with optimized production build files.

## Step 5: Initialize Firebase Hosting

```bash
firebase login
firebase init
```

During the initialization process:
- Select "Hosting" from the features
- Select your Firebase project
- Use "dist" as the public directory
- Configure as a single-page app (Yes)
- Don't overwrite index.html (No)

## Step 6: Deploy to Firebase Hosting

```bash
firebase deploy
```

After successful deployment, you'll receive a URL where your app is hosted.

## Troubleshooting

### 1. Blank Screen / No Content Showing

If the app is deployed but shows a blank screen:

- Check browser console for errors
- Ensure Firebase config is correct
- Make sure authentication is set up properly
- Verify the Firestore database has proper security rules

### 2. Auth Issues

If you can't sign in with the pharmacist account:

- Check that you've enabled email/password authentication in Firebase Console
- Try resetting the password in Firebase Authentication console
- Verify that you've run the sample data script successfully

### 3. Firestore Issues

If data isn't showing:

- Check Firestore security rules
- Make sure the collections were created correctly by the sample script
- Verify that the data structure matches what the app expects

## Additional Deployment Options

### 1. Using Netlify

1. Create a Netlify account
2. Install Netlify CLI: `npm install -g netlify-cli`
3. Build the app: `npm run build`
4. Deploy: `netlify deploy --prod`

### 2. Using Vercel

1. Create a Vercel account
2. Install Vercel CLI: `npm install -g vercel`
3. Deploy: `vercel`

## Production Considerations

1. Set up proper Firestore security rules
2. Configure Firebase Authentication with proper settings
3. Set up environment variables for different environments
4. Consider implementing Firebase Functions for backend logic