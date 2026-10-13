/*
  EmailJS setup:
  1. Create a service and email template at https://www.emailjs.com/
  2. In your template, use variables: {{from_name}}, {{from_email}}, {{phone}},
     {{service}}, {{event_date}}, {{message}}.
  3. Replace the three configuration values below. Never put a private email-service
     secret in browser JavaScript. EmailJS public keys are designed for browser use.
*/
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const OWNER_WHATSAPP = ""; // Add country code + number, digits only, e.g. 919876543210.
const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");
if (window.emailjs && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_")) emailjs.init({publicKey: EMAILJS_PUBLIC_KEY});
form.addEventListener("submit", async e => {
  e.preventDefault();
  statusEl.textContent=""; statusEl.className="form-status";
  const data = Object.fromEntries(new FormData(form).entries());
  submitButton.disabled=true; submitButton.textContent="Sending your enquiry…";
  try {
    // Save inquiry to the backend/database first.
    const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok) throw new Error(result.message||"Unable to submit your enquiry.");
    let emailSent=false;
    if(window.emailjs && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_") && !EMAILJS_SERVICE_ID.startsWith("YOUR_") && !EMAILJS_TEMPLATE_ID.startsWith("YOUR_")) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{
          from_name:data.name, from_email:data.email, phone:data.phone||"Not provided",
          service:data.service||"Not specified", event_date:data.date||"Not specified", message:data.message
        });
        emailSent=true;
      } catch(err) { console.error("EmailJS notification failed:",err); }
    }
    statusEl.classList.add("success");
    statusEl.textContent=emailSent ? "Thank you! Your enquiry has been sent successfully." : "Thank you! Your enquiry is saved. Email notifications are not configured yet, so please contact us on WhatsApp for a faster reply.";
    const number=OWNER_WHATSAPP.replace(/\D/g,"");
    if(number) {
      const text=`New makeup enquiry\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone||"Not provided"}\nService: ${data.service||"Not specified"}\nEvent date: ${data.date||"Not specified"}\nMessage: ${data.message}`;
      const link=document.createElement("a"); link.href=`https://wa.me/${number}?text=${encodeURIComponent(text)}`; link.target="_blank"; link.rel="noopener"; link.className="text-link"; link.textContent="Open WhatsApp with enquiry details ↗"; link.style.display="inline-block"; link.style.marginTop="10px"; statusEl.appendChild(document.createElement("br")); statusEl.appendChild(link);
    }
    form.reset();
  } catch(err) {
    statusEl.classList.add("error"); statusEl.textContent=err.message||"Something went wrong. Please try again.";
  } finally { submitButton.disabled=false; submitButton.innerHTML='Send your enquiry <span>↗</span>'; }
});
