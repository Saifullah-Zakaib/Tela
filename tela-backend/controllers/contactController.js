import sendEmail from '../utils/sendEmail.js';

// @desc    Submit contact sales form
// @route   POST /api/contact/sales
// @access  Public
export const submitContactSales = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      company,
      phone,
      teamSize,
      message,
      interestedIn
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const fullName = `${firstName} ${lastName}`;

    // Send email to sales team (using the main verified email)
    const salesEmailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Sales Inquiry</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0; font-size: 16px;">Contact form submission from Tela</p>
        </div>

        <div style="background: white; padding: 40px 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; margin: 0 0 24px; font-size: 20px; font-weight: 600;">Contact Information</h2>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Name:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Email:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;"><a href="mailto:${email}" style="color: #10B981; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Company:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${company}</td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Phone:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${phone}</td>
              </tr>
              ` : ''}
              ${teamSize ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Team Size:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${teamSize}</td>
              </tr>
              ` : ''}
              ${interestedIn ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Interested In:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${interestedIn}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${message ? `
          <div style="margin-bottom: 24px;">
            <h3 style="color: #111827; margin: 0 0 12px; font-size: 16px; font-weight: 600;">Message</h3>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981;">
              <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          ` : ''}

          <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; margin: 0; font-size: 13px; font-weight: 600;">⚡ Quick Action Required</p>
            <p style="color: #92400E; margin: 8px 0 0; font-size: 13px; line-height: 1.5;">Please respond to this inquiry within 24 hours for best conversion rates.</p>
          </div>
        </div>

        <div style="text-align: center; padding: 24px; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from Tela sales form</p>
          <p style="margin: 8px 0 0;">Reply directly to this email to contact the prospect</p>
        </div>
      </div>
    `;

    // Send notification to sales team
    await sendEmail({
      email: process.env.SENDGRID_FROM_EMAIL, // Send to the verified email (sales team)
      subject: 'New Sales Inquiry - Tela',
      html: salesEmailContent,
      replyTo: email, // Reply-to the prospect's email
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: 'Tela Sales'
    });

    // Send confirmation email to the prospect
    const confirmationEmailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Thank You for Reaching Out!</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0; font-size: 16px;">We've received your inquiry</p>
        </div>

        <div style="background: white; padding: 40px 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
            Hi ${firstName},
          </p>
          
          <p style="color: #374151; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
            Thank you for your interest in Tela's Custom plan! We're excited to learn more about ${company} and how we can support your team.
          </p>

          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; border-left: 4px solid #10B981; margin: 24px 0;">
            <p style="color: #065F46; margin: 0; font-size: 14px; font-weight: 600;">✓ What happens next?</p>
            <ul style="color: #065F46; margin: 12px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              <li>Our sales team will review your inquiry</li>
              <li>You'll receive a response within 24 hours</li>
              <li>We'll schedule a personalized demo based on your needs</li>
              <li>Together, we'll create a custom plan for your team</li>
            </ul>
          </div>

          <p style="color: #374151; margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            In the meantime, feel free to explore our <a href="http://localhost:8080" style="color: #10B981; text-decoration: none; font-weight: 600;">free 14-day trial</a> to get a feel for the platform.
          </p>

          <p style="color: #374151; margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Best regards,<br/>
            <strong style="color: #111827;">The Tela Team</strong>
          </p>
        </div>

        <div style="text-align: center; padding: 24px; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0;">Questions? Reply to this email or reach us at ${process.env.SENDER_EMAIL}</p>
        </div>
      </div>
    `;

    // Send confirmation to prospect
    await sendEmail({
      email: email,
      subject: 'Thanks for contacting Tela - We\'ll be in touch soon!',
      html: confirmationEmailContent,
      replyTo: process.env.SENDGRID_FROM_EMAIL,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: 'Tela Team'
    });

    res.status(200).json({
      success: true,
      message: 'Thank you! We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit your inquiry. Please try again or email us directly.'
    });
  }
};
