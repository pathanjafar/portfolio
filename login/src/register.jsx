import { useState } from "react";

// Minimal, attractive UI styles (matching login page)
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
    background: "radial-gradient(circle, rgba(123, 97, 255, 0.05), transparent 70%)",
    bottom: "-200px",
    left: "-100px",
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
  field: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    fontSize: "0.813rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
    marginLeft: "4px",
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
  },
  inputError: { borderColor: "#ef4444" },
  errorMsg: { fontSize: "0.75rem", color: "#ef4444", marginTop: "6px", fontWeight: 500 },
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
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
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
  loginRow: { textAlign: "center", marginTop: "2.5rem", fontSize: "0.875rem", color: "#6b7280" },
  loginLink: {
    color: "#1D9E75",
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: 0,
    marginLeft: "6px",
  },
};

function useInputStyle(hasError, isFocused) {
  return {
    ...S.input,
    ...(isFocused ? S.inputFocus : {}),
    ...(hasError ? S.inputError : {}),
  };
}

export default function RegisterPage({ onRegister, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
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
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const sendOTP = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' }),
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
      await onRegister?.({ email, password, otp, phone: phone.trim() });
      setOtpSent(false);
      setOtp("");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpSent) await sendOTP();
    else await verifyOTP();
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
          <div style={S.subtitle}>Join our community today</div>
        </div>

        {errors.form && <p style={S.errorMsg}>{errors.form}</p>}

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
            disabled={otpSent}
          />
          {errors.email && <p style={S.errorMsg}>{errors.email}</p>}
        </div>

        <div style={S.field}>
          <label style={S.label}>Phone Number (Optional)</label>
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
          <p style={{ fontSize: "0.688rem", color: "#aaa", marginTop: "4px", marginLeft: "2px" }}>
            Link WhatsApp for OTP-based login
          </p>
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
            disabled={otpSent}
          />
          {errors.password && <p style={S.errorMsg}>{errors.password}</p>}
        </div>

        <div style={S.field}>
          <label style={S.label}>Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocus((f) => ({ ...f, confirmPassword: true }))}
            onBlur={() => setFocus((f) => ({ ...f, confirmPassword: false }))}
            onKeyDown={handleKeyDown}
            style={useInputStyle(!!errors.confirmPassword, focus.confirmPassword)}
            disabled={otpSent}
          />
          {errors.confirmPassword && <p style={S.errorMsg}>{errors.confirmPassword}</p>}
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

        <button
          style={loading || otpLoading ? { ...S.btn, ...S.btnLoading } : S.btn}
          onClick={handleSubmit}
          disabled={loading || otpLoading}
        >
          {otpLoading ? "Sending..." : loading ? "Creating..." : otpSent ? "Complete Signup" : "Create Account"}
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span>or sign up with</span>
          <div style={S.dividerLine} />
        </div>

        <div style={S.oauth}>
          <button style={S.oBtn} onClick={() => alert("Google registration not implemented")}>
            <div style={{ ...S.oIcon, background: "linear-gradient(135deg,#4285F4,#EA4335)", borderRadius: "50%" }} />
            Google
          </button>
          <button style={S.oBtn} onClick={() => alert("GitHub registration not implemented")}>
            <div style={{ ...S.oIcon, background: "#1877F2", borderRadius: "50%" }} />
            GitHub
          </button>
        </div>

        <div style={S.loginRow}>
          Already member? <button style={S.loginLink} onClick={() => onLogin?.()}>Sign in</button>
        </div>
      </div>
    </div>
  );
}