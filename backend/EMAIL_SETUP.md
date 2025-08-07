# Email Configuration Setup

This guide explains how to set up email sending for payment confirmations and invoice delivery.

## Required Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Email Configuration
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
SENDER_NAME=DocuChat
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

## Gmail Setup (Recommended)

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-factor authentication if not already enabled

### 2. Generate App Password
- Go to Google Account → Security → 2-Step Verification
- At the bottom, click "App passwords"
- Select "Mail" and "Other (Custom name)"
- Enter "DocuChat" as the name
- Copy the generated 16-character password

### 3. Configure Environment Variables
```env
SENDER_EMAIL=youremail@gmail.com
SENDER_PASSWORD=your-16-char-app-password
SENDER_NAME=DocuChat
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

## Other Email Providers

### Outlook/Hotmail
```env
SENDER_EMAIL=youremail@outlook.com
SENDER_PASSWORD=your-password
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```env
SENDER_EMAIL=youremail@yahoo.com
SENDER_PASSWORD=your-app-password
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP
```env
SENDER_EMAIL=your-email@yourdomain.com
SENDER_PASSWORD=your-password
SMTP_SERVER=mail.yourdomain.com
SMTP_PORT=587
```

## Email Templates

The system automatically sends:

### Payment Success Email
- ✅ Professional HTML template
- 📋 Subscription details (plan, amount, billing date)
- 🎯 Direct link to start using the service
- 📄 Invoice ID for reference

### Payment Failure Email
- ❌ Clear error notification
- 🔄 Instructions to retry payment
- 💡 Common reasons for payment failure
- 🆘 Support contact information

## Testing Email Setup

You can test the email configuration by:

1. Starting the backend server
2. Making a test payment
3. Checking the console logs for email sending status:
   ```
   ✅ Email sent successfully to user@example.com
   ```

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Check that 2FA is enabled (for Gmail)
- Verify you're using an app password, not your regular password
- Ensure email and password are correct

**"Connection timeout"**
- Check SMTP server and port settings
- Verify firewall settings allow SMTP connections
- Try different ports (25, 465, 587)

**"Email not received"**
- Check spam/junk folder
- Verify recipient email address
- Check email provider's sending limits

### Debug Mode

To enable detailed email logging, the system will print:
```
📧 Sending payment confirmation email...
✅ Payment confirmation email sent to user@example.com
```

Or for failures:
```
❌ Failed to send email to user@example.com: [error details]
```

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of regular passwords when possible
- Consider using a dedicated email account for application sending
- Monitor your email sending quotas and limits
- For production, consider using dedicated email services like SendGrid, Mailgun, or AWS SES

## Production Recommendations

For production environments:

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor bounce rates** and delivery statistics
4. **Use a dedicated sending domain**
5. **Implement email queue system** for high volume

Example with SendGrid:
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SENDER_EMAIL=noreply@yourdomain.com
SENDER_PASSWORD=your-sendgrid-api-key
``` 