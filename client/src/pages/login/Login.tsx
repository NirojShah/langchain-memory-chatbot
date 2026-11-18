import React, { useState, type FormEvent } from 'react';
import { login } from '../../services/api';
import './login.css';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {error && <p role="alert">{error}</p>}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
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