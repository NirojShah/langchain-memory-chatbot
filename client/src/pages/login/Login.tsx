import React, { useState, type FormEvent } from 'react';
import './login.css';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Add your login API logic here
    console.log('Login submitted');
  };

  return (
    <div className="login-container">
      <div className="login-glass-card">

        <div className="login-header">
          <div className="login-logo">✦</div>

          <h1>Welcome Back</h1>
          <p>Enter your credentials to access your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>

            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" className="login-button">
            Sign In
            <span>→</span>
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <p className="signup-text">
          Don't have an account?
          <a href="/register"> Create Account</a>
        </p>

      </div>

      <div className="login-footer">
        © 2026 Your Brand. All rights reserved.
      </div>
    </div>
  );
};

export default Login;