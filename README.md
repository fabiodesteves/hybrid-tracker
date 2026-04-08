# 🚀 Hybrid Tracker

Hybrid Tracker is a modern, responsive **Progressive Web App (PWA)** designed to help professionals manage their hybrid work schedule. Whether you need to meet a specific office attendance percentage or simply want to track your home vs. office days, Hybrid Tracker provides a sleek, automated experience to keep you on target.

---

## ✨ Key Features

-   **📊 Smart Dashboard**: Get real-time insights into your current quarter's attendance stats. The dashboard calculates how many more office days you need to reach your personalized target.
-   **📅 Interactive Calendar**: A beautiful glassmorphism-inspired calendar to log your work status (Office, Home, or Holiday).
-   **📍 Geolocation Prompts**: Automatically detects when you are near your saved office location and prompts you to log your attendance with one click.
-   **🇵🇹 Holiday Integration**: Automatically fetches and identifies Portuguese public holidays so you don't accidentally log them as work days.
-   **🔐 Secure Authentication**: Powered by Firebase and Google Sign-In. Your data is synced across devices, and your Google password is never handled by the app.
-   **📱 PWA Ready**: Install Hybrid Tracker on your home screen (iOS/Android/Desktop) for a native app-like experience.

---

## 🛠️ Tech Stack

-   **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
-   **Date Utilities**: [date-fns](https://date-fns.org/)
-   **PWA**: [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (latest LTS recommended)
-   A Firebase project (see setup below)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/fabiodesteves/hybrid-tracker.git
    cd hybrid-tracker
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Firebase Setup**:
    *   Create a `.env` file or update `src/services/firebase.js` with your Firebase configuration.
    *   Enable **Google Authentication** in the Firebase Console.
    *   Enable **Firestore Database**.

4.  **Run locally**:
    ```bash
    npm run dev
    ```

---

## 🎨 Design Philosophy

Hybrid Tracker follows a **Premium Modern Aesthetic**:
-   **Glassmorphism**: Subtle translucency and blurred backgrounds for a sophisticated look.
-   **Dynamic Feedback**: Responsive hover effects and micro-animations.
-   **Mobile-First**: Optimized for on-the-go logging.

## 🔒 Security

We prioritize your privacy. By using **Google Identity Federation** via Firebase, this application handles authentication through Google's secure handshake. We never have access to your Google credentials; we only receive a verification token to manage your attendance logs.

---

## 📄 License

This project is private and intended for personal use.

---
*Created with ❤️ by Fabiodesteves*
