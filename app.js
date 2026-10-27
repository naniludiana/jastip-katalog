// CONFIGURATION: paste your deployed Google Apps Script web-app URL here.
const API_URL = "https://script.google.com/macros/s/AKfycbxtGHWHIkWFpEkWE0XIQ-bZh84O51ic_8K31Uyksue2RjGru7JIsiV2AUXclwmbXSOxFw/exec";
const WHATSAPP_NUMBER = "628XXXXXXXXXX"; // International format, digits only; replace before publishing.
const DEMO_PRODUCTS = [
  {id:"demo-1",name:"Anua Niacinamide 10 TXA 4 Serum 30ml (2입)",category:"Skincare",price:242000,availability:"available",imageUrl:"",description:""},
  {id:"demo-2",name:"Mediheal Essential Mask 10+1 (pilih varian)",category:"Skincare",price:26000,availability:"available",imageUrl:"",description:""},
  {id:"demo-3",name:"Daiso Tumbler Minhwa 500ml (전통의멋)",category:"Lifestyle",price:149000,availability:"available",imageUrl:"",description:""},
  {id:"demo-4",name:"Daiso VT PDRN Glow Cream 50ml",category:"Skincare",price:149000,availability:"sold out",imageUrl:"",description:""}
];
const state = {products:[],cart:new Map(),usingDemo:false};
const $ = (s)=>document.querySelector(s);
const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const available = p => ["available","tersedia","ready","in stock","yes","true","aktif"].includes(String(p.availability||"").trim().toLowerCase());
function safeText(value=""){return String(value??"");}
function makePlaceholder(){return "♡";}
function productImage(p){return p.imageUrl ? `<img loading="lazy" src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.name)}" onerror="this.remove()">` : `<span class="photo-placeholder">${makePlaceholder()}</span>`;}
function escapeHTML(s){return safeText(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s){return escapeHTML(s);}
function renderCategories(){
  const sel=$("#category-filter"), current=sel.value;
  const cats=[...new Set(state.products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  sel.innerHTML='<option value="">Semua kategori</option>'+cats.map(c=>`<option value="${escapeAttr(c)}">${escapeHTML(c)}</option>`).join("");
  sel.value=cats.includes(current)?current:"";
}
function renderProducts(){
  const query=$("#search").value.trim().toLowerCase(), cat=$("#category-filter").value, only=$("#available-only").checked;
  const list=state.products.filter(p=>(!query || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query))&&(!cat||p.category===cat)&&(!only||available(p)));
  $("#product-total").textContent=`${list.length} little finds`;
  $("#catalog-status").textContent=state.usingDemo?"Preview mode · data contoh. Hubungkan Apps Script untuk katalog aktual.":(state.products.length?"Updated from your catalogue ♡":"Belum ada produk yang dipublikasikan.");
  $("#product-grid").innerHTML=list.length?list.map(p=>`
    <article class="product-card">
      <div class="product-photo">${productImage(p)}<span class="status-pill ${available(p)?"":"sold"}">${available(p)?"AVAILABLE":"SOLD OUT"}</span></div>
      <div class="product-info"><p class="product-category">${escapeHTML(p.category||"Korean finds")}</p><h3 class="product-name">${escapeHTML(p.name)}</h3><div class="product-price">${rupiah(p.price)}</div>
      <div class="product-actions"><button class="add-button" data-add="${escapeAttr(p.id)}" ${available(p)?"":"disabled"}>${available(p)?"Add to bag +":"Sold out"}</button><button class="detail-button" data-detail="${escapeAttr(p.id)}" aria-label="Detail produk">♡</button></div></div>
    </article>`).join(""):`<div class="empty-state">Belum ada produk yang cocok ♡<br><small>Coba kata kunci atau kategori lain.</small></div>`;
}
function renderCart(){
  const items=[...state.cart.values()];
  $("#cart-count").textContent=items.reduce((s,i)=>s+i.qty,0);
  $("#cart-items").innerHTML=items.length?items.map(i=>`<div class="cart-row"><div><h3>${escapeHTML(i.name)}</h3><p>${rupiah(i.price)} / pcs</p></div><div class="qty-controls"><button data-qty="${escapeAttr(i.id)}" data-delta="-1" aria-label="Kurangi">−</button><span>${i.qty}</span><button data-qty="${escapeAttr(i.id)}" data-delta="1" aria-label="Tambah">+</button></div></div>`).join(""):'<div class="empty-state">Your bag is waiting for something cute ♡</div>';
  $("#cart-total").textContent=rupiah(items.reduce((s,i)=>s+i.price*i.qty,0));
}
function openCart(){$("#cart-drawer").classList.add("open");$("#drawer-backdrop").classList.add("open");$("#cart-drawer").setAttribute("aria-hidden","false");}
function closeCart(){$("#cart-drawer").classList.remove("open");$("#drawer-backdrop").classList.remove("open");$("#cart-drawer").setAttribute("aria-hidden","true");}
async function loadProducts(){
  if(API_URL.startsWith("https://script.google.com/")&&!API_URL.includes("https://script.google.com/macros/s/AKfycbxtGHWHIkWFpEkWE0XIQ-bZh84O51ic_8K31Uyksue2RjGru7JIsiV2AUXclwmbXSOxFw/exec")){
    try{
      const r=await fetch(`${API_URL}?action=products`,{redirect:"follow"});
      if(!r.ok)throw new Error("API response was not OK");
      const data=await r.json();
      if(!Array.isArray(data.products))throw new Error("Format data katalog tidak sesuai");
      state.products=data.products;state.usingDemo=false;
    }catch(e){state.products=DEMO_PRODUCTS;state.usingDemo=true;console.warn(e);}
  }else{state.products=DEMO_PRODUCTS;state.usingDemo=true;}
  renderCategories();renderProducts();
}
$("#product-grid").addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"), detail=e.target.closest("[data-detail]");
  if(add){const p=state.products.find(x=>String(x.id)===add.dataset.add);if(!p||!available(p))return;const item=state.cart.get(p.id);state.cart.set(p.id,{...p,qty:(item?.qty||0)+1});renderCart();openCart();}
  if(detail){const p=state.products.find(x=>String(x.id)===detail.dataset.detail);if(p)alert(`${p.name}\n\n${p.description||"Detail produk dapat ditanyakan melalui WhatsApp."}\n\nHarga: ${rupiah(p.price)}\nStatus: ${available(p)?"Available":"Sold out"}`);}
});
$("#cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(!b)return;const id=b.dataset.qty,item=state.cart.get(id);if(!item)return;item.qty+=Number(b.dataset.delta);if(item.qty<=0)state.cart.delete(id);else state.cart.set(id,item);renderCart();});
$("#search").addEventListener("input",renderProducts);$("#category-filter").addEventListener("change",renderProducts);$("#available-only").addEventListener("change",renderProducts);
$("#open-cart").addEventListener("click",openCart);$("#close-cart").addEventListener("click",closeCart);$("#drawer-backdrop").addEventListener("click",closeCart);
$("#whatsapp-checkout").addEventListener("click",()=>{
  if(!state.cart.size){$("#order-message").textContent="Keranjang kamu masih kosong ♡";return;}
  if(!/^62\d{8,15}$/.test(WHATSAPP_NUMBER)){ $("#order-message").textContent="Admin perlu mengatur nomor WhatsApp di app.js sebelum checkout WhatsApp digunakan.";return;}
  const lines=[...state.cart.values()].map(i=>`• ${i.name} x${i.qty} — ${rupiah(i.price*i.qty)}`);
  const total=[...state.cart.values()].reduce((s,i)=>s+i.price*i.qty,0);
  const msg=`Halo! Aku mau order jastip Korea ♡\n\n${lines.join("\n")}\n\nEstimasi total: ${rupiah(total)}\nMohon konfirmasi ketersediaan dan total finalnya ya.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
});
$("#order-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!state.cart.size){$("#order-message").textContent="Keranjang kamu masih kosong ♡";return;}
  if(state.usingDemo||!API_URL.startsWith("https://script.google.com/")){$("#order-message").textContent="Form belum tersambung. Deploy Apps Script dan masukkan URL-nya di app.js dulu ya.";return;}
  const form=new FormData(e.currentTarget), payload={action:"createOrder",customerName:form.get("customerName"),whatsapp:form.get("whatsapp"),notes:form.get("notes"),items:[...state.cart.values()].map(i=>({id:i.id,qty:i.qty}))};
  const button=$("#submit-order");button.disabled=true;button.textContent="Mengirim…";$("#order-message").textContent="";
  try{
    // Apps Script web apps commonly need no-cors for simple POSTs from static hosting.
    // The browser cannot read the response in no-cors mode; the UI therefore does not claim confirmation.
    await fetch(API_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
    $("#order-message").textContent="Permintaan order terkirim. Mohon tunggu konfirmasi admin melalui WhatsApp. Jika belum ada balasan, hubungi admin langsung.";
    state.cart.clear();renderCart();e.currentTarget.reset();
  }catch(err){$("#order-message").textContent="Belum berhasil mengirim. Coba checkout via WhatsApp atau hubungi admin.";}
  finally{button.disabled=false;button.textContent="Kirim form order";}
});
renderCart();loadProducts();
