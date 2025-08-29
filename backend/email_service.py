import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL")
        self.sender_password = os.getenv("SENDER_PASSWORD")
        self.sender_name = os.getenv("SENDER_NAME", "DocuChat")
        
        if not self.sender_email or not self.sender_password:
            logger.warning("⚠️ Email credentials not configured. Email sending will be disabled.")
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None, attachment_path: str = None):
        """Send email with optional attachment"""
        try:
            if not self.sender_email or not self.sender_password:
                logger.error("❌ Email credentials not configured")
                return False
            
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.sender_name} <{self.sender_email}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Add attachment if provided
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(attachment_path)}'
                    )
                    message.attach(part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_payment_success_email(self, user_email: str, user_name: str, plan_name: str, amount: str, invoice_id: str, subscription_end_date: str, invoice_download_url: str = None, invoice_pdf_path: str = None, user_timezone: str = None):
        """Send payment success confirmation email"""
        subject = f"Payment Confirmation - {plan_name} Plan Activated"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
                .success-badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
                .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    
                    <p>Welcome to {{ plan_name }} Plan</p>
                </div>
                <div class="content">
                    
                    <div class="details">
                        <h3>Subscription Details</h3>
                        <p><strong>Plan:</strong> {{ plan_name }}</p>
                        <p><strong>Amount:</strong> {{ amount }}</p>
                        <p><strong>Invoice ID:</strong> {{ invoice_id }}</p>
                        <p><strong>Next Billing Date:</strong> {{ subscription_end_date }}{{ timezone_display }}</p>
                    </div>
                    
                    {% if invoice_download_url %}
                    <div class="details" style="background: #e8f5e8; border: 2px solid #28a745;">
                        <h3 style="color: #28a745;">Your Invoice</h3>
                        <p>Click the button below to download your PDF invoice:</p>
                        <a href="{{ invoice_download_url }}" class="button" style="background: #28a745; color: white;">Download Invoice PDF</a>
                        <p style="font-size: 12px; color: #666; margin-top: 10px;">
                            <strong>Note:</strong> This link is valid for 30 days from the purchase date.
                        </p>
                    </div>
                    {% endif %}
                    
                    <p>You can now enjoy:</p>
                    <ul>
                        <li>Enhanced document analysis</li>
                        <li>Advanced AI chat features</li>
                        <li>Premium insights and reports</li>
                        <li>Priority support</li>
                    </ul>
                    
                    <a href="https://your-domain.com/assistant" class="button">Start Using DocuChat →</a>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                    
                    <p>Best regards,<br>The DocuChat Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© 2025 DocuChat. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Add timezone display info
        timezone_display = f" ({user_timezone})" if user_timezone and user_timezone != 'UTC' else ""
        
        template = Template(html_template)
        html_content = template.render(
            user_name=user_name,
            plan_name=plan_name,
            amount=amount,
            invoice_id=invoice_id,
            subscription_end_date=subscription_end_date,
            timezone_display=timezone_display,
            invoice_download_url=invoice_download_url
        )
        
        text_content = f"""
        Payment Confirmation - {plan_name} Plan Activated
        
        Hi {user_name},
        
        Thank you for subscribing to DocuChat! Your payment has been processed successfully.
        
        Subscription Details:
        - Plan: {plan_name}
        - Amount: {amount}
        - Invoice ID: {invoice_id}
        - Next Billing Date: {subscription_end_date}
        
        {f'Download your invoice: {invoice_download_url}' if invoice_download_url else ''}
        
        Your {plan_name} plan is now active and ready to use.
        
        Best regards,
        The DocuChat Team
        """
        
        # Attach PDF invoice if provided
        return self.send_email(user_email, subject, html_content, text_content, invoice_pdf_path)
    
    def send_payment_failure_email(self, user_email: str, user_name: str, plan_name: str, amount: str, error_message: str = None):
        """Send payment failure notification email"""
        subject = f"Payment Failed - {plan_name} Plan Subscription"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
                .error-badge { background: #dc3545; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
                .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Failed</h1>
                    <p>Subscription to {{ plan_name }} Plan</p>
                </div>
                <div class="content">
                    <div class="error-badge">Payment Not Processed</div>
                    
                    <p>Hi {{ user_name }},</p>
                    
                    <p>We were unable to process your payment for the {{ plan_name }} plan subscription.</p>
                    
                    <div class="details">
                        <h3>Attempted Transaction</h3>
                        <p><strong>Plan:</strong> {{ plan_name }}</p>
                        <p><strong>Amount:</strong> {{ amount }}</p>
                        {% if error_message %}
                        <p><strong>Error:</strong> {{ error_message }}</p>
                        {% endif %}
                    </div>
                    
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Your account remains on the free plan</li>
                        <li>No charges have been made to your payment method</li>
                        <li>You can try again with a different payment method</li>
                    </ul>
                    
                    <p><strong>Common reasons for payment failure:</strong></p>
                    <ul>
                        <li>Insufficient funds</li>
                        <li>Expired or invalid card details</li>
                        <li>Bank security restrictions</li>
                        <li>Card limit exceeded</li>
                    </ul>
                    
                    <a href="https://your-domain.com/upgrade" class="button">Try Again →</a>
                    
                    <p>If you continue to experience issues, please contact our support team for assistance.</p>
                    
                    <p>Best regards,<br>The DocuChat Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© 2025 DocuChat. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(
            user_name=user_name,
            plan_name=plan_name,
            amount=amount,
            error_message=error_message
        )
        
        text_content = f"""
        Payment Failed - {plan_name} Plan Subscription
        
        Hi {user_name},
        
        We were unable to process your payment for the {plan_name} plan subscription.
        
        Attempted Transaction:
        - Plan: {plan_name}
        - Amount: {amount}
        {f"- Error: {error_message}" if error_message else ""}
        
        Your account remains on the free plan and no charges have been made.
        You can try again with a different payment method.
        
        If you need assistance, please contact our support team.
        
        Best regards,
        The DocuChat Team
        """
        
        return self.send_email(user_email, subject, html_content, text_content)

# Global email service instance
email_service = EmailService() 