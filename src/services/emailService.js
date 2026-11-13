import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

let transporter = null;

const initTransporter = () => {
  const user = process.env.SMTP_USER || 'balumuniandassociates@gmail.com';
  const pass = process.env.SMTP_PASS || 'qexeqgvgnsrlghrt';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  if (user && pass) {
    const isGmail = host.includes('gmail') || user.includes('gmail');
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        }
      : {
          host,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        };

    transporter = nodemailer.createTransport(transportConfig);
  } else {
    transporter = null;
  }
};

initTransporter();

// Helper to get logo attachment if available on disk
const getLogoAttachment = () => {
  try {
    const logoPath = path.resolve(process.cwd(), 'public', 'bm-logo.png');
    if (fs.existsSync(logoPath)) {
      return [
        {
          filename: 'bm-logo.png',
          path: logoPath,
          cid: 'bmlogo', // Referenced as cid:bmlogo in HTML
        },
      ];
    }
  } catch (err) {
    console.warn('[Email Logo Warning]', err.message);
  }
  return [];
};

/**
 * Send generic email
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!transporter) {
    initTransporter();
  }

  const siteName = process.env.SITE_NAME || 'Balumuni and Associates';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'balumuniandassociates@gmail.com';

  if (!transporter) {
    console.log(`[Email Simulator] To: ${to} | Subject: ${subject}`);
    console.log(`[Email Simulator] Preview: ${(text || html || '').slice(0, 150)}...`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
      attachments,
    });
    console.log(`[Email Delivery] Email successfully sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Delivery Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Automated Welcome Email sent upon user registration
 */
