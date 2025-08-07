import os
import uuid
from datetime import datetime
from timezone_service import timezone_service
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import logging

logger = logging.getLogger(__name__)

class InvoiceGenerator:
    def __init__(self):
        self.invoices_dir = os.path.join(os.getcwd(), "invoices")
        os.makedirs(self.invoices_dir, exist_ok=True)
        
        # Company details
        self.company_name = "DocuChat"
        self.company_address = "123 AI Street\nTech City, TC 12345\nUnited States"
        self.company_email = "billing@docuchat.com"
        self.company_phone = "+1 (555) 123-4567"
        self.company_website = "www.docuchat.com"
    
    def generate_invoice(self, 
                        user_name: str, 
                        user_email: str, 
                        plan_name: str, 
                        amount: str, 
                        currency: str = "USD",
                        stripe_subscription_id: str = None,
                        stripe_payment_intent_id: str = None,
                        subscription_start_date: datetime = None,
                        subscription_end_date: datetime = None,
                        custom_invoice_id: str = None,
                        user_timezone: str = None) -> tuple:
        """Generate PDF invoice and return (file_path, invoice_id, filename)"""
        try:
            # Use custom invoice ID if provided, otherwise generate unique one
            utc_now = timezone_service.get_utc_datetime()
            user_tz = user_timezone or 'UTC'
            
            # Generate invoice ID using user's timezone date
            user_now = timezone_service.get_user_datetime(user_tz, utc_now)
            invoice_id = custom_invoice_id or f"INV-{user_now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            invoice_date = user_now
            
            # Create PDF file path
            filename = f"invoice_{invoice_id}.pdf"
            filepath = os.path.join(self.invoices_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=0.5*inch)
            story = []
            
            # Styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#2E86AB')
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10,
                textColor=colors.HexColor('#2E86AB')
            )
            
            normal_style = styles['Normal']
            normal_style.fontSize = 10
            normal_style.spaceAfter = 6
            
            # Header
            story.append(Paragraph(f"<b>{self.company_name}</b>", title_style))
            story.append(Paragraph("INVOICE", ParagraphStyle(
                'InvoiceTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#E74C3C')
            )))
            
            # Invoice details table
            invoice_data = [
                ['Invoice ID:', invoice_id],
                ['Invoice Date:', invoice_date.strftime('%B %d, %Y')],
                ['Due Date:', 'Paid'],
                ['Status:', 'PAID']
            ]
            
            invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
            invoice_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
            ]))
            
            story.append(invoice_table)
            story.append(Spacer(1, 20))
            
            # Company and customer info
            info_data = [
                ['From:', 'Bill To:'],
                [f'{self.company_name}\n{self.company_address}\n{self.company_email}\n{self.company_phone}', 
                 f'{user_name}\n{user_email}']
            ]
            
            info_table = Table(info_data, colWidths=[3*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8F9FA')),
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 30))
            
            # Services table
            story.append(Paragraph("Services", heading_style))
            
            # Calculate tax (if applicable)
            amount_float = float(amount.replace('$', '').replace(',', ''))
            tax_rate = 0.0  # No tax for digital services in this example
            tax_amount = amount_float * tax_rate
            total_amount = amount_float + tax_amount
            
            # Convert subscription dates to user timezone
            start_date_str = "N/A"
            end_date_str = "N/A"
            
            if subscription_start_date:
                user_start = timezone_service.get_user_datetime(user_tz, subscription_start_date)
                start_date_str = user_start.strftime("%b %d, %Y")
                
            if subscription_end_date:
                user_end = timezone_service.get_user_datetime(user_tz, subscription_end_date)
                end_date_str = user_end.strftime("%b %d, %Y")
            
            services_data = [
                ['Description', 'Period', 'Amount'],
                [f'{plan_name} Subscription', 
                 f'{start_date_str} - {end_date_str}', 
                 f'${amount_float:.2f}']
            ]
            
            if tax_amount > 0:
                services_data.append(['Tax', '', f'${tax_amount:.2f}'])
            
            services_data.append(['Total', '', f'${total_amount:.2f}'])
            
            services_table = Table(services_data, colWidths=[3*inch, 2*inch, 1*inch])
            services_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8F9FA')),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8F5E8')),
            ]))
            
            story.append(services_table)
            story.append(Spacer(1, 30))
            
            # Payment details
            if stripe_subscription_id or stripe_payment_intent_id:
                story.append(Paragraph("Payment Details", heading_style))
                
                payment_data = [
                    ['Payment Method:', 'Credit Card'],
                    ['Payment Status:', 'Completed'],
                    ['Transaction Date:', invoice_date.strftime('%B %d, %Y at %I:%M %p')]
                ]
                
                if stripe_subscription_id:
                    payment_data.append(['Subscription ID:', stripe_subscription_id])
                
                if stripe_payment_intent_id:
                    payment_data.append(['Payment ID:', stripe_payment_intent_id])
                
                payment_table = Table(payment_data, colWidths=[2*inch, 3*inch])
                payment_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
                ]))
                
                story.append(payment_table)
                story.append(Spacer(1, 30))
            
            # Footer notes
            story.append(Paragraph("Notes", heading_style))
            story.append(Paragraph(
                "Thank you for your business! This invoice has been automatically generated for your subscription payment. "
                "If you have any questions about this invoice, please contact our support team.",
                normal_style
            ))
            
            story.append(Spacer(1, 20))
            story.append(Paragraph(
                f"<i>Generated on {invoice_date.strftime('%B %d, %Y at %I:%M %p')} | {self.company_website}</i>",
                ParagraphStyle(
                    'Footer',
                    parent=normal_style,
                    fontSize=8,
                    alignment=TA_CENTER,
                    textColor=colors.grey
                )
            ))
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"✅ Invoice generated successfully: {filepath}")
            return (filepath, invoice_id, filename)
            
        except Exception as e:
            logger.error(f"❌ Failed to generate invoice: {str(e)}")
            return (None, None, None)
    
    def get_invoice_data(self, user_name: str, user_email: str, plan_name: str, amount: str, **kwargs) -> dict:
        """Generate invoice data for display without creating PDF"""
        invoice_id = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        invoice_date = datetime.now()
        
        return {
            "invoice_id": invoice_id,
            "invoice_date": invoice_date.strftime('%B %d, %Y'),
            "user_name": user_name,
            "user_email": user_email,
            "plan_name": plan_name,
            "amount": amount,
            "company_name": self.company_name,
            "company_address": self.company_address.replace('\n', ', '),
            "status": "PAID",
            "payment_method": "Credit Card",
            **kwargs
        }

# Global invoice generator instance
invoice_generator = InvoiceGenerator() 