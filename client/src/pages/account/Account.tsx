import React, { useEffect, useState, type FormEvent } from 'react';
import {
  deactivateMe,
  getMe,
  logout,
  updateMe,
  type UserProfile,
} from '../../services/api';
import './account.css';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
}

const Account: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        const user = await getMe();
        setProfile(user);
        setUserName(user.userName);
        setEmail(user.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load your account');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!profile) {
      return;
    }

    const updates = {
      ...(userName.trim() !== profile.userName && { userName: userName.trim() }),
      ...(email.trim() !== profile.email && { email: email.trim() }),
    };
    if (Object.keys(updates).length === 0) {
      return;
    }

    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const result = await updateMe(updates);
      const updatedProfile = { ...profile, ...result.user };
      setProfile(updatedProfile);
      setUserName(updatedProfile.userName);
      setEmail(updatedProfile.email);
      setNotice(result.message || 'Your account has been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setError('');
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign out');
      setIsLoggingOut(false);
    }
  };

  const handleDeactivate = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Deactivate your account? You will be signed out and will no longer be able to access it.',
    );
    if (!confirmed) {
      return;
    }

    setError('');
    setIsDeactivating(true);
    try {
      await deactivateMe();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate your account');
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="account-page">
        <section className="account-card account-loading" aria-live="polite">
          Loading your account...
        </section>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <a className="account-brand" href="/chat">
          <span className="account-brand-icon" aria-hidden="true">✦</span>
          Memory Chat
        </a>
        <a className="account-back-link" href="/chat">Back to chats <span aria-hidden="true">→</span></a>
      </header>

      <section className="account-content">
        <div className="account-intro">
          <span className="account-eyebrow">Personal workspace</span>
          <h1>Account settings</h1>
          <p>Manage your profile and account preferences.</p>
        </div>

        {error && (
          <div className="account-alert account-alert-error" role="alert">
            {error}
            {!profile && <a href="/login">Sign in to continue</a>}
          </div>
        )}
        {notice && <div className="account-alert account-alert-success" role="status">{notice}</div>}

        {profile && (
          <>
            <section className="account-card">
              <div className="account-section-heading">
                <div className="account-avatar" aria-hidden="true">
                  {profile.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{profile.userName}</h2>
                  <p>{profile.email}</p>
                </div>
                <span className={`account-status ${profile.isActive ? 'is-active' : ''}`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <form className="account-form" onSubmit={(event) => void handleSave(event)}>
                <div className="account-field">
                  <label htmlFor="account-name">Display name</label>
                  <input
                    id="account-name"
                    type="text"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="account-field">
                  <label htmlFor="account-email">Email address</label>
                  <input
                    id="account-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="account-primary-button"
                  disabled={
                    isSaving ||
                    (!userName.trim() && !email.trim()) ||
                    (userName.trim() === profile.userName && email.trim() === profile.email)
                  }
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>

              <div className="account-metadata">
                <div><span>Member since</span><strong>{formatDate(profile.createdAt)}</strong></div>
                <div><span>Last updated</span><strong>{formatDate(profile.updatedAt)}</strong></div>
              </div>
            </section>

            <section className="account-card account-session-card">
              <div>
                <h2>Session</h2>
                <p>Sign out of your account on this device.</p>
              </div>
              <button
                type="button"
                className="account-secondary-button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut || isDeactivating}
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </section>

            <section className="account-danger-zone">
              <div>
                <h2>Deactivate account</h2>
                <p>This disables your account and signs you out. This action cannot be undone here.</p>
              </div>
              <button
                type="button"
                className="account-danger-button"
                onClick={() => void handleDeactivate()}
                disabled={isDeactivating || isLoggingOut}
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate account'}
              </button>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default Account;
