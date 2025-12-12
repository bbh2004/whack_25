const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

// Create Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nikhilyadavsky2004@gmail.com',
        pass: 'tgpqcogrrohbophc'
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory OTP storage
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        console.log('📧 Sending OTP to:', email);

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        console.log('🔢 Generated OTP:', otp);

        otpStore.set(email, { otp, expiresAt });

        console.log('📤 Sending email via Gmail...');

        await transporter.sendMail({
            from: '"ISRO Mission Simulator" <nikhilyadavsky2004@gmail.com>',
            to: email,
            subject: 'Your ISRO Mission Simulator Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Mission Control Access Code</h2>
                    <p>You requested to sign in to ISRO Mission Simulator.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 8px; text-align: center; margin: 0;">
                            ${otp}
                        </h1>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                </div>
            `
        });

        console.log('✅ Email sent successfully!');
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const stored = otpStore.get(email);

        if (!stored) {
            return res.status(400).json({ error: 'No OTP found for this email' });
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP has expired' });
        }

        if (stored.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        otpStore.delete(email);
        res.json({ success: true, message: 'OTP verified successfully', email });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 OTP Server running on http://localhost:${PORT}`);
    console.log(`📧 Using Gmail SMTP`);
    console.log(`\nEndpoints:`);
    console.log(`  POST http://localhost:${PORT}/api/send-otp`);
    console.log(`  POST http://localhost:${PORT}/api/verify-otp`);
});
