// App.jsx or your router
import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import LoginPage from "./login";
import RegisterPage from "./register";

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'register'
  const API_BASE = 'http://localhost:3001/api';

  const handleLogin = async ({ email, password, otp, remember }) => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      alert('Login successful!');
      console.log('User logged in:', data.user);

      // Redirect to the specified URL
      window.location.href = 'https://pathanjafar-61.vercel.app/';
    } catch (error) {
      alert(error.message);
      console.error('Login error:', error);
    }
  };

  const handleRegister = async ({ email, password, otp, phone }) => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, otp, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Registration successful! You can now log in.');
      console.log('User registered:', data.user);

      // Switch to login page after successful registration
      setCurrentPage('login');
    } catch (error) {
      throw new Error(error.message);
    }
  };

  useEffect(() => {
    // Check for GitHub OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, "/");
      handleGithubCallback(code);
    }
  }, []);

  const handleGithubCallback = async (code) => {
    try {
      const response = await fetch(`${API_BASE}/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'GitHub login failed');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('GitHub Login successful!');
      window.location.href = 'https://pathanjafar-61.vercel.app/';
    } catch (err) {
      alert(err.message);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Google login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Google Login successful!');
        window.location.href = 'https://pathanjafar-61.vercel.app/';
      } catch (err) {
        alert(err.message);
      }
    },
    onError: () => alert('Google login failed')
  });

  const handleForgotPassword = () => {
    alert("Forgot password functionality not implemented yet");
  };

  const handleOAuth = (provider) => {
    if (provider === 'google') {
      googleLogin();
    } else if (provider === 'github') {
      const REDIRECT_URI = 'http://localhost:5174/';
      const GITHUB_CLIENT_ID = 'Ov23li7YTqWNrIaVr903';
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email`;
    }
  };

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onLogin={() => setCurrentPage('login')}
      />
    );
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
      onSignUp={() => setCurrentPage('register')}
      onOAuth={handleOAuth}
    />
  );
}

export default App;