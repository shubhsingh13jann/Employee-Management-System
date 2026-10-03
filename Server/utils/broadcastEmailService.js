import { sendEmail } from "./emailService.js";

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
 * Send Broadcast Announcement Email
 */
export const sendBroadcastEmail = async (toEmail, userName, { subject, message, priority = "standard", senderName = "Enterprise Administration" }) => {
  const alertColors = {
    standard: "#6366f1",
    important: "#f59e0b",
    urgent: "#ef4444"
  };
  const priorityBadges = {
    standard: "Standard Circular",
    important: "Important Notification",
    urgent: "Urgent Operational Directive"
  };
  const alertColor = alertColors[priority] || "#6366f1";
  const badgeText = priorityBadges[priority] || "Announcement";

  const title = subject || "Enterprise Personnel Broadcast";
  const preheader = `[${badgeText}] ${message.slice(0, 120)}...`;
  const formattedBody = message.replace(/\n/g, "<br>");
  const timeStr = new Date().toUTCString();

  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <div style="display: inline-block; padding: 4px 14px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); border: 1px solid ${alertColor}; color: ${alertColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
      ${badgeText}
    </div>
    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid #1e293b; border-radius: 12px; padding: 22px; margin: 12px 0 24px 0; color: #f1f5f9; font-size: 14.5px; line-height: 1.7;">
      ${formattedBody}
    </div>
    <table width="100%" style="font-size: 12.5px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 14px; margin-top: 14px;">
      <tr>
        <td><strong>Dispatched by:</strong> ${senderName}</td>
        <td style="text-align: right;"><strong>Timestamp:</strong> ${timeStr}</td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: toEmail,
    subject: `📢 [${badgeText}] ${subject}`,
    text: `[${badgeText}] ${subject}\n\n${message}\n\nDispatched by ${senderName} at ${timeStr}.`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor })
  });
};

/**
 * Send 1-Click Temporary Credential Notification Email
 */
export const sendCredentialResetEmail = async (toEmail, userName, tempPassword) => {
  const title = "Your Temporary Login Credentials";
  const preheader = "Your administrator has assigned temporary credentials for your EMS account.";
  const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

  const bodyContent = `
    <p style="margin-top: 0;">Hello <strong>${userName || "Team Member"}</strong>,</p>
    <p>Your system administrator has reset your password for the <strong>Enterprise EMS Portal</strong>. Please use your temporary password below to sign in:</p>

    <div style="margin: 28px 0; text-align: center;">
      <div style="display: inline-block; padding: 16px 36px; background: rgba(245, 158, 11, 0.12); border: 1.5px dashed #f59e0b; border-radius: 12px;">
        <span style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #fbbf24; font-family: monospace;">${tempPassword}</span>
      </div>
    </div>

    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #fbbf24; margin-bottom: 4px;">
        ⚠️ Mandatory Password Update Required
      </div>
      <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.5;">
        For your security and organizational compliance, you will be required to choose a new permanent password immediately upon logging in with this temporary password.
      </div>
    </div>

    <div style="margin: 28px 0; text-align: center;">
      <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        Sign In to EMS Portal
      </a>
    </div>

    <p style="font-size: 12.5px; color: #64748b; margin-bottom: 0;">
      If you did not expect a password reset, please contact your IT administrator immediately.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔑 Temporary EMS Credentials for ${userName}`,
    text: `Hello ${userName},\n\nYour temporary password for Enterprise EMS is: ${tempPassword}\n\nPlease sign in at ${loginUrl}. You will be prompted to change this password immediately.\n`,
    html: getBrandedEmailWrapper({ title, preheader, bodyContent, alertColor: "#f59e0b" })
  });
};
