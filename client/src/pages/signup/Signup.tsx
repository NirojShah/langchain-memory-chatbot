import React, { useState, type FormEvent } from 'react';
import './signup.css';

interface ISignupForm {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [formData, setFormData] = useState<ISignupForm>({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const signupPayload = {
      userName: formData.userName,
      email: formData.email,
      password: formData.password,
    };

    // Add your signup API logic here
    console.log('Signup submitted:', signupPayload);
  };

  return (
    <div className="signup-container">

      <div className="signup-glass-card">

        <div className="signup-header">
          <div className="signup-logo">✦</div>

          <h1>Create Account</h1>

          <p>
            Get started by creating your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Username */}
          <div className="signup-input-group">
            <label htmlFor="userName">Username</label>

            <input
              type="text"
              id="userName"
              name="userName"
              placeholder="Enter your username"
              value={formData.userName}
              onChange={handleChange}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>

          {/* Email */}
          <div className="signup-input-group">
            <label htmlFor="email">Email Address</label>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label htmlFor="password">Password</label>

            <div className="signup-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="signup-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <div className="signup-password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="signup-button">
            Create Account
            <span>→</span>
          </button>

        </form>

        <div className="signup-divider">
          <span>OR</span>
        </div>

        <p className="signup-login-text">
          Already have an account?
          <a href="/login"> Sign In</a>
        </p>

      </div>

      <div className="signup-footer">
        © 2026 Your Brand. All rights reserved.
      </div>

    </div>
  );
};

export default Signup;