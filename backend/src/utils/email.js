const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!process.env.SMTP_USER) { console.warn('SMTP not configured'); return; }
  await getTransporter().sendMail({
    from: `"VMS System" <${process.env.SMTP_USER}>`,
    to, subject, html, attachments
  });
};

const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#4f46e5;padding:24px;text-align:center">
        <h2 style="color:#fff;margin:0">Visitor Management System</h2>
      </div>
      <div style="padding:32px;text-align:center">
        <p style="color:#374151;font-size:16px">Your verification code is:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:16px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#4f46e5">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">If you did not request this, please ignore this email.</p>
      </div>
    </div>`;
  await sendEmail(email, 'Your VMS Verification Code', html);
};

const sendGatePassEmail = async (email, visitData, pdfPath) => {
  const { visitor_name, badge_number, host_name, department, purpose, check_in } = visitData;
  const checkInTime = new Date(check_in).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#4f46e5;padding:24px;text-align:center">
        <h2 style="color:#fff;margin:0">✅ Gate Pass Issued</h2>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:16px">Dear <strong>${visitor_name}</strong>,</p>
        <p style="color:#6b7280">Your gate pass has been generated. Please find it attached to this email.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          ${[
            ['Badge Number', badge_number],
            ['Host', `${host_name} (${department})`],
            ['Purpose', purpose],
            ['Check-in Time', checkInTime],
          ].map(([label, value]) => `
            <tr>
              <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:bold;color:#374151;width:40%">${label}</td>
              <td style="padding:10px;border:1px solid #e5e7eb;color:#4b5563">${value}</td>
            </tr>`).join('')}
        </table>
        <p style="color:#6b7280;font-size:13px">Please show this email or the attached PDF at the exit gate during check-out.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">Visitor Management System</p>
      </div>
    </div>`;

  const attachments = pdfPath ? [{ filename: `gatepass_${badge_number}.pdf`, path: pdfPath }] : [];
  await sendEmail(email, `Gate Pass - ${visitor_name} | ${badge_number}`, html, attachments);
};

const notifyHost = async (hostEmail, visitorName, purpose) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#4f46e5">New Visitor Arrival</h2>
      <p><strong>${visitorName}</strong> has arrived to meet you.</p>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <p>Please proceed to the reception area.</p>
    </div>`;
  await sendEmail(hostEmail, 'New Visitor Arrival', html);
};

module.exports = { sendEmail, sendOTPEmail, sendGatePassEmail, notifyHost };
