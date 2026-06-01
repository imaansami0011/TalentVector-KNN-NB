
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
    location_row = f'<div class="job-detail"><strong>Location:</strong> {location}</div>' if location else ''
    website_row = f'<div class="job-detail"><strong>Website:</strong> <a href="{website}" style="color: #4f46e5; text-decoration: none;">{website}</a></div>' if website else ''
    
    body_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }}
  .wrapper {{
    background-color: #f8fafc;
    padding: 40px 20px;
  }}
  .container {{
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }}
  .header {{
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    padding: 32px;
    text-align: center;
    color: #ffffff;
  }}
  .header h1 {{
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.025em;
    text-transform: uppercase;
  }}
  .header p {{
    margin: 8px 0 0 0;
    font-size: 13px;
    color: #e0e7ff;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }}
  .content {{
    padding: 32px;
    color: #334155;
    line-height: 1.6;
    font-size: 15px;
  }}
  .greeting {{
    font-weight: 700;
    font-size: 16px;
    color: #1e293b;
    margin-bottom: 16px;
  }}
  .job-card {{
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }}
  .job-title-row {{
    font-size: 16px;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: -0.01em;
  }}
  .job-detail {{
    font-size: 13px;
    color: #475569;
    margin: 6px 0;
  }}
  .job-detail strong {{
    color: #334155;
    width: 90px;
    display: inline-block;
  }}
  .signature {{
    margin-top: 32px;
    border-top: 1px solid #f1f5f9;
    padding-top: 24px;
    font-size: 14px;
    color: #475569;
  }}
  .signature-name {{
    font-weight: 700;
    color: #1e293b;
  }}
  .footer {{
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    line-height: 1.5;
  }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1>Interview Invitation</h1>
      <p>Talent Vector Sourcing</p>
    </div>
    <div class="content">
      <div class="greeting">Dear {candidate_name},</div>
      <p>We are excited to invite you for an interview for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>. Our team was highly impressed by your qualifications and match profile.</p>
      
      <div class="job-card">
        <div class="job-title-row">{job_title}</div>
        <div class="job-detail"><strong>Company:</strong> {company_name}</div>
        {location_row}
        {website_row}
      </div>

      <p>{recruiter_name} ({recruiter_role}) from our talent acquisition team will be in touch shortly to coordinate the next steps and schedule a session.</p>
      
      <div class="signature">
        <div class="signature-name">{recruiter_name}</div>
        <div>{recruiter_role}</div>
        <div style="font-weight: 600; color: #1e293b; margin-top: 4px;">{company_name}</div>
      </div>
    </div>
    <div class="footer">
      This email was sent on behalf of {company_name} via Talent Vector.<br>
      You received this because your profile matched our current sourcing requirements. If you wish to opt-out, please reply to this email.
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

    # 2. Optional: n8n webhook email campaign dispatcher (Medium Priority)
    n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if n8n_webhook_url:
        print(f"Triggering n8n email workflow for {candidate_email} via webhook...")
        payload = {
            "email": candidate_email,
            "name": candidate_name,
            "job_title": job_title,
            "company_name": company_name,
            "company_website": website,
            "company_location": location,
            "recruiter_name": recruiter_name,
            "recruiter_role": recruiter_role
        }
        try:
            response = httpx.post(n8n_webhook_url, json=payload, timeout=5.0)
            if response.status_code == 200:
                print(f"n8n webhook triggered successfully for {candidate_email}")
                return True
            else:
                print(f"n8n webhook returned status code {response.status_code}. Falling back to standard dispatch.")
        except Exception as e:
            print(f"Error triggering n8n webhook: {e}. Falling back to standard dispatch.")

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


async def trigger_n8n_email_workflow(candidate_email: str, candidate_name: str, job_title: str) -> bool:
    """
    Asynchronously fires a request to the n8n Webhook node to invite a candidate.
    Fire-and-forget logic that unblocks the FastAPI thread pool completely.
    """
    n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "https://your-n8n-instance.com/webhook/invite-candidate")
    
    payload = {
        "email": candidate_email,
        "name": candidate_name,
        "job_title": job_title
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(n8n_webhook_url, json=payload, timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            print(f"Error triggering n8n email workflow: {e}")
            return False


