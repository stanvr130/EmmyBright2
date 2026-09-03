import React, { useState, useEffect } from 'react';
import api from './api/api';

function Auth({ onAuthSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // OTP verification state (registration / unverified-login)
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  // pendingUserPayload holds the user object (plus _pendingToken) ONLY in memory
  // until OTP verification succeeds — nothing touches localStorage until then.
  const [pendingUserPayload, setPendingUserPayload] = useState(null);

  // Forgot / reset password state
  const [showForgotScreen, setShowForgotScreen] = useState(false);
  const [showResetScreen, setShowResetScreen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Responsive state tracking
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Countdown ticker for resend cooldown (shared by OTP screen and reset screen)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    // Confirm-password check only applies to registration — login only has one password field.
    if (!isLoginView && formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    const endpoint = isLoginView ? '/auth/login' : '/auth/register';
    // Never send confirmPassword to the backend — it's a client-side check only.
    const payload = isLoginView
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    try {
      const response = await api.post(endpoint, payload);
      const data = response.data;

      const userPayload = data.user || {
        name: formData.name || formData.email,
        email: formData.email,
        role: 'user',
      };

      const token = data.accessToken || data.token;

      if (isLoginView) {
        // Login is gated on email verification.
        // IMPORTANT: do NOT write to localStorage here — only after OTP succeeds.
        if (!userPayload.emailVerified) {
          setAlert({ type: 'error', message: 'Please verify your email to continue.' });
          setPendingUserPayload({ ...userPayload, _pendingToken: token });
          await sendOtpRequest(formData.email);
          setShowOtpScreen(true);
          return;
        }

        setAlert({ type: 'success', message: 'Welcome back!' });

        if (token) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(userPayload));
        }

        setTimeout(() => {
          onAuthSuccess(userPayload);
        }, 800);
      } else {
        // Registration also requires OTP verification before login.
        // IMPORTANT: do NOT write to localStorage here — only after OTP succeeds.
        setPendingUserPayload({ ...userPayload, _pendingToken: token });
        setAlert({ type: 'success', message: 'Account created! Verifying your email...' });

        await sendOtpRequest(formData.email);
        setShowOtpScreen(true);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong during authentication.';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Sends (or resends) the email-verification OTP code
  const sendOtpRequest = async (email) => {
    try {
      await api.post('/auth/send-otp', { email });
      setCooldown(30);
    } catch (err) {
      const errorData = err.response?.data;
      if (err.response?.status === 429 && errorData?.retryAfter) {
        setCooldown(errorData.retryAfter);
      }
      setAlert({
        type: 'error',
        message: errorData?.error || 'Failed to send verification code.',
      });
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setAlert({ type: '', message: '' });
    await sendOtpRequest(formData.email);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await api.post('/auth/verify-otp', { email: formData.email, code: otpCode });
      setAlert({ type: 'success', message: 'Email verified! Welcome to EmmyBright.' });

      // Only NOW do we persist the session, after verification actually succeeded.
      const { _pendingToken, ...cleanUserPayload } = pendingUserPayload || {};
      const verifiedUser = { ...cleanUserPayload, emailVerified: true };

      if (_pendingToken) {
        localStorage.setItem('authToken', _pendingToken);
        localStorage.setItem('userData', JSON.stringify(verifiedUser));
      }

      setTimeout(() => {
        onAuthSuccess(verifiedUser);
      }, 600);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Invalid or expired code.';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot / reset password handlers ---

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      setAlert({ type: 'success', message: "If that email exists, we've sent a code." });
      setCooldown(30);
      setShowForgotScreen(false);
      setShowResetScreen(true);
    } catch (err) {
      const errorData = err.response?.data;
      if (err.response?.status === 429 && errorData?.retryAfter) {
        setCooldown(errorData.retryAfter);
      }
      setAlert({ type: 'error', message: errorData?.error || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendReset = async () => {
    if (cooldown > 0) return;
    setAlert({ type: '', message: '' });
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      setCooldown(30);
    } catch (err) {
      const errorData = err.response?.data;
      if (err.response?.status === 429 && errorData?.retryAfter) {
        setCooldown(errorData.retryAfter);
      }
      setAlert({ type: 'error', message: errorData?.error || 'Failed to resend code.' });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (newPassword !== confirmNewPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        code: resetCode,
        newPassword,
      });
      setAlert({ type: 'success', message: 'Password reset! Please log in.' });
      setShowResetScreen(false);
      setIsLoginView(true);
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFormData((prev) => ({ ...prev, email: resetEmail, password: '', confirmPassword: '' }));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Invalid or expired code.';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // "Check your email" / OTP entry screen (registration / unverified login)
  if (showOtpScreen) {
    return (
      <div style={styles.authWrapper}>
        <div style={{ ...styles.authContainer, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ ...styles.brandPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.brandContent}>
              <span style={styles.brandBadge}>EST. BOUTIQUE</span>
              <h1 style={styles.brandTitle}>EmmyBright</h1>
              <p style={styles.brandSubtitle}>Bespoke Tailoring & Luxury Footwear</p>
            </div>
          </div>

          <div style={{ ...styles.formPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.headerGroup}>
              <h2 style={styles.formTitle}>Check your email</h2>
              <p style={styles.formSubtitle}>
                We've sent a 6-digit code to <strong>{formData.email}</strong>
              </p>
            </div>

            {alert.message && (
              <div style={alert.type === 'success' ? styles.successBox : styles.errorBox}>
                {alert.message}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading || otpCode.length !== 6} style={styles.submitBtn}>
                {loading ? <span style={styles.spinner}>Verifying...</span> : 'Verify Email'}
              </button>
            </form>

            <div style={styles.switchContainer}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0}
                style={{
                  ...styles.switchBtn,
                  opacity: cooldown > 0 ? 0.5 : 1,
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // "Forgot your password?" — enter email screen
  if (showForgotScreen) {
    return (
      <div style={styles.authWrapper}>
        <div style={{ ...styles.authContainer, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ ...styles.brandPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.brandContent}>
              <span style={styles.brandBadge}>EST. BOUTIQUE</span>
              <h1 style={styles.brandTitle}>EmmyBright</h1>
              <p style={styles.brandSubtitle}>Bespoke Tailoring & Luxury Footwear</p>
            </div>
          </div>

          <div style={{ ...styles.formPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.headerGroup}>
              <h2 style={styles.formTitle}>Reset your password</h2>
              <p style={styles.formSubtitle}>
                Enter your account email and we'll send you a code.
              </p>
            </div>

            {alert.message && (
              <div style={alert.type === 'success' ? styles.successBox : styles.errorBox}>
                {alert.message}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? <span style={styles.spinner}>Sending...</span> : 'Send Reset Code'}
              </button>
            </form>

            <div style={styles.switchContainer}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotScreen(false);
                  setAlert({ type: '', message: '' });
                }}
                style={styles.switchBtn}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // "Enter your code" + new password screen
  if (showResetScreen) {
    return (
      <div style={styles.authWrapper}>
        <div style={{ ...styles.authContainer, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ ...styles.brandPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.brandContent}>
              <span style={styles.brandBadge}>EST. BOUTIQUE</span>
              <h1 style={styles.brandTitle}>EmmyBright</h1>
              <p style={styles.brandSubtitle}>Bespoke Tailoring & Luxury Footwear</p>
            </div>
          </div>

          <div style={{ ...styles.formPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
            <div style={styles.headerGroup}>
              <h2 style={styles.formTitle}>Enter your code</h2>
              <p style={styles.formSubtitle}>
                We've sent a 6-digit code to <strong>{resetEmail}</strong>
              </p>
            </div>

            {alert.message && (
              <div style={alert.type === 'success' ? styles.successBox : styles.errorBox}>
                {alert.message}
              </div>
            )}

            <form onSubmit={handleResetSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                style={styles.submitBtn}
              >
                {loading ? <span style={styles.spinner}>Resetting...</span> : 'Reset Password'}
              </button>
            </form>

            <div style={styles.switchContainer}>
              <button
                type="button"
                onClick={handleResendReset}
                disabled={cooldown > 0}
                style={{
                  ...styles.switchBtn,
                  opacity: cooldown > 0 ? 0.5 : 1,
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authWrapper}>
      <div style={{ ...styles.authContainer, flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Left Branding Panel */}
        <div style={{ ...styles.brandPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
          <div style={styles.brandContent}>
            <span style={styles.brandBadge}>EST. BOUTIQUE</span>
            <h1 style={styles.brandTitle}>EmmyBright</h1>
            <p style={styles.brandSubtitle}>Bespoke Tailoring & Luxury Footwear</p>
          </div>
        </div>

        {/* Form Panel */}
        <div style={{ ...styles.formPanel, padding: isMobile ? '32px 24px' : '48px 40px' }}>
          <div style={styles.headerGroup}>
            <h2 style={styles.formTitle}>{isLoginView ? 'Sign In' : 'Create Account'}</h2>
            <p style={styles.formSubtitle}>
              {isLoginView
                ? 'Enter your details to access your luxury wardrobe'
                : 'Register to begin tailoring your signature styles'}
            </p>
          </div>

          {alert.message && (
            <div style={alert.type === 'success' ? styles.successBox : styles.errorBox}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLoginView && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@domain.com"
                required
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleInputChange}
                style={styles.input}
              />
              {isLoginView && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(formData.email);
                    setAlert({ type: '', message: '' });
                    setShowForgotScreen(true);
                  }}
                  style={{ ...styles.switchBtn, alignSelf: 'flex-end', fontSize: '12px', marginTop: '4px' }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {!isLoginView && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? (
                <span style={styles.spinner}>Processing...</span>
              ) : isLoginView ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div style={styles.switchContainer}>
            <span style={styles.switchViewText}>
              {isLoginView ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAlert({ type: '', message: '' });
              }}
              style={styles.switchBtn}
            >
              {isLoginView ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  authWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '16px',
    boxSizing: 'border-box',
  },
  authContainer: {
    display: 'flex',
    width: '100%',
    maxWidth: '880px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
    border: '1px solid #EAEAEA',
    transition: 'all 0.3s ease',
  },
  brandPanel: {
    flex: '1',
    backgroundColor: '#111111',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  brandContent: {
    maxWidth: '280px',
  },
  brandBadge: {
    fontSize: '10px',
    letterSpacing: '2px',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'inline-block',
  },
  brandTitle: {
    fontFamily: '"Didot", "Bodoni MT", "Cinzel", "Georgia", serif',
    fontSize: '32px',
    fontWeight: '400',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: '13px',
    letterSpacing: '0.5px',
    color: '#999999',
    margin: 0,
    lineHeight: '1.5',
    fontWeight: '300',
  },
  formPanel: {
    flex: '1.1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerGroup: {
    marginBottom: '28px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#111111',
    margin: '0 0 6px 0',
    letterSpacing: '-0.3px',
  },
  formSubtitle: {
    fontSize: '13px',
    color: '#666666',
    margin: 0,
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#444444',
  },
  input: {
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    outline: 'none',
    backgroundColor: '#FAFAFA',
    color: '#111111',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  },
  submitBtn: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.3px',
    transition: 'opacity 0.2s ease',
  },
  spinner: {
    opacity: 0.8,
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '24px',
  },
  switchViewText: {
    fontSize: '13px',
    color: '#666666',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#111111',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    color: '#E53E3E',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #FED7D7',
  },
  successBox: {
    backgroundColor: '#F0FFF4',
    color: '#38A169',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #C6F6D5',
  },
};

export default Auth;