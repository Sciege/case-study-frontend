# PathQuest Frontend (Expo)

This is the mobile frontend for the PathQuest project, built with Expo and React Native.

## Deployment to Vercel

The web version of this app is ready to be deployed to Vercel as a Single Page Application (SPA).

### Prerequisites
-   A Vercel account.
-   The backend must be reachable (it is currently set to your Render URL).

### Deployment Steps

1.  **Connect to GitHub**: Import this repository into Vercel.
2.  **Configure Project Settings**:
    -   **Framework Preset**: Select `Other` (Vercel should detect the configuration automatically, but `Other`/`Create React App` style usually works if it doesn't).
    -   **Build Command**: `npm run build` (which runs `npx expo export --platform web`).
    -   **Output Directory**: `dist`.
3.  **Environment Variables**:
    -   Add `EXPO_PUBLIC_API_URL` with the value `https://case-study-backend-9b1z.onrender.com/api`.
4.  **Deploy**: Click "Deploy" and Vercel will handle the rest.

### Local Development
-   `npm install`
-   `npx expo start`