export const sendWelcomeEmail = async ({ userEmail, userName }) => {
  const siteName = process.env.SITE_NAME || 'Balumuni and Associates';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://biz-solutionfrontend.vercel.app').replace(/\/+$/, '');
  const catalogUrl = `${frontendUrl}/services`;
  const logoAttachments = getLogoAttachment();

  const logoImgSrc = logoAttachments.length > 0
    ? 'cid:bmlogo'
    : 'https://biz-solutionfrontend.vercel.app/bm-logo.png';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b192c 0%, #1e3a8a 100%); padding: 32px 36px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 14px;">
                    <div style="background-color: #ffffff; display: inline-block; padding: 8px 14px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                      <img src="${logoImgSrc}" alt="${siteName} Logo" width="140" style="display: block; max-height: 48px; width: auto; object-contain;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #f8fafc; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      ${siteName}
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #fbbf24; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                      Industrial Power Transmission &amp; Bearings Solutions Partner
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                Welcome, ${userName || 'Valued Partner'}! 👋
              </h2>
              
              <p style="margin: 0 0 18px 0; color: #334155; font-size: 15px; line-height: 1.6;">
                Thank you for registering an account with <strong>${siteName}</strong>. Your profile has been successfully activated on our wholesale platform.
              </p>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                As an authorized industrial distributor and stockist, we provide factory-direct supply of genuine <strong>industrial V-belts, precision deep groove &amp; angular contact bearings, taper lock pulleys, and transmission drives</strong> from leading manufacturers including PIX, NBC, HCH, Fenner, Timken, and SKF.
              </p>

              <!-- Value Prop Cards -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top" style="font-size: 20px; line-height: 1;">⚡</td>
                        <td style="padding-left: 8px;">
                          <strong style="color: #0f172a; font-size: 14px;">B2B Wholesale Discount Schedule</strong>
                          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.4;">
                            45% - 48% discount on standard list MRP across PIX, NBC, HCH, Fenner &amp; Timken; flat 10% on genuine SKF stock.
                          </p>
                        </td>
                      </tr>
                      <tr><td height="12"></td></tr>
                      <tr>
                        <td width="36" valign="top" style="font-size: 20px; line-height: 1;">🛡️</td>
                        <td style="padding-left: 8px;">
                          <strong style="color: #0f172a; font-size: 14px;">100% Genuine MTC Certified</strong>
                          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.4;">
                            Factory authentic components with full serial traceability and Mill Test Certificates (MTC).
                          </p>
                        </td>
                      </tr>
                      <tr><td height="12"></td></tr>
                      <tr>
                        <td width="36" valign="top" style="font-size: 20px; line-height: 1;">🚚</td>
                        <td style="padding-left: 8px;">
                          <strong style="color: #0f172a; font-size: 14px;">Tracked Nationwide Dispatch</strong>
                          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.4;">
                            Fast, insured logistics with B2B GST input credit invoices (18% Statutory GST).
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${catalogUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.35);">
                      Explore Product Catalog &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Registration Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 12px; color: #475569;">
                <tr>
                  <td><strong>Registered Account:</strong> ${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding-top: 4px;"><strong>Account Status:</strong> Active Verified Customer</td>
                </tr>
              </table>

              <!-- Support Desk -->
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Need custom project quotations, container pricing, or technical belt sizing? Reply directly to this email or reach our sales engineering desk:
              </p>
              <p style="margin: 8px 0 0 0; color: #1e293b; font-size: 13px; font-weight: 700;">
                📞 Phone: +91-74184 23238 / +91 98426 70320<br>
                ✉️ Email: <a href="mailto:balumuniandassociates@gmail.com" style="color: #2563eb; text-decoration: none;">balumuniandassociates@gmail.com</a><br>
                📍 45B/16 Noorullah Mall, Srivilliputtur, Virudhunagar Dist, Tamil Nadu - 626125
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.<br>
                You are receiving this automated email because you registered on ${siteName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Welcome to ${siteName} - Your Account is Active`,
    html,
    text: `Hello ${userName},\n\nWelcome to ${siteName}! Your account has been registered successfully.\nYou can browse our verified industrial catalog at ${catalogUrl}.\n\nContact Desk: balumuniandassociates@gmail.com | +91-74184 23238`,
    attachments: logoAttachments,
  });
};

/**
 * Automated New Order Notification sent to the admin email
 */
export const sendNewOrderNotificationEmail = async ({ order, customer, service, pkg }) => {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'balumuniandassociates@gmail.com';
  const siteName = process.env.SITE_NAME || 'Balumuni and Associates';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://biz-solutionfrontend.vercel.app').replace(/\/+$/, '');
  const adminOrderUrl = `${frontendUrl}/admin/bookings/${order._id || ''}`;
  const logoAttachments = getLogoAttachment();

  const logoImgSrc = logoAttachments.length > 0
    ? 'cid:bmlogo'
    : 'https://biz-solutionfrontend.vercel.app/bm-logo.png';

  const productName = service?.name || order.serviceSnapshot?.name || 'Industrial Product';
  const partNumber = service?.partNumber || order.serviceSnapshot?.slug || 'Standard Part';
  const brand = service?.brand || 'Industrial Component';
  const pkgName = pkg?.name || order.packageSnapshot?.name || 'Standard Package';
  const totalAmount = Number(order.totalAmount || 0).toLocaleString('en-IN');
  const baseAmount = Number(order.baseAmount || 0).toLocaleString('en-IN');
  const taxAmount = Number(order.taxAmount || 0).toLocaleString('en-IN');
  const discountAmount = Number(order.coupon?.discountAmount || 0).toLocaleString('en-IN');

  const customerName = customer?.name || 'Customer';
  const customerEmail = customer?.email || 'N/A';
  const customerPhone = customer?.phone || 'N/A';

  // Format Dynamic Form / Delivery Specifications
  const dynamicFields = order.dynamicFormData || {};
  const dynamicRows = Object.entries(dynamicFields)
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}:</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600;">${String(val)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert - ${order.bookingNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b192c 0%, #1e3a8a 100%); padding: 28px 36px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <div style="background-color: #ffffff; display: inline-block; padding: 6px 12px; border-radius: 10px;">
                      <img src="${logoImgSrc}" alt="${siteName}" width="120" style="display: block; max-height: 42px; width: auto;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="background-color: #f59e0b; color: #0f172a; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 8px;">
                      NEW ORDER NOTIFICATION
                    </span>
                    <h1 style="margin: 0; color: #f8fafc; font-size: 22px; font-weight: 800;">
                      Order #${order.bookingNumber} Received
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hello Admin,<br><br>
                A customer has placed a new product order on <strong>${siteName}</strong>. Please review the order specifications and initiate dispatch procedures.
              </p>

              <!-- Order Overview Highlight -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Product / Component:</td>
                        <td align="right" style="color: #0f172a; font-size: 14px; font-weight: 800;">${productName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; padding-top: 8px;">Part Number:</td>
                        <td align="right" style="color: #2563eb; font-size: 13px; font-weight: 800; font-family: monospace; padding-top: 8px;">${partNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; padding-top: 8px;">Make / Brand:</td>
                        <td align="right" style="color: #0f172a; font-size: 13px; font-weight: 700; padding-top: 8px;">${brand}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; padding-top: 8px;">Package Tier:</td>
                        <td align="right" style="color: #0f172a; font-size: 13px; font-weight: 700; padding-top: 8px;">${pkgName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; padding-top: 8px;">Payment Status:</td>
                        <td align="right" style="padding-top: 8px;">
                          <span style="background-color: ${order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${order.paymentStatus === 'paid' ? '#166534' : '#92400e'}; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 6px;">
                            ${order.paymentStatus?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer & Delivery Information -->
              <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                Customer &amp; Dispatch Information
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 8px 12px; background-color: #f8fafc; color: #64748b; font-size: 13px; width: 35%; border-bottom: 1px solid #e2e8f0;">Customer Name:</td>
                  <td style="padding: 8px 12px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background-color: #f8fafc; color: #64748b; font-size: 13px; border-bottom: 1px solid #e2e8f0;">Customer Email:</td>
                  <td style="padding: 8px 12px; color: #2563eb; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background-color: #f8fafc; color: #64748b; font-size: 13px; border-bottom: 1px solid #e2e8f0;">Customer Phone:</td>
                  <td style="padding: 8px 12px; color: #0f172a; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${customerPhone}</td>
                </tr>
                ${dynamicRows}
              </table>

              <!-- Financial Summary -->
              <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                Financial Summary
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px; overflow: hidden; background-color: #ffffff;">
                <tr>
                  <td style="padding: 10px 14px; color: #475569; font-size: 13px; border-bottom: 1px solid #f1f5f9;">Subtotal / Net Rate:</td>
                  <td align="right" style="padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">₹${baseAmount}</td>
                </tr>
                ${
                  Number(order.coupon?.discountAmount || 0) > 0
                    ? `<tr>
                        <td style="padding: 8px 14px; color: #16a34a; font-size: 13px; border-bottom: 1px solid #f1f5f9;">Coupon Discount (${order.coupon?.code || 'COUPON'}):</td>
                        <td align="right" style="padding: 8px 14px; color: #16a34a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">- ₹${discountAmount}</td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 8px 14px; color: #475569; font-size: 13px; border-bottom: 1px solid #f1f5f9;">Statutory 18% GST:</td>
                  <td align="right" style="padding: 8px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">₹${taxAmount}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 14px; color: #0f172a; font-size: 15px; font-weight: 900;">Grand Total:</td>
                  <td align="right" style="padding: 12px 14px; color: #1e3a8a; font-size: 18px; font-weight: 900;">₹${totalAmount}</td>
                </tr>
              </table>

              <!-- CTA to Admin Panel -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${adminOrderUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 10px rgba(15,23,42,0.25);">
                      Manage Order in Admin Panel &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 36px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${siteName} Automated Commerce Alert System.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🔔 [New Order Placed] #${order.bookingNumber} - ${productName} (₹${totalAmount})`,
    html,
    text: `New order #${order.bookingNumber} placed for ${productName} (${partNumber}) by ${customerName} (${customerEmail}, ${customerPhone}). Total Amount: ₹${totalAmount}. View order at ${adminOrderUrl}`,
    attachments: logoAttachments,
  });
};
