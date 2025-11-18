import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Initialize application
async function initializeApp() {
  try {
    console.log('Starting React application...');
    
    // Render the React application
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    
    console.log('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    
    // Show error message to user
    const root = document.getElementById('root');
    root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 2rem;
      ">
        <h1 style="margin-bottom: 1rem;">Application Startup Failed</h1>
        <p style="margin-bottom: 2rem; max-width: 600px;">
          The application failed to start properly. Please check the console for error details.
        </p>
        <button onclick="window.location.reload()" style="
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1rem;
        ">
          Retry
        </button>
      </div>
    `;
  }
}

// Start the application
initializeApp();
