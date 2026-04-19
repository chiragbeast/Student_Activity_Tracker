const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Real email service using SendGrid.
 * Send emails from the address/domain verified in the SendGrid dashboard.
 */
const sendEmail = async ({ to, subject, text, html, fromName, replyTo }) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        const fromBrand = fromName ? `${fromName} via SAPT` : 'Student Activity Tracker';

        if (!fromEmail) {
            console.error('--- EMAIL CONFIG ERROR: SENDGRID_FROM_EMAIL is missing ---');
            return { success: false, message: 'Server email configuration error' };
        }

        const msg = {
            to: to,
            from: {
                email: fromEmail,
                name: fromBrand
            },
            replyTo: replyTo || fromEmail,
            subject: subject,
            text: text,
            html: html || `<p>${text}</p>`,
        };

        await sgMail.send(msg);

        console.log('--- EMAIL SENT SUCCESSFULLY (SendGrid) ---');
        console.log(`To: ${to}, From: ${fromBrand}, Subject: ${subject}`);
        return { success: true };
    } catch (err) {
        console.error('--- EMAIL EXCEPTION (SendGrid) ---');
        let errorMsg = err.message;

        if (err.response && err.response.body && err.response.body.errors) {
            errorMsg = err.response.body.errors[0].message;
            console.error('SendGrid Error Body:', JSON.stringify(err.response.body, null, 2));
        }

        return { success: false, message: errorMsg };
    }
};

module.exports = { sendEmail };
