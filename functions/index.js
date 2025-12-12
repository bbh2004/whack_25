const { onRequest } = require("firebase-functions/v2/https");
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

// Initialize Resend with API key
const resend = new Resend("re_EV3q35a1_M4nUw7mTauED4N9Beq8A3AxN");

/**
 * Generate a 6-digit OTP code
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email
 * Callable function from frontend
 */
exports.sendOTP = onCall(async (request) => {
    const { email } = request.data;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address");
    }

    try {
        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP in Firestore
        await admin.firestore().collection("otps").doc(email).set({
            otp,
            expiresAt,
            createdAt: Date.now(),
            verified: false,
        });

        // Send email via Resend
        await resend.emails.send({
            from: "onboarding@resend.dev", // Replace with your verified domain
            to: email,
            subject: "Your ISRO Mission Simulator Verification Code",
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
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
        });

        return { success: true, message: "OTP sent to email" };
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
    }
});

/**
 * Verify OTP
 * Callable function from frontend
 */
exports.verifyOTP = onCall(async (request) => {
    const { email, otp } = request.data;

    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }

    try {
        // Get OTP from Firestore
        const otpDoc = await admin.firestore().collection("otps").doc(email).get();

        if (!otpDoc.exists) {
            throw new Error("No OTP found for this email");
        }

        const otpData = otpDoc.data();

        // Check if already verified
        if (otpData.verified) {
            throw new Error("OTP already used");
        }

        // Check if expired
        if (Date.now() > otpData.expiresAt) {
            throw new Error("OTP has expired");
        }

        // Check if OTP matches
        if (otpData.otp !== otp) {
            throw new Error("Invalid OTP");
        }

        // Mark as verified
        await admin.firestore().collection("otps").doc(email).update({
            verified: true,
        });

        // Create custom token for authentication
        const customToken = await admin.auth().createCustomToken(email.replace(/[^a-zA-Z0-9]/g, "_"));

        return {
            success: true,
            message: "OTP verified successfully",
            customToken,
            email,
        };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw new Error(error.message || "Failed to verify OTP");
    }
});
