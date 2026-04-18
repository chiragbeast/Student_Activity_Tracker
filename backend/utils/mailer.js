const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Real email service using SendGrid.
 * Send emails from the address/domain verified in the SendGrid dashboard.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        const fromBrand = 'Student Activity Tracker';

        if (!fromEmail) {
            console.error('--- EMAIL CONFIG ERROR: SENDGRID_FROM_EMAIL is missing ---');
            return false;
        }

        const msg = {
            to: to,
            from: {
                email: fromEmail,
                name: fromBrand
            },
            subject: subject,
            text: text,
            html: html || `<p>${text}</p>`,
        };

        await sgMail.send(msg);

        console.log('--- EMAIL SENT SUCCESSFULLY (SendGrid) ---');
        console.log(`To: ${to}, Subject: ${subject}`);
        return true;
    } catch (err) {
        console.error('--- EMAIL EXCEPTION (SendGrid) ---');
        console.error(`To: ${to}, Subject: ${subject}`);
        if (err.response) {
            console.error('Status:', err.code || err.response.statusCode);
            console.error('Body:', JSON.stringify(err.response.body, null, 2));
        } else {
            console.error('Error:', err.message);
        }
        return false;
    }
};

module.exports = { sendEmail };
