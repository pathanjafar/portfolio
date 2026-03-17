import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global override OTP (allows access without sending/validating stored OTP)
const GLOBAL_OTP = '6666';

// PostgreSQL connection
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "password",
  database: "newdata"
});

// Twilio WhatsApp client
let twilioClient = null;
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('Twilio WhatsApp client initialized.');
}

// Email configuration
// If USE_EMAIL is "true" and EMAIL_USER/PASS are provided, use real SMTP (Gmail, etc.).
// Otherwise, fall back to Ethereal test inbox.
let transporter = null;
const useEmail = process.env.USE_EMAIL === 'true';

async function initEmail() {
  if (useEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log(`Real email transport initialized for ${process.env.EMAIL_USER}`);
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'keara.blanda6@ethereal.email',
        pass: 'gbbUYtTaDU2AXjcT6m',
      },
    });
    console.log("TEST EMAIL INITIALIZED WITH ETHEREAL. OTPs will not go to your real Gmail.");
  }
}

initEmail();

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Create users table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE
  )
`).catch(err => console.error('Error creating table:', err));

// Ensure the table has the columns we expect (in case it was created earlier with a different schema)
pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
`).catch(err => console.error('Error updating users table schema:', err));

// Add phone column for WhatsApp login
pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE DEFAULT NULL;
`).catch(err => console.error('Error adding phone column:', err));


// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: 'your-app@domain.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It will expire in 5 minutes.</p>`,
  };

  console.log(`🔐 OTP GENERATED FOR ${email}: ${otp} (expires in 5 minutes)`);

  if (!transporter) {
    return Promise.resolve();
  }

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent to Ethereal inbox successfully!');
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
    return result;
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    // Do not fail the OTP flow; proceed without email delivery.
    return Promise.resolve();
  }
}

// Send OTP via WhatsApp using Twilio Verify
async function sendWhatsAppOTP(phone) {
  // Final sanitization
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

  console.log(`📡 Twilio Verify (WhatsApp) -> To: ${cleanPhone}`);

  if (!twilioClient || !VERIFY_SERVICE_SID) {
    console.warn('⚠️ Twilio Verify not configured properly.');
    throw new Error('Twilio Verify not configured');
  }

  try {
    const verification = await twilioClient.verify.v2.services(VERIFY_SERVICE_SID)
      .verifications.create({ to: cleanPhone, channel: 'whatsapp' });
    
    console.log(`📡 Twilio Verify API Response:`);
    console.log(`   - SID: ${verification.sid}`);
    console.log(`   - Status: ${verification.status}`);
    console.log(`   - Channel: ${verification.channel} (Requested: whatsapp)`);
    
    if (verification.sendCodeAttempts && verification.sendCodeAttempts.length > 0) {
      console.log(`   - Latest Attempt:`, JSON.stringify(verification.sendCodeAttempts[verification.sendCodeAttempts.length - 1], null, 2));
    }

    if (verification.channel !== 'whatsapp') {
      console.warn(`⚠️ Warning: Verify API is using channel '${verification.channel}' instead of WhatsApp. Verify your service configuration.`);
    }
    
    return verification;
  } catch (err) {
    console.error(`❌ Twilio Verify Error: ${err.message}`);
    if (err.code === 63007) {
      throw new Error(`WhatsApp Sandbox not joined. Please join first.`);
    }
    throw err;
  }
}

