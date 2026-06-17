import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const message = {
    from: `Tela <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(message);
};

export const emailTemplates = {
  verification: (name, token) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Thanks for signing up! Please verify your email by clicking the button below:</p>
      <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
         style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Verify Email
      </a>
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
  `,
  
  clientInvite: (name, token) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">You've Been Invited to Tela</h2>
      <p>Hi ${name},</p>
      <p>You've been invited to collaborate on Tela. Click the button below to set your password and get started:</p>
      <a href="${process.env.CLIENT_URL}/set-password/${token}" 
         style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Set Password
      </a>
    </div>
  `,
  
  resetPassword: (name, token) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <a href="${process.env.CLIENT_URL}/reset-password/${token}" 
         style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>
      <p>This link expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `,
  
  invoiceSent: (clientName, invoiceNumber, total, invoiceId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">New Invoice: ${invoiceNumber}</h2>
      <p>Hi ${clientName},</p>
      <p>You have received a new invoice.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
      </div>
      <a href="${process.env.CLIENT_URL}/invoices/${invoiceId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Pay Now
      </a>
    </div>
  `,
  
  invoiceOverdue: (clientName, invoiceNumber, total) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #EF4444;">Invoice Overdue Reminder</h2>
      <p>Hi ${clientName},</p>
      <p>This is a reminder that invoice ${invoiceNumber} for $${total.toFixed(2)} is now overdue.</p>
      <p>Please process the payment at your earliest convenience.</p>
    </div>
  `,
  
  milestoneApproved: (freelancerName, milestoneName, projectName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Milestone Approved!</h2>
      <p>Hi ${freelancerName},</p>
      <p>Great news! The milestone "${milestoneName}" in project "${projectName}" has been approved by your client.</p>
    </div>
  `,
  
  proposalAccepted: (freelancerName, proposalTitle) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Proposal Accepted!</h2>
      <p>Hi ${freelancerName},</p>
      <p>Congratulations! Your proposal "${proposalTitle}" has been accepted by the client.</p>
    </div>
  `
};

export default sendEmail;
