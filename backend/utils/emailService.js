const nodemailer = require("nodemailer");
const User = require("../models/User");


const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // "gmail" | "outlook" | custom
  host: process.env.EMAIL_HOST || undefined, // set for custom SMTP
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  secure: process.env.EMAIL_SECURE === "true", // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail: use an App Password, not your account password
  },
});


const SEVERITY_COLORS = {
  Critical: { bg: "#dc2626", text: "#ffffff" },
  High: { bg: "#ea580c", text: "#ffffff" },
  Medium: { bg: "#ca8a04", text: "#ffffff" },
  Low: { bg: "#16a34a", text: "#ffffff" },
};


function buildAlertEmailHTML(alert, regionName) {
  const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.High;
  const detectedAt = new Date(alert.detectedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#166534;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">
              🌿 VANA-NETRA Alert System
            </h1>
            <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">
              Deforestation Monitoring Platform — Official Notification
            </p>
          </td>
        </tr>

        <!-- Severity Banner -->
        <tr>
          <td style="background:${colors.bg};padding:14px 32px;">
            <span style="color:${colors.text};font-size:16px;font-weight:bold;letter-spacing:1px;">
              ⚠️ ${alert.severity.toUpperCase()} SEVERITY ALERT DETECTED
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              A <strong>${alert.severity}</strong> deforestation event has been automatically detected
              and requires your immediate attention.
            </p>

            <!-- Details Table -->
            <table width="100%" cellpadding="10" cellspacing="0"
              style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:40%;font-weight:600;">Region</td>
                <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${regionName}</td>
              </tr>
              <tr>
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">Severity</td>
                <td style="border-bottom:1px solid #e5e7eb;">
                  <span style="background:${colors.bg};color:${colors.text};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;">
                    ${alert.severity}
                  </span>
                </td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">Forest Loss</td>
                <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${alert.lossPercentage.toFixed(2)}%</td>
              </tr>
              <tr>
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">Affected Area</td>
                <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${alert.affectedAreaHectares} hectares</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">Confidence Score</td>
                <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${alert.confidenceScore.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">Source</td>
                <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;text-transform:capitalize;">${alert.source.replace(/-/g, " ")}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;font-size:13px;font-weight:600;">Detected At</td>
                <td style="color:#111827;font-size:14px;">${detectedAt} IST</td>
              </tr>
            </table>

            <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
              Please log in to the VANA-NETRA dashboard to review this alert, assign an officer,
              and initiate the appropriate response workflow.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/alerts"
                style="background:#166534;color:#ffffff;padding:12px 32px;border-radius:6px;
                  text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">
                View Alert in Dashboard →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              This is an automated notification from VANA-NETRA. Do not reply to this email.
              <br>You are receiving this because you are a registered forestry official.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


async function sendAlertEmailToOfficials(alert, regionName) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[emailService] EMAIL_USER / EMAIL_PASS not set — skipping email.",
    );
    return;
  }

  // Fetch all active officials
  const officials = await User.find({
    role: "Official",
    isActive: true,
  }).select("email fullName");

  if (!officials.length) {
    console.log("[emailService] No active officials found.");
    return;
  }

  const recipients = officials.map((o) => o.email);
  const subject = `🚨 [VANA-NETRA] ${alert.severity} Alert — ${regionName} (${alert.lossPercentage.toFixed(1)}% forest loss)`;

  try {
    const info = await transporter.sendMail({
      from: `"VANA-NETRA Alert System" <${process.env.EMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      html: buildAlertEmailHTML(alert, regionName),
    });
    console.log(
      `[emailService] Alert email sent to ${recipients.length} official(s). MessageId: ${info.messageId}`,
    );
  } catch (err) {
    // Non-fatal — log but don't crash the analysis response
    console.error("[emailService] Failed to send alert email:", err.message);
  }
}


async function notifyOfficialsIfCritical(alert, regionName, isIllegal = false) {
  const isHighSeverity =
    alert.severity === "Critical" || alert.severity === "High";

  // Send email if: High/Critical (any zone) OR illegal deforestation (any severity)
  if (isHighSeverity || isIllegal) {
    sendAlertEmailToOfficials(alert, regionName).catch((e) =>
      console.error("[emailService] Background send error:", e.message),
    );
  }
}

module.exports = { notifyOfficialsIfCritical };