// Send WhatsApp OTP endpoint
app.post('/api/send-whatsapp-otp', async (req, res) => {
  try {
    let { phone, type } = req.body; // type: 'register' or 'login'
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Sanitize phone number: remove everything except digits and +
    phone = phone.replace(/[^\d+]/g, '');

    if (type === 'login') {
      // We allow sending OTP even for new numbers to support auto-registration
      // But we can check and log for debugging
      const userExists = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (userExists.rows.length === 0) {
        console.log(`📱 New phone number detected for login/auto-reg: ${phone}`);
      }
    }

    if (type === 'register') {
      const userExists = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    // For WhatsApp delivery, Twilio Verify handles OTP generation and expiry.
    await sendWhatsAppOTP(phone);

    res.json({ message: 'OTP sent to your WhatsApp via Twilio Verify' });
  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp OTP' });
  }
});

// Verify WhatsApp OTP endpoint
app.post('/api/verify-whatsapp-otp', async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    phone = phone.replace(/[^\d+]/g, '');

    if (otp === GLOBAL_OTP) {
      return res.json({ message: 'OTP verified (global override)' });
    }

    const check = await twilioClient.verify.v2.services(VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code: otp });

    if (check.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('WhatsApp Verify Check error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'register' or 'login'

    // Check if user exists for login
    if (type === 'login') {
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    // Check if user already exists for register
    if (type === 'register') {
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expiresAt, type });

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    const storedOTP = otpStore.get(email);
      // Allow global override OTP
    if (otp === GLOBAL_OTP) {
      return res.json({ message: 'OTP verified successfully (global override)' });
    }

    if (!storedOTP || storedOTP.type !== type) {
      return res.status(400).json({ error: 'Invalid OTP request' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified, remove from store
    otpStore.delete(email);

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Register endpoint (now requires OTP verification)
app.post('/api/register', async (req, res) => {
  try {
    let { email, password, otp, phone } = req.body;
    if (phone) phone = phone.replace(/\s+/g, '');

    // First verify OTP
    const storedOTP = otpStore.get(email);
    // Allow global override OTP
    if (otp !== GLOBAL_OTP) {
      if (!storedOTP || storedOTP.type !== 'register') {
        return res.status(400).json({ error: 'Please send OTP first' });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
      }

      if (storedOTP.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user (with optional phone)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, email_verified, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, phone',
      [email, passwordHash, true, phone || null]
    );

    // Remove OTP
    otpStore.delete(email);

    // Generate JWT
    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint (now requires OTP verification)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // First verify OTP
    const storedOTP = otpStore.get(email);
    // Allow global override OTP
    if (otp !== GLOBAL_OTP) {
      if (!storedOTP || storedOTP.type !== 'login') {
        return res.status(400).json({ error: 'Please send OTP first' });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
      }

      if (storedOTP.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // Remove OTP after successful verification
      otpStore.delete(email);
    }
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove OTP
    otpStore.delete(email);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Phone login endpoint (OTP already verified, just look up user and issue JWT)
app.post('/api/phone-login', async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Sanitize phone number
    phone = phone.replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) phone = '+' + phone;
    
    // Verify OTP first
    if (otp !== GLOBAL_OTP) {
      if (!twilioClient || !VERIFY_SERVICE_SID) {
        return res.status(500).json({ error: 'Twilio Verify not configured' });
      }
      const check = await twilioClient.verify.v2.services(VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: otp });

      if (check.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    }

    // Find user by phone
    let result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    // Auto-registration: Create user if not found
    if (result.rows.length === 0) {
      console.log(`📱 Auto-registering new phone number: ${phone}`);
      const phoneEmail = `phone_${phone.replace(/\+/g, '').replace(/\s/g, '')}@phone.local`;
      const insert = await pool.query(
        'INSERT INTO users (email, password_hash, email_verified, phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [phoneEmail, 'phone_login_no_password', true, phone]
      );
      result = insert;
    }

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, phone: user.phone } });
  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Phone register endpoint (create account via phone + WhatsApp OTP)
app.post('/api/phone-register', async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    phone = phone.replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) phone = '+' + phone;

    // Verify OTP
    if (otp !== GLOBAL_OTP) {
      if (!twilioClient || !VERIFY_SERVICE_SID) {
        return res.status(500).json({ error: 'Twilio Verify not configured' });
      }
      const check = await twilioClient.verify.v2.services(VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: otp });

      if (check.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    }

    // Create phone-only user (no password needed)
    const phoneEmail = `phone_${phone.replace(/\+/g, '')}@phone.local`;
    const insert = await pool.query(
      'INSERT INTO users (email, password_hash, email_verified, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, phone',
      [phoneEmail, 'phone-only-user', true, phone]
    );

    const user = insert.rows[0];
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, phone: user.phone } });
  } catch (error) {
    console.error('Phone register error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profile = await googleRes.json();
    
    if (!profile.email) {
      return res.status(400).json({ error: 'Failed to get Google profile' });
    }

    // Upsert user
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.email]);
    let user;
    if (result.rows.length === 0) {
      // Create user
      const insert = await pool.query(
        'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, $3) RETURNING id, email',
        [profile.email, 'oauth-user', true]
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({ token: jwtToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

// GitHub OAuth endpoint
app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;
    // Without a Client Secret, we cannot exchange the code for a token automatically with GitHub's backend.
    // Setting up a mock valid response since we only have the client ID.
    console.log(`Received GitHub code: ${code}. Mocking login since no client secret is available.`);
    
    const mockEmail = `github-user-${code.substring(0, 5)}@github.mock`;
    
    // Upsert mock user
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [mockEmail]);
    let user;
    if (result.rows.length === 0) {
      const insert = await pool.query(
        'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, $3) RETURNING id, email',
        [mockEmail, 'oauth-user', true]
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({ token: jwtToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('GitHub Auth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});