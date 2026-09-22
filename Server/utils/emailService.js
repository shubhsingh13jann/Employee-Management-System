import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Configure Nodemailer Transporter with Gmail SMTP
 * If EMAIL_USER and EMAIL_PASS are configured, real emails will be delivered.
 * Otherwise, the service gracefully falls back to Dev Console simulation.
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass || user.includes("your_email") || pass.includes("your_password")) {
    return null; // Dev fallback mode
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });
};

/**
 * Base email dispatch helper with console fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const senderEmail = process.env.EMAIL_USER?.trim() || "security@ems-portal.com";
  const appName = "Enterprise EMS";

  if (!transporter) {
    console.log(`\n========================================================`);
    console.log(`📧 [EMS DEV EMAIL SIMULATOR]`);
    console.log(`📤 TO:      ${to}`);
    console.log(`📋 SUBJECT: ${subject}`);
    console.log(`--------------------------------------------------------`);
    console.log(text || html.replace(/<[^>]*>?/gm, " "));
    console.log(`========================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${appName} Security" <${senderEmail}>`,
      to,
      subject,
      text: text || subject,
      html
    });

    console.log(`[EmailService] Dispatched email to ${to} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId, simulated: false };
  } catch (error) {
    console.error(`[EmailService Error] Failed to deliver email to ${to}:`, error.message);
    // Even if remote delivery fails, provide the console output so user is never locked out
    console.log(`[EmailService Fallback] Simulated content for ${to}:\n`, text);
    return { success: false, error: error.message, simulated: true };
  }
};

/**
 * Modern Responsive Enterprise Email Wrapper Template
 */
