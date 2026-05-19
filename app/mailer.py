
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
