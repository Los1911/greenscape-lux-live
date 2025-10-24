// Global email template styling and logo
const GREENSCAPE_LOGO = "https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756530955972_72d9826f.webp";

const globalEmailStyles = {
  backgroundColor: "#000000",
  textColor: "#10b981",
  secondaryTextColor: "#64748b",
  containerBg: "#111111",
  borderColor: "#10b981"
};

function createEmailHeader(): string {
  return `
    <div style="text-align: center; margin-bottom: 40px; padding: 20px; background: ${globalEmailStyles.containerBg}; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
      <h1 style="color: ${globalEmailStyles.textColor}; font-size: 32px; margin: 0; text-shadow: 0 0 10px ${globalEmailStyles.textColor};">GreenScape Lux</h1>
      <p style="color: ${globalEmailStyles.secondaryTextColor}; margin: 10px 0 0 0; font-size: 14px;">Premium Landscaping Services</p>
    </div>
  `;
}

function createEmailFooter(): string {
  return `
    <div style="text-align: center; margin-top: 40px; padding: 20px; background: ${globalEmailStyles.containerBg}; border-radius: 8px; border-top: 1px solid ${globalEmailStyles.borderColor};">
      <p style="color: ${globalEmailStyles.secondaryTextColor}; font-size: 12px; margin: 0;">© GreenScape Lux • Charlotte NC</p>
      <p style="color: ${globalEmailStyles.secondaryTextColor}; font-size: 12px; margin: 5px 0 0 0;">This message was sent automatically by GreenScape Lux</p>
    </div>
  `;
}

