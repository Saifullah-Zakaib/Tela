import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { getClientUrl } from '../config/clientUrl.js';

/**
 * Production-ready email service with SendGrid support
 * SendGrid allows sending from any email address after domain verification
 */

// Initialize SendGrid with API key check
const initializeSendGrid = () => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✓ SendGrid initialized with key:', process.env.SENDGRID_API_KEY.substring(0, 15) + '...');
    return true;
  }
  return false;
};

// Initialize on module load
let sendGridInitialized = initializeSendGrid();

// Create transporter based on EMAIL_SERVICE
const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE || 'smtp';

  // Check if nodemailer is properly imported
  if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    throw new Error('Nodemailer not properly configured');
  }

  switch (service.toLowerCase()) {
    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });

    case 'ses':
      return nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: 587,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY,
          pass: process.env.AWS_SES_SECRET_KEY
        }
      });

    case 'mailgun':
      return nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });

    case 'smtp':
    default:
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
  }
};

// Initialize transporter
let transporter;
try {
  transporter = createTransporter();
} catch (error) {
  console.error('Failed to create email transporter:', error.message);
}

/**
 * Send email using SendGrid (allows sending from any verified domain)
 * This is the main function used throughout the app
 */
const sendEmail = async (options, retries = 3) => {
  // Check if SendGrid is configured
  if (process.env.SENDGRID_API_KEY) {
    return sendWithSendGrid(options, retries);
  }
  
  // Fallback to SMTP if SendGrid not configured
  if (transporter) {
    return sendWithSMTP(options, retries);
  }
  
  throw new Error('No email service configured. Please set up SendGrid or SMTP.');
};

/**
 * Send email via SendGrid
 */
const sendWithSendGrid = async (options, retries = 3) => {
  // Re-initialize if not done yet (safety check)
  if (!sendGridInitialized) {
    sendGridInitialized = initializeSendGrid();
    if (!sendGridInitialized) {
      throw new Error('SendGrid API key not configured');
    }
  }

  const fromName = options.fromName || 'Tela';
  const fromEmail = options.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';

  const message = {
    to: options.email,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
    replyTo: options.replyTo || fromEmail
  };

  console.log('📧 SendGrid Message:', {
    to: message.to,
    from: message.from,
    subject: message.subject,
    apiKeySet: !!process.env.SENDGRID_API_KEY,
    apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 15)
  });

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sgMail.send(message);
      console.log(`✓ Email sent via SendGrid from ${fromEmail} to ${options.email}`);
      return { success: true };
    } catch (error) {
      lastError = error;
      console.error(`✗ SendGrid attempt ${attempt}/${retries} failed:`, error.message);
      if (error.response) {
        console.error('   Response body:', JSON.stringify(error.response.body, null, 2));
      }
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to send email via SendGrid after ${retries} attempts: ${lastError.message}`);
};

/**
 * Send email via SMTP (fallback)
 */
const sendWithSMTP = async (options, retries = 3) => {
  const fromName = options.fromName || process.env.EMAIL_FROM_NAME || 'Tela';
  const fromAddress = options.fromEmail || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

  const message = {
    from: `${fromName} <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    replyTo: options.fromEmail ? `${fromName} <${fromAddress}>` : undefined,
    text: options.text || options.html.replace(/<[^>]*>/g, '')
  };

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(message);
      console.log(`✓ Email sent via SMTP from ${fromAddress} to ${options.email} (ID: ${info.messageId})`);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`✗ SMTP attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to send email via SMTP after ${retries} attempts: ${lastError.message}`);
};

/**
 * Send email using freelancer's personal SMTP configuration
 * This allows each freelancer to send emails from their own email account
 */
export const sendEmailFromUser = async (userEmailConfig, options, retries = 3) => {
  if (!userEmailConfig || !userEmailConfig.isConfigured) {
    throw new Error('User email configuration not set up. Please configure your email settings.');
  }

  // Create a transporter using the user's SMTP settings
  const userTransporter = nodemailer.createTransport({
    host: userEmailConfig.smtpHost,
    port: userEmailConfig.smtpPort,
    secure: userEmailConfig.smtpPort === 465,
    auth: {
      user: userEmailConfig.smtpUser,
      pass: userEmailConfig.smtpPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${options.fromName} <${userEmailConfig.smtpUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    replyTo: `${options.fromName} <${userEmailConfig.smtpUser}>`,
    text: options.text || options.html.replace(/<[^>]*>/g, '')
  };

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await userTransporter.sendMail(message);
      console.log(`✓ Email sent from ${userEmailConfig.smtpUser} to ${options.email} (ID: ${info.messageId})`);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`✗ Email attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to send email after ${retries} attempts: ${lastError.message}`);
};
/**
 * Verify email configuration on server start
 */
export const verifyEmailConfig = async () => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('✓ SendGrid email service ready');
    console.log('ℹ Emails will be sent from freelancer email addresses');
    return true;
  }
  
  if (!transporter) {
    console.log('ℹ No email service configured');
    console.log('ℹ Set SENDGRID_API_KEY in .env to enable email sending');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✓ SMTP email service configured successfully');
    return true;
  } catch (error) {
    console.log('ℹ Email service not fully configured');
    console.log('ℹ Set SENDGRID_API_KEY in .env for production email sending');
    return false;
  }
};

