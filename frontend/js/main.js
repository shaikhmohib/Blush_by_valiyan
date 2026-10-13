const API = "";
const fallbackServices = [
  {title:"Bridal Makeup",description:"A personalised bridal look designed to feel timeless, photograph beautifully and last through your special day.",price:"Enquire for pricing",category:"Bridal"},
  {title:"Engagement Makeup",description:"Soft, polished glam for your engagement, ring ceremony or pre-wedding celebration.",price:"Enquire for pricing",category:"Occasion"},
  {title:"Party & Occasion",description:"From understated elegance to full glam, tailored to your outfit, event and personality.",price:"Enquire for pricing",category:"Occasion"}
];
const fallbackGallery = [
  {title:"Soft bridal glow",category:"Bridal",imageUrl:"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=700&q=80"},
  {title:"Radiant beauty",category:"Soft glam",imageUrl:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80"},
  {title:"Editorial elegance",category:"Beauty",imageUrl:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80"}
];
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error("Request failed"); return r.json(); }
function escapeHTML(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function renderServices(items) {
  const grid = document.getElementById("serviceGrid");
  grid.innerHTML = items.length ? items.map((s,i)=>`<article class="service-card"><span class="service-number">0${i+1}</span><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.description)}</p><div class="service-meta"><span>${escapeHTML(s.category||"Makeup")}</span><span>${escapeHTML(s.price||"Enquire for pricing")}</span></div></article>`).join("") : '<div class="empty-state">Services will be added soon. Please enquire for details.</div>';
  const select = document.getElementById("service");
  select.innerHTML = '<option value="">Choose a service</option>' + items.map(s=>`<option value="${escapeHTML(s.title)}">${escapeHTML(s.title)}</option>`).join("");
}
function renderGallery(items) {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = items.length ? items.map(g=>`<figure class="gallery-card"><img loading="lazy" src="${escapeHTML(g.imageUrl)}" alt="${escapeHTML(g.title||"Makeup portfolio image")}"><figcaption>${escapeHTML(g.title||"Makeup look")} · ${escapeHTML(g.category||"Portfolio")}</figcaption></figure>`).join("") : '<div class="empty-state">New portfolio photos are coming soon.</div>';
}
async function loadPublicContent() {
  let services=fallbackServices, gallery=fallbackGallery;
  try { const data=await getJSON("/api/services"); if(Array.isArray(data)) services=data; } catch {}
  try { const data=await getJSON("/api/gallery"); if(Array.isArray(data) && data.length) gallery=data; } catch {}
  renderServices(services); renderGallery(gallery);
  try {
    const settings=await getJSON("/api/settings");
    if(settings.email){const a=document.getElementById("emailLink");a.textContent=settings.email;a.href=`mailto:${settings.email}`;}
    if(settings.instagram){const a=document.getElementById("instagramLink");a.href=settings.instagram;a.textContent=settings.instagram.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"")+" ↗";}
    if(settings.whatsapp){const n=settings.whatsapp.replace(/\D/g,"");document.getElementById("whatsappFloat").href=`https://wa.me/${n}?text=${encodeURIComponent("Hello! I would like to enquire about makeup services.")}`;}
  } catch {}
}
document.getElementById("year").textContent=new Date().getFullYear();
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));
loadPublicContent();
