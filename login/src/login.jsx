import { useState } from "react";

// Minimal, attractive UI styles
const S = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at top left, #fdfbfb 0%, #ebedee 100%)",
    padding: "1.5rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(29, 158, 117, 0.05), transparent 70%)",
    top: "-200px",
    right: "-100px",
    zIndex: 0,
    filter: "blur(80px)",
  },
  card: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "440px",
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(30px) saturate(180%)",
    borderRadius: "32px",
    padding: "3rem 2.5rem",
    boxShadow: "0 25px 80px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.6)",
    transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
  },
  header: { textAlign: "center", marginBottom: "2.5rem" },
  brand: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1a1a1a",
    letterSpacing: "-0.04em",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  brandAccent: { 
    color: "#fff", 
    background: "#1D9E75", 
    padding: "2px 10px", 
    borderRadius: "10px",
    fontSize: "1.5rem"
  },
  subtitle: { 
    fontSize: "0.938rem", 
    color: "#6b7280", 
    fontWeight: 400,
    letterSpacing: "-0.01em"
  },
  tabWrap: {
    display: "flex",
    marginBottom: "2rem",
    background: "rgba(0,0,0,0.03)",
    borderRadius: "16px",
    padding: "5px",
    border: "1px solid rgba(0,0,0,0.02)",
  },
  tab: {
    flex: 1,
    border: "none",
    padding: "10px 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "12px",
    color: "#6b7280",
    background: "transparent",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  tabActive: {
    background: "#fff",
    color: "#1a1a1a",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
  },
  field: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    fontSize: "0.813rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
    marginLeft: "4px",
    letterSpacing: "0.01em",
  },
  input: {
    width: "100%",
    height: "52px",
    border: "1.5px solid rgba(0,0,0,0.05)",
    borderRadius: "16px",
    padding: "0 18px",
    fontSize: "0.938rem",
    background: "rgba(255,255,255,0.6)",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  inputFocus: {
    borderColor: "#1D9E75",
    background: "#fff",
    boxShadow: "0 0 0 4px rgba(29,158,117,0.1)",
    transform: "translateY(-1px)",
  },
  inputError: { 
    borderColor: "#ef4444",
    background: "rgba(239, 68, 68, 0.02)"
  },
  errorMsg: { 
    fontSize: "0.75rem", 
    color: "#ef4444", 
    marginTop: "6px", 
    marginLeft: "4px",
    fontWeight: 500
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  checkWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.813rem",
    color: "#4b5563",
    cursor: "pointer",
    fontWeight: 500,
  },
  forgot: {
    fontSize: "0.813rem",
    color: "#1D9E75",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: 0,
    transition: "opacity 0.2s",
  },
  btn: {
    width: "100%",
    height: "54px",
    background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    marginBottom: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  },
  btnHover: { 
    transform: "translateY(-2px)",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)",
  },
  btnLoading: { opacity: 0.7, pointerEvents: "none" },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "2rem 0",
    color: "#9ca3af",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  dividerLine: { flex: 1, height: "1px", background: "rgba(0,0,0,0.06)" },
  oauth: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  oBtn: {
    height: "50px",
    border: "1.5px solid rgba(0,0,0,0.05)",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.7)",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "all 0.2s ease",
  },
  oIcon: { width: "20px", height: "20px" },
  signupRow: { 
    textAlign: "center", 
    marginTop: "2.5rem", 
    fontSize: "0.875rem", 
    color: "#6b7280",
    fontWeight: 500 
  },
  signupLink: {
    color: "#1D9E75",
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: 0,
    marginLeft: "6px",
    transition: "color 0.2s",
  },
  sandboxBanner: {
    padding: "12px",
    background: "rgba(29, 158, 117, 0.08)",
    borderRadius: "12px",
    fontSize: "0.75rem",
    color: "#1D9E75",
    marginTop: "12px",
    border: "1px dashed rgba(29, 158, 117, 0.3)",
    lineHeight: "1.4",
  },
};

function useInputStyle(hasError, isFocused) {
  return {
    ...S.input,
    ...(isFocused ? S.inputFocus : {}),
    ...(hasError ? S.inputError : {}),
  };
}

