import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    console.log('Using custom SMTP configuration...');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    console.log('SMTP settings not found. Registering an Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Mock Ethereal account created: ${testAccount.user}`);
    } catch (error) {
      console.warn('Failed to register Ethereal account. Using local console-logging fallback.', error.message);
      transporter = {
        sendMail: async (options) => {
          console.log('\n==================================================');
          console.log('✉️  EMAIL DISPATCHED (CONSOLE LOG FALLBACK)');
          console.log(`TO:      ${options.to}`);
          console.log(`SUBJECT: ${options.subject}`);
          console.log('CONTENT:');
          console.log(options.text || options.html);
          console.log('==================================================\n');
          return { messageId: 'console-fallback-id-' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: `"Customer Service Team" <noreply@customer-service.com>`,
      to,
      subject,
      text: text || subject,
      html,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`Email successfully sent. ID: ${info.messageId}`);
    
    // Log Ethereal preview link if applicable
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`👉 View Sent Email Preview: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Failed to dispatch email notification:', error.message);
  }
};