/**
 * Email templates
 */
export const emailTemplates = {
  // Client invite from freelancer (personalized)
  clientInviteFromFreelancer: (clientName, inviteUrl, freelancerName) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Tela</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Client Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #111827; margin: 0 0 16px;">${freelancerName} invited you to collaborate!</h2>
              <p style="color: #6B7280; margin: 0 0 24px;">Hi ${clientName},</p>
              <p style="color: #6B7280; margin: 0 0 24px;">${freelancerName} has invited you to collaborate on Tela's client portal.</p>
              <ul style="color: #6B7280; margin: 0 0 32px;">
                <li>View project progress in real-time</li>
                <li>Communicate directly with ${freelancerName}</li>
                <li>Access files and documents</li>
                <li>Review and approve milestones</li>
              </ul>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #10B981;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">Set Password & Access Portal</a>
                  </td>
                </tr>
              </table>
              <p style="color: #9CA3AF; margin: 32px 0 0; font-size: 14px;">Reply to this email to contact ${freelancerName} directly.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 30px; text-align: center;">
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">Sent by ${freelancerName} via Tela</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },

  // Generic client invite
  clientInvite: (clientName, inviteUrl) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>You're Invited to Tela</h2>
  <p>Hi ${clientName},</p>
  <p>You've been invited to the Tela client portal.</p>
  <p><a href="${inviteUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Set Password</a></p>
</body>
</html>
    `;
  },

  // Email verification
  verification: (name, token) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Verify Your Email</h2>
  <p>Hi ${name},</p>
  <p>Please verify your email by clicking the button below:</p>
  <p><a href="${getClientUrl()}/verify-email/${token}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
</body>
</html>
    `;
  },

  // Password reset
  resetPassword: (name, token) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Reset Your Password</h2>
  <p>Hi ${name},</p>
  <p>Click the button below to reset your password:</p>
  <p><a href="${getClientUrl()}/reset-password/${token}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
  <p style="color: #9CA3AF; font-size: 12px;">This link expires in 10 minutes.</p>
</body>
</html>
    `;
  },

  // Invoice sent
  invoiceSent: (clientName, invoiceNumber, total) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>New Invoice: ${invoiceNumber}</h2>
  <p>Hi ${clientName},</p>
  <p>You have received a new invoice for $${total.toFixed(2)}.</p>
  <p><a href="${getClientUrl()}/portal" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Invoice</a></p>
</body>
</html>
    `;
  },

  // Invoice overdue
  invoiceOverdue: (clientName, invoiceNumber, total) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Invoice Overdue</h2>
  <p>Hi ${clientName},</p>
  <p>Invoice ${invoiceNumber} for $${total.toFixed(2)} is now overdue.</p>
</body>
</html>
    `;
  },

  // Milestone ready for client review
  milestoneReview: (clientName, milestoneName, projectName, projectId) => {
    const reviewUrl = `${getClientUrl()}/portal/projects/${projectId}`;
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Milestone ready for review</h2>
  <p>Hi ${clientName},</p>
  <p>"${milestoneName}" on project "${projectName}" is ready for your review.</p>
  <p><a href="${reviewUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Review &amp; Approve</a></p>
</body>
</html>
    `;
  },

  // Milestone approved
  milestoneApproved: (freelancerName, milestoneName, projectName) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Milestone Approved!</h2>
  <p>Hi ${freelancerName},</p>
  <p>The milestone "${milestoneName}" in project "${projectName}" has been approved.</p>
</body>
</html>
    `;
  },

  // Client requested milestone revisions
  milestoneRevision: (freelancerName, milestoneName, projectName, feedback, projectId) => {
    const projectUrl = `${getClientUrl()}/projects/${projectId}`;
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Revision Requested</h2>
  <p>Hi ${freelancerName},</p>
  <p>Your client has requested changes on "${milestoneName}" in project "${projectName}".</p>
  <p style="background: #f3f4f6; padding: 12px; border-radius: 6px;">${feedback.replace(/\n/g, '<br>')}</p>
  <p><a href="${projectUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a></p>
</body>
</html>
    `;
  },

  // Proposal accepted
  proposalAccepted: (freelancerName, proposalTitle) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Proposal Accepted!</h2>
  <p>Hi ${freelancerName},</p>
  <p>Your proposal "${proposalTitle}" has been accepted.</p>
</body>
</html>
    `;
  }
};

export default sendEmail;