export default function LoginPage({ onLogin, onForgotPassword, onSignUp, onOAuth }) {
  const [loginMode, setLoginMode] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [focus, setFocus] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (password.length < 8) {
      newErrors.password = "Min 8 characters required";
    }
    return newErrors;
  };

  const sendOTP = async () => {
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOtpSent(true);
      setErrors({});
      alert('OTP sent to your email!');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setErrors({ otp: "OTP required" });
      return;
    }
    setLoading(true);
    try {
      await onLogin?.({ email, password, otp, remember });
      setOtpSent(false);
      setOtp("");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOTP = async (phoneNum, type) => {
    const sanitizedPhone = phoneNum.replace(/\s+/g, '');
    if (!sanitizedPhone || sanitizedPhone === "+91") { // Added validation for sanitized phone
      setErrors({ phone: "Phone number required" });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, type }),
      });
      const data = await response.json(); // Changed res to response
      if (!response.ok) throw new Error(data.error); // Changed res to response
      setOtpSent(true);
      setErrors({});
      alert('OTP sent to WhatsApp!');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (!otp) { // Changed phoneOtp to otp to match state variable
      setErrors({ otp: "OTP required" }); // Changed phoneOtp to otp
      return;
    }
    const sanitizedPhone = phone.replace(/\s+/g, '');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, otp: otp }), // Changed phoneOtp to otp
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('Login successful!');
      window.location.href = 'https://pathanjafar-61.vercel.app/';
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loginMode === 'phone') {
      if (!otpSent) await sendPhoneOTP(phone, 'login');
      else await verifyPhoneOTP();
    } else {
      if (!otpSent) await sendOTP();
      else await verifyOTP();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.bgOrb} />
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.brand}>Pathan <span style={S.brandAccent}>Jafar</span></div>
          <div style={S.subtitle}>Secure access to your dashboard</div>
        </div>

        <div style={S.tabWrap}>
          <button
            style={loginMode === 'email' ? { ...S.tab, ...S.tabActive } : S.tab}
            onClick={() => { setLoginMode('email'); setOtpSent(false); setOtp(''); setErrors({}); }}
          >
            Email
          </button>
          <button
            style={loginMode === 'phone' ? { ...S.tab, ...S.tabActive } : S.tab}
            onClick={() => { setLoginMode('phone'); setOtpSent(false); setOtp(''); setErrors({}); }}
          >
            WhatsApp
          </button>
        </div>

        {errors.form && <p style={S.errorMsg}>{errors.form}</p>}

        {loginMode === 'phone' ? (
          <>
            <div style={S.field}>
              <label style={S.label}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocus((f) => ({ ...f, phone: true }))}
                onBlur={() => setFocus((f) => ({ ...f, phone: false }))}
                onKeyDown={handleKeyDown}
                style={useInputStyle(!!errors.phone, focus.phone)}
                disabled={otpSent}
              />
              {!otpSent && (
                <div style={S.sandboxBanner}>
                  <strong>Note:</strong> To receive WhatsApp OTPs in development, send <code>join pocket-busy</code> to <b>+1 415 523 8886</b> on WhatsApp.
                </div>
              )}
              {errors.phone && <p style={S.errorMsg}>{errors.phone}</p>}
            </div>
            {otpSent && (
              <div style={S.field}>
                <label style={S.label}>Verification Code</label>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onFocus={() => setFocus((f) => ({ ...f, otp: true }))}
                  onBlur={() => setFocus((f) => ({ ...f, otp: false }))}
                  onKeyDown={handleKeyDown}
                  style={useInputStyle(!!errors.otp, focus.otp)}
                  maxLength="6"
                />
                {errors.otp && <p style={S.errorMsg}>{errors.otp}</p>}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={S.field}>
              <label style={S.label}>Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocus((f) => ({ ...f, email: true }))}
                onBlur={() => setFocus((f) => ({ ...f, email: false }))}
                onKeyDown={handleKeyDown}
                style={useInputStyle(!!errors.email, focus.email)}
              />
              {errors.email && <p style={S.errorMsg}>{errors.email}</p>}
            </div>
            <div style={S.field}>
              <label style={S.label}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocus((f) => ({ ...f, password: true }))}
                onBlur={() => setFocus((f) => ({ ...f, password: false }))}
                onKeyDown={handleKeyDown}
                style={useInputStyle(!!errors.password, focus.password)}
              />
              {errors.password && <p style={S.errorMsg}>{errors.password}</p>}
            </div>
            {otpSent && (
              <div style={S.field}>
                <label style={S.label}>Verification Code</label>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onFocus={() => setFocus((f) => ({ ...f, otp: true }))}
                  onBlur={() => setFocus((f) => ({ ...f, otp: false }))}
                  onKeyDown={handleKeyDown}
                  style={useInputStyle(!!errors.otp, focus.otp)}
                  maxLength="6"
                />
                {errors.otp && <p style={S.errorMsg}>{errors.otp}</p>}
              </div>
            )}
            <div style={S.row}>
              <label style={S.checkWrap}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "#1D9E75" }} />
                Stay signed in
              </label>
              <button style={S.forgot} onClick={() => onForgotPassword?.()}>Forgot?</button>
            </div>
          </>
        )}

        <button
          style={loading || otpLoading ? { ...S.btn, ...S.btnLoading } : S.btn}
          onClick={handleSubmit}
          disabled={loading || otpLoading}
        >
          {otpLoading ? "Sending..." : loading ? "Verifying..." : otpSent ? "Continue" : "Sign In"}
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span>or sign in with</span>
          <div style={S.dividerLine} />
        </div>

        <div style={S.oauth}>
          <button style={S.oBtn} onClick={() => onOAuth?.("google")}>
            <div style={{ ...S.oIcon, background: "linear-gradient(135deg,#4285F4,#EA4335)", borderRadius: "50%" }} />
            Google
          </button>
          <button style={S.oBtn} onClick={() => onOAuth?.("github")}>
            <div style={{ ...S.oIcon, background: "#1877F2", borderRadius: "50%" }} />
            GitHub
          </button>
        </div>

        <div style={S.signupRow}>
          New here? <button style={S.signupLink} onClick={() => onSignUp?.()}>Create account</button>
        </div>
      </div>
    </div>
  );
}