export function passwordResetTemplate({ resetLink }: { resetLink: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Reset your GreenScape Lux password</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">Click the button below to set a new password for your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: ${globalEmailStyles.textColor}; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Set new password</a>
          </div>
          <hr style="border: none; border-top: 1px solid ${globalEmailStyles.borderColor}; margin: 30px 0;" />
          <p style="font-size: 14px; color: ${globalEmailStyles.secondaryTextColor}; text-align: center;">If you did not request this, you can safely ignore this message.</p>
          <p style="font-size: 14px; color: ${globalEmailStyles.secondaryTextColor}; text-align: center; margin-top: 20px;"><strong>Having trouble with the button?</strong><br/>Copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: ${globalEmailStyles.textColor}; word-break: break-all; text-align: center; background: #222222; padding: 10px; border-radius: 4px; margin: 10px 0;">${resetLink}</p>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

export function profileConfirmationTemplate({ name }: { name: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Profile Updated - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Profile Updated Successfully</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your GreenScape Lux profile has been updated successfully. All changes have been saved to your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://greenscapelux.com/client-dashboard" style="display: inline-block; background: ${globalEmailStyles.textColor}; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Dashboard</a>
          </div>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

export function jobAssignmentTemplate({ name, landscaperName, jobTitle, scheduledDate }: { 
  name: string; 
  landscaperName: string; 
  jobTitle: string; 
  scheduledDate: string; 
}): string {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Landscaper Assigned - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Landscaper Assigned to Your Job</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Great news! We've assigned a professional landscaper to your job.</p>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Job Details:</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Service: ${jobTitle}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Landscaper: ${landscaperName}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Scheduled: ${formattedDate}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your landscaper will contact you soon to confirm the appointment details.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://greenscapelux.com/client-dashboard" style="display: inline-block; background: ${globalEmailStyles.textColor}; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Job Details</a>
          </div>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

export function quoteRequestTemplate({ name, email, phone, services, propertySize, budget, message, address }: { 
  name: string; 
  email: string; 
  phone?: string; 
  services: string[]; 
  propertySize?: string; 
  budget?: string; 
  message?: string;
  address?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Quote Request - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">New Quote Request</h2>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Contact Information:</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Name: ${name}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Email: ${email}</p>
            ${phone ? `<p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Phone: ${phone}</p>` : ''}
            ${address ? `<p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Property Address: ${address}</p>` : ''}
          </div>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Services Requested:</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: ${globalEmailStyles.secondaryTextColor};">
              ${services.map(service => `<li style="margin: 5px 0;">${service}</li>`).join('')}
            </ul>
            ${propertySize ? `<p style="margin: 10px 0 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Property Size: ${propertySize}</p>` : ''}
            ${budget ? `<p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Budget: ${budget}</p>` : ''}
          </div>
          ${message ? `
            <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
              <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Additional Message:</p>
              <p style="margin: 0; color: ${globalEmailStyles.secondaryTextColor}; line-height: 1.6;">${message}</p>
            </div>
          ` : ''}
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}


export function contactFormTemplate({ name, email, phone, subject, message }: { 
  name: string; 
  email: string; 
  phone?: string; 
  subject?: string; 
  message: string; 
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">New Contact Form Submission</h2>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Contact Information:</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Name: ${name}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Email: ${email}</p>
            ${phone ? `<p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Phone: ${phone}</p>` : ''}
            ${subject ? `<p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Subject: ${subject}</p>` : ''}
          </div>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Message:</p>
            <p style="margin: 0; color: ${globalEmailStyles.secondaryTextColor}; line-height: 1.6;">${message}</p>
          </div>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

export function landscaperWelcomeTemplate({ name, email, confirmationNumber }: { name: string; email: string; confirmationNumber: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Welcome to GreenScape Lux</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Welcome to the GreenScape Lux professional network! Your application has been received.</p>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Confirmation Number:</p>
            <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: ${globalEmailStyles.textColor};">${confirmationNumber}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;"><strong>Next Steps:</strong></p>
          <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            <li>Complete your profile verification</li>
            <li>Upload required documentation</li>
            <li>Wait for admin approval</li>
            <li>Start receiving premium landscaping jobs</li>
          </ul>
          <p style="font-size: 14px; color: ${globalEmailStyles.secondaryTextColor}; margin-top: 30px;">Email: ${email}</p>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
export function jobCompletionTemplate({ name, landscaperName, jobTitle, completionDate }: { 
  name: string; 
  landscaperName: string; 
  jobTitle: string; 
  completionDate: string; 
}): string {
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Job Completed - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Job Completed Successfully</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your landscaping job has been completed successfully!</p>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Completion Details:</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Service: ${jobTitle}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Completed by: ${landscaperName}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Completed on: ${formattedDate}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">We hope you're satisfied with the work. Please consider leaving a review for ${landscaperName}.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://greenscapelux.com/client-dashboard" style="display: inline-block; background: ${globalEmailStyles.textColor}; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Leave a Review</a>
          </div>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

export function appointmentReminderTemplate({ name, landscaperName, jobTitle, appointmentDate }: { 
  name: string; 
  landscaperName: string; 
  jobTitle: string; 
  appointmentDate: string; 
}): string {
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = new Date(appointmentDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Appointment Reminder - GreenScape Lux</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${globalEmailStyles.backgroundColor}; color: ${globalEmailStyles.textColor}; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${createEmailHeader()}
        <div style="background: ${globalEmailStyles.containerBg}; padding: 40px; border-radius: 12px; border: 1px solid ${globalEmailStyles.borderColor};">
          <h2 style="color: ${globalEmailStyles.textColor}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Appointment Reminder</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">This is a friendly reminder about your upcoming landscaping appointment tomorrow.</p>
          <div style="background: #222222; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${globalEmailStyles.borderColor};">
            <p style="margin: 0 0 10px 0; color: ${globalEmailStyles.textColor}; font-weight: bold;">Appointment Details:</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Service: ${jobTitle}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Landscaper: ${landscaperName}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Date: ${formattedDate}</p>
            <p style="margin: 5px 0; color: ${globalEmailStyles.secondaryTextColor};">Time: ${formattedTime}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Please ensure someone is available at the property during the scheduled time.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://greenscapelux.com/client-dashboard" style="display: inline-block; background: ${globalEmailStyles.textColor}; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Details</a>
          </div>
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}