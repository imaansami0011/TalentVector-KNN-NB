
import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime, timezone
from email.utils import make_msgid
import httpx
import resend

load_dotenv()


def dispatch_resend_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str,
    body_html: str,
    body_text: str
) -> bool:
    """
    Synchronous function to trigger the Resend API.
    Remember: While on the free tier, candidate_email MUST be your verified testing email!
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key or api_key.startswith("re_your"):
        print("Resend API Key is not configured or is the default placeholder. Skipping Resend dispatch.")
        return False
        
    resend.api_key = api_key
    
    # We will use the onboarding email from Resend for the free tier, or custom sender if configured.
    # Note: On the free tier, "from" address is restricted to "onboarding@resend.dev".
    # And "to" must be a verified recipient (which is typically the owner's email).
    sender_email = os.getenv("RESEND_SENDER_EMAIL") or "Talent Vector HR <onboarding@resend.dev>"
    
    params = {
        "from": sender_email,
        "to": [candidate_email],
        "subject": f"Interview Invitation: {job_title} at {company_name}",
        "html": body_html,
        "text": body_text
    }
    
    try:
        print(f"Attempting to dispatch email to {candidate_email} via Resend API...")
        email = resend.Emails.send(params)
        resend_id = email.get("id") if isinstance(email, dict) else getattr(email, "id", str(email))
        print(f"Successfully dispatched email to {candidate_email} | Resend ID: {resend_id}")
        return True
    except Exception as e:
        print(f"CRITICAL: Failed to dispatch email via Resend. Error: {e}")
        return False


def send_candidate_invite_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_details: dict,
    recruiter_name: str,
    recruiter_role: str
) -> bool:
    """
    Sends an automated, branded interview invitation email to the candidate's email,
    populated with the recruiter's Company Profile details. Uses a premium HTML layout
    and standard deliverability headers to avoid spam placement.
    """
    company_name = company_details.get("company_name", "Our Company")
    website = company_details.get("website", "")
    hq = company_details.get("hq_location", "")
    address = company_details.get("address", "")
    location = hq or address or ""
    
    # Plain text version for fallback/text parts
    body_text = (
        f"Dear {candidate_name},\n\n"
        f"We are excited to invite you for an interview for the {job_title} position at {company_name}.\n\n"
        f"Position: {job_title}\n"
        f"Company: {company_name}\n"
    )
    if website:
        body_text += f"Website: {website}\n"
    if location:
        body_text += f"Location: {location}\n"
        
    body_text += (
        f"\nOur team was highly impressed by your qualifications and experience. "
        f"{recruiter_name} ({recruiter_role}) from our talent acquisition team will be in touch shortly "
        f"to coordinate the next steps.\n\n"
        f"Best regards,\n"
        f"{recruiter_name}\n"
        f"{recruiter_role}\n"
        f"{company_name}"
    )

    # Branded, premium HTML version to satisfy anti-spam checks and improve readability
    portal_url = website if website else "https://talentvector.com/portal"
    location_row = f'<div class="job-detail"><strong>Location:</strong> {location}</div>' if location else ''
    website_row = f'<div class="job-detail"><strong>Website:</strong> <a href="{website}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">{website}</a></div>' if website else ''
    
    body_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f3f4f6;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }}
  .wrapper {{
    background-color: #f3f4f6;
    padding: 40px 20px;
  }}
  .container {{
    max-width: 580px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }}
  .header {{
    background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
    padding: 40px 32px;
    text-align: center;
    color: #ffffff;
  }}
  .header-badge {{
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: inline-block;
    margin-bottom: 16px;
    color: #e0e7ff;
  }}
  .header h1 {{
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }}
  .header p {{
    margin: 8px 0 0 0;
    font-size: 14px;
    color: #c7d2fe;
    font-weight: 500;
  }}
  .content {{
    padding: 40px 32px;
    color: #374151;
    line-height: 1.6;
    font-size: 15px;
  }}
  .greeting {{
    font-weight: 700;
    font-size: 18px;
    color: #111827;
    margin-bottom: 16px;
  }}
  .intro-text {{
    font-size: 15px;
    color: #4b5563;
    margin-bottom: 24px;
  }}
  .job-card {{
    background-color: #f9fafb;
    border-left: 4px solid #4f46e5;
    border-top: 1px solid #f3f4f6;
    border-right: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    border-radius: 0 12px 12px 0;
    padding: 24px;
    margin: 28px 0;
  }}
  .job-title-row {{
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }}
  .job-detail {{
    font-size: 14px;
    color: #4b5563;
    margin: 8px 0;
  }}
  .job-detail strong {{
    color: #1f2937;
    width: 90px;
    display: inline-block;
  }}
  .cta-section {{
    text-align: center;
    margin: 32px 0;
  }}
  .cta-button {{
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #ffffff !important;
    padding: 14px 28px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    border-radius: 10px;
    display: inline-block;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
    letter-spacing: 0.01em;
  }}
  .signature {{
    margin-top: 36px;
    border-top: 1px solid #f3f4f6;
    padding-top: 24px;
    font-size: 14px;
    color: #4b5563;
  }}
  .signature-name {{
    font-weight: 700;
    color: #111827;
  }}
  .signature-role {{
    color: #6b7280;
    font-size: 13px;
  }}
  .footer {{
    background-color: #f9fafb;
    padding: 28px 32px;
    text-align: center;
    font-size: 11px;
    color: #9ca3af;
    border-top: 1px solid #f3f4f6;
    line-height: 1.6;
  }}
  .footer a {{
    color: #6b7280;
    text-decoration: underline;
  }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <div class="header-badge">Talent Vector HR</div>
      <h1>Interview Invitation</h1>
      <p>Exclusive Opportunity Match</p>
    </div>
    <div class="content">
      <div class="greeting">Dear {candidate_name},</div>
      <p class="intro-text">After reviewing your background and profile in our automated talent vetting system, we were highly impressed by your experience. We would like to officially invite you for an interview for the following position:</p>
      
      <div class="job-card">
        <div class="job-title-row">{job_title}</div>
        <div class="job-detail"><strong>Company:</strong> {company_name}</div>
        {location_row}
        {website_row}
      </div>

      <p class="intro-text">We believe your skills align exceptionally well with our team's vision. Please click the button below to coordinate a brief introductory call later this week:</p>

      <div class="cta-section">
        <a href="{portal_url}" class="cta-button">Select Interview Time Slot</a>
      </div>
      
      <div class="signature">
        <div class="signature-name">{recruiter_name}</div>
        <div class="signature-role">{recruiter_role}</div>
        <div style="font-weight: 600; color: #4f46e5; margin-top: 4px;">{company_name}</div>
      </div>
    </div>
    <div class="footer">
      This email was sent on behalf of {company_name} via the Talent Vector Automated HR System.<br>
      You received this because your professional profile matched our current sourcing criteria. If you wish to opt-out, please <a href="#">unsubscribe</a>.
    </div>
  </div>
</div>
</body>
</html>
"""

    # 1. Resend API Dispatch (High Priority)
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key and not resend_api_key.startswith("re_your"):
        resend_sent = dispatch_resend_email(
            candidate_email=candidate_email,
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name,
            body_html=body_html,
            body_text=body_text
        )
        if resend_sent:
            return True
        print("Resend dispatch failed or skipped. Falling back to alternative methods...")



    # 3. Standard SMTP / Simulation Fallback (Low Priority)
    sender_email = os.getenv("SENDER_EMAIL")
    sender_pass = os.getenv("SENDER_PASSWORD")
    
    # Print email content for visibility in console
    print("\n" + "="*60)
    print("SENDING BRANDED CANDIDATE INTERVIEW INVITATION EMAIL:")
    print(f"To: {candidate_email}")
    print(f"From: {sender_email or 'mock_smtp@talentvector.com'}")
    print(f"Subject: Interview Invitation: {job_title} at {company_name}")
    print(body_text)
    print("="*60 + "\n")

    if not sender_email or not sender_pass:
        print("SMTP Credentials not configured. Invitation email simulated successfully.")
        return True

    try:
        msg = EmailMessage()
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype='html')
        
        # Configure deliverability headers to prevent spam classification
        msg['Subject'] = f"Interview Invitation: {job_title} at {company_name}"
        msg['From'] = f"{recruiter_name} via Talent Vector <{sender_email}>"
        msg['To'] = candidate_email
        msg['Message-ID'] = make_msgid(domain=sender_email.split('@')[-1])
        msg['Date'] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S %z")
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_pass)
            server.send_message(msg)
        print(f"Branded invitation email sent successfully to {candidate_email}")
        return True
    except Exception as e:
        print(f"Error sending branded invite email: {e}")
        return False




