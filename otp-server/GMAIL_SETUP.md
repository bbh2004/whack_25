# Nodemailer Gmail Setup Guide

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

## Step 2: Create App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Type "ISRO OTP"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

## Step 3: Update server.js

Open `otp-server/server.js` and replace line 13:

```javascript
pass: 'YOUR_GMAIL_APP_PASSWORD' // Replace with your 16-char app password
```

With:

```javascript
pass: 'abcd efgh ijkl mnop' // Your actual app password (remove spaces)
```

## Step 4: Install & Run

```bash
cd otp-server
npm install
npm start
```

That's it! Now you can send OTP to ANY email address! 🚀