const getBrandedEmailWrapper = ({ title, preheader, bodyContent, alertColor = "#6366f1" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #131d33; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Laser Top Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, ${alertColor}, #38bdf8);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 30px 35px 20px 35px; border-bottom: 1px solid #1e293b;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${alertColor}; box-shadow: 0 0 10px ${alertColor};"></span>
                      <span style="font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">ENTERPRISE EMS</span>
                    </div>
                    <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">${title}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 35px; line-height: 1.6; font-size: 15px; color: #cbd5e1;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 35px; background-color: #0d1526; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 8px 0;">This is an automated security transmission from your organization's Enterprise EMS portal.</p>
              <p style="margin: 0;">If you did not initiate this activity, please contact your security administrator immediately.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Send 2FA Verification OTP Email
 */
export const send2FAEmail = async (toEmail, userName, otpCode) => {
  const title = "Two-Step Verification Code";
  const preheader = `Your EMS security code is ${otpCode}. Valid for 10 minutes.`;
  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>A login request to your <strong>Enterprise EMS</strong> account was just initiated. Please use the single-use verification code below to authorize this session:</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <div style="display: inline-block; padding: 16px 36px; background: rgba(99, 102, 241, 0.12); border: 1.5px dashed #6366f1; border-radius: 12px;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace;">${otpCode}</span>
      </div>
      <div style="margin-top: 10px; font-size: 13px; color: #94a3b8;">
        ⏱️ This code will expire in <strong>10 minutes</strong>.
      </div>
    </div>

    <p style="font-size: 13.5px; color: #94a3b8; margin-bottom: 0;">
      Never share this code with anyone. EMS staff will never ask for your verification code.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔐 Your EMS Login Verification Code: ${otpCode}`,
    text: `Your Enterprise EMS 2FA Login Code is: ${otpCode}. Valid for 10 minutes.`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#6366f1" })
  });
};

/**
 * 2. Send Successful Login Notification Email
 */
export const sendLoginSuccessEmail = async (toEmail, userName, meta = {}) => {
  const title = "New Successful Sign-In";
  const timeStr = new Date().toUTCString();
  const preheader = `New sign-in detected on your account at ${timeStr}.`;
  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>Your account was successfully signed into. Here are the session details for your reference:</p>

    <table width="100%" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 15px; margin: 20px 0; font-size: 13.5px;">
      <tr>
        <td style="padding: 4px 8px; color: #94a3b8; width: 120px;"><strong>Timestamp:</strong></td>
        <td style="padding: 4px 8px; color: #f1f5f9;">${timeStr}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; color: #94a3b8;"><strong>IP Address:</strong></td>
        <td style="padding: 4px 8px; color: #f1f5f9;">${meta.ip || "127.0.0.1"}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; color: #94a3b8;"><strong>Browser / Client:</strong></td>
        <td style="padding: 4px 8px; color: #f1f5f9;">${meta.userAgent || "Web Browser"}</td>
      </tr>
    </table>

    <p style="font-size: 13.5px; color: #94a3b8; margin-bottom: 0;">
      If this was you, no action is required. If you did not sign in at this time, please reset your password immediately and contact IT support.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `✅ Security Notice: Successful Login to Enterprise EMS`,
    text: `New successful login to Enterprise EMS on ${timeStr} from IP ${meta.ip || "127.0.0.1"}.`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#10b981" })
  });
};

/**
 * 3. Send Failed Password Security Warning Email
 */
export const sendSecurityAlertEmail = async (toEmail, userName, meta = {}) => {
  const title = "⚠️ Security Alert: Multiple Failed Login Attempts";
  const timeStr = new Date().toUTCString();
  const preheader = `Warning: ${meta.attempts || 3} failed password attempts detected on your account.`;
  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>Our security system detected <strong>${meta.attempts || 3} consecutive incorrect password attempts</strong> on your Enterprise EMS account.</p>

    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #f87171; margin-bottom: 6px;">
        Suspicious Authentication Activity
      </div>
      <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
        • Time: <strong>${timeStr}</strong><br>
        • Origin IP: <strong>${meta.ip || "127.0.0.1"}</strong><br>
        • Client: <strong>${meta.userAgent || "Web Browser"}</strong>
      </div>
    </div>

    <p style="font-size: 14px; color: #f1f5f9;">
      If you forgot your password, you can safely reset it using the <strong>Forgot Password</strong> option on the login portal.
    </p>
    <p style="font-size: 13px; color: #ef4444; margin-bottom: 0;">
      If you did not make these attempts, someone may be trying to access your account. Please notify your IT administrator.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `⚠️ Urgent Security Alert: Multiple Failed Sign-In Attempts on EMS`,
    text: `Warning: Multiple failed password attempts detected on your Enterprise EMS account at ${timeStr}.`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#ef4444" })
  });
};

/**
 * 4. Send Account Lockout Notification Email
 */
export const sendAccountLockoutEmail = async (toEmail, userName, meta = {}) => {
  const title = "🔒 Account Temporarily Locked: Excessive Failed Attempts";
  const timeStr = new Date().toUTCString();
  const preheader = "Your Enterprise EMS account has been temporarily locked for 10 minutes.";
  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>For your security, your Enterprise EMS account has been <strong>temporarily locked for 10 minutes</strong> due to 5 consecutive incorrect password attempts.</p>

    <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #f87171; margin-bottom: 6px;">
        🛡️ Account Lockout Protection Triggered
      </div>
      <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        • Lockout Duration: <strong>10 minutes</strong><br>
        • Trigger Time: <strong>${timeStr}</strong><br>
        • Origin IP: <strong>${meta.ip || "127.0.0.1"}</strong><br>
        • Client: <strong>${meta.userAgent || "Web Browser"}</strong>
      </div>
    </div>

    <p style="font-size: 14px; color: #f1f5f9;">
      During this lockout window, login attempts are blocked. You may wait for the countdown timer on the sign-in portal to expire, or click below to reset your password immediately:
    </p>

    <div style="margin: 24px 0; text-align: center;">
      <a href="${meta.resetUrl || (process.env.CLIENT_URL || 'http://localhost:5173') + '/reset-password'}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
        Reset Password Now
      </a>
    </div>

    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
      If you did not initiate these login attempts, your account credentials may be compromised. Please contact your system administrator immediately.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔒 Urgent: Your Enterprise EMS Account Has Been Temporarily Locked`,
    text: `Security Notice: Your Enterprise EMS account has been locked for 10 minutes due to 5 consecutive failed login attempts at ${timeStr}.`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#ef4444" })
  });
};

/**
 * 4. Send Password Reset Link Email
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const title = "Reset Your Account Password";
  const preheader = "A password recovery request has been received for your EMS account.";
  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>We received a request to reset the password associated with your <strong>Enterprise EMS</strong> account. Click the button below to choose a new password:</p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 34px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        Reset Password
      </a>
      <div style="margin-top: 14px; font-size: 12.5px; color: #94a3b8;">
        ⏱️ This recovery link is valid for <strong>30 minutes</strong> and can only be used once.
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      If the button above does not work, copy and paste this link into your browser:
      <br>
      <span style="color: #818cf8; word-break: break-all; font-size: 12px;">${resetUrl}</span>
    </p>

    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔑 Reset Your Enterprise EMS Password`,
    text: `Reset your Enterprise EMS password by visiting: ${resetUrl} (Link valid for 30 minutes).`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#6366f1" })
  });
};

