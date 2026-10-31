import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendEmail } from './emailService.js';
import { ROLES } from '../config/constants.js';

export const createNotification = async ({ recipient, title, message, type = 'system', link = '' }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
    });

    // Fetch user email if available
    const user = await User.findById(recipient).select('email name');
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `[BizZolution] ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
            <div style="background-color: #1E3A8A; color: #ffffff; padding: 16px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">BizZolution Notification</h2>
            </div>
            <div style="border: 1px solid #E2E8F0; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello <strong>${user.name}</strong>,</p>
              <h3 style="color: #2563EB;">${title}</h3>
              <p style="font-size: 15px; line-height: 1.5;">${message}</p>
              ${
                link
                  ? `<div style="margin-top: 20px;"><a href="${link}" style="background-color: #2563EB; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a></div>`
                  : ''
              }
            </div>
          </div>
        `,
      });
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error]', error.message);
    return null;
  }
};

// Notify all administrators
export const notifyAdmins = async ({ title, message, link = '', type = 'system' }) => {
  try {
    const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id email name');
    const promises = admins.map((admin) =>
      createNotification({
        recipient: admin._id,
        title,
        message,
        type,
        link,
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('[Admin Notification Error]', error.message);
  }
};
