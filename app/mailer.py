
import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

def send_interview_invitations(top_candidates):
    """
    Automates candidate replies for the top 5 matches.
    """
    sender_email = os.getenv("SENDER_EMAIL")
    sender_pass = os.getenv("SENDER_PASSWORD")
    if not sender_email or not sender_pass:
        print("SMTP Credentials not configured. Skipping candidate replies.")
        return

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_pass)
            for cand in top_candidates:
                email = cand.get('email')
                if email and email != "Not Found":
                    msg = EmailMessage()
                    msg.set_content(f"Dear {cand.get('name', 'Candidate')},\n\nWe were impressed by your profile (Score: {cand['score']*100:.1f}%). We'd like to invite you for an interview.\n\nBest regards,\nHR Team")
                    msg['Subject'] = "Interview Invitation - Resume Screening"
                    msg['From'] = sender_email
                    msg['To'] = email
                    server.send_message(msg)
                    print(f"Invitation sent to {email}")
    except Exception as e:
        print(f"Error sending invitations: {e}")

def send_hr_report(top_candidates):
    """
    Formats the top candidates into a clean table and emails it to the hiring manager.
    """
    manager_email = os.getenv("MANAGER_EMAIL")
    sender_email = os.getenv("SENDER_EMAIL")
    sender_pass = os.getenv("SENDER_PASSWORD")

    if not all([manager_email, sender_email, sender_pass]):
        print("Manager email or SMTP credentials missing. Skipping report.")
        return

    # Create HTML table
    table_rows = ""
    for cand in top_candidates:
        skills = ", ".join(cand.get('entities', {}).get('Skills', []))
        table_rows += f"<tr><td>{cand['name']}</td><td>{cand['score']*100:.1f}%</td><td>{cand['email']}</td><td>{skills}</td></tr>"

    html_content = f"""
    <html>
    <body>
        <h2>Resume Screening Shortlist Report</h2>
        <table border="1">
            <thead>
                <tr><th>Name</th><th>Match %</th><th>Email</th><th>Verified Skills</th></tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>
    </body>
    </html>
    """

    try:
        msg = EmailMessage()
        msg.set_content("See the attached report for top candidates.")
        msg.add_alternative(html_content, subtype='html')
        msg['Subject'] = "HR Shortlist Report - Final Selection"
        msg['From'] = sender_email
        msg['To'] = manager_email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_pass)
            server.send_message(msg)
            print(f"HR Report sent to {manager_email}")
    except Exception as e:
        print(f"Error sending HR report: {e}")

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
    populated with the recruiter's Company Profile details.
    """
    sender_email = os.getenv("SENDER_EMAIL")
    sender_pass = os.getenv("SENDER_PASSWORD")
    
    company_name = company_details.get("company_name", "Our Company")
    website = company_details.get("website", "")
    hq = company_details.get("hq_location", "")
    address = company_details.get("address", "")
    
    body = (
        f"Dear {candidate_name},\n\n"
        f"We are excited to invite you for an interview for the {job_title} position at {company_name}.\n\n"
        f"Position: {job_title}\n"
        f"Company: {company_name}\n"
    )
    if website:
        body += f"Website: {website}\n"
    if hq or address:
        body += f"Location: {hq or address}\n"
        
    body += (
        f"\nOur team was highly impressed by your qualifications and experience. "
        f"{recruiter_name} ({recruiter_role}) from our talent acquisition team will be in touch shortly "
        f"to coordinate the next steps.\n\n"
        f"Best regards,\n"
        f"{recruiter_name}\n"
        f"{recruiter_role}\n"
        f"{company_name}"
    )
    
    # Print email content for visibility in console
    print("\n" + "="*60)
    print("SENDING BRANDED CANDIDATE INTERVIEW INVITATION EMAIL:")
    print(f"To: {candidate_email}")
    print(f"From: {sender_email or 'mock_smtp@talentvector.com'}")
    print(f"Subject: Interview Invitation: {job_title} at {company_name}")
    print(body)
    print("="*60 + "\n")

    if not sender_email or not sender_pass:
        print("SMTP Credentials not configured. Invitation email simulated successfully.")
        return True

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = f"Interview Invitation: {job_title} at {company_name}"
        msg['From'] = sender_email
        msg['To'] = candidate_email
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_pass)
            server.send_message(msg)
        print(f"Branded invitation email sent successfully to {candidate_email}")
        return True
    except Exception as e:
        print(f"Error sending branded invite email: {e}")
        return False

