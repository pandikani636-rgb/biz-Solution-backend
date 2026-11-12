import nodemailer from 'nodemailer';

let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / fallback mode: log instead of crashing
    transporter = null;
  }
};




initTransporter();

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`[Email Simulator] To: ${to} | Subject: ${subject}`);
    console.log(`[Email Simulator] Preview: ${(text || html || '').slice(0, 150)}...`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SITE_NAME || 'BizZolution'}" <${process.env.SMTP_FROM || 'noreply@bizzolution.com'}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};
