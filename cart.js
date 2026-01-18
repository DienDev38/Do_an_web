(function(){
  // Cart stored in localStorage as JSON under key 'cart_items' (array)
  function readItems(){
    try{ return JSON.parse(localStorage.getItem('cart_items')||'[]') || []; }catch(e){ return []; }
  }
  function writeItems(items){ localStorage.setItem('cart_items', JSON.stringify(items)); updateBadge(); }

  function getCount(){
    return readItems().reduce((s,it)=> s + (parseInt(it.qty||0,10)||0), 0);
  }

  function findIndexById(id){ const items = readItems(); return items.findIndex(i=>i.id===id); }

  function addItem(item){
    // item: {id, title, price, original, img, qty}
    if(!item || !item.id) return;
    const items = readItems();
    const idx = items.findIndex(i=>i.id === item.id);
    if(idx >= 0){ items[idx].qty = (parseInt(items[idx].qty||0,10) || 0) + (parseInt(item.qty||1,10) || 1); }
    else{ items.push({ id: String(item.id), title: item.title||'', price: item.price||0, original: item.original||0, img: item.img||'', qty: parseInt(item.qty||1,10) || 1 }); }
    writeItems(items);
    notifyAdded(item.title || 'Sản phẩm');
    return true;
  }

  function updateQty(id, qty){
    const items = readItems(); const idx = items.findIndex(i=>i.id===id); if(idx<0) return;
    if(qty<=0){ items.splice(idx,1); } else { items[idx].qty = qty; }
    writeItems(items);
  }

  function removeItem(id){ const items = readItems(); const idx = items.findIndex(i=>i.id===id); if(idx>=0){ items.splice(idx,1); writeItems(items);} }

  function clear(){ localStorage.removeItem('cart_items'); updateBadge(); }

  function total(){ return readItems().reduce((s,i)=> s + (parseInt(i.price||0,10)||0) * (parseInt(i.qty||0,10)||0), 0); }

  function updateBadge(){
    const els = document.querySelectorAll('.cart-count');
    const v = getCount();
    els.forEach(e=>{ e.textContent = String(v); e.style.display = v>0 ? 'inline-block' : 'none'; });
  }

  // render cart on cart.html if container exists
  function renderCart(){
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if(!container) return;
    const items = readItems();
    container.innerHTML = '';
    if(!items.length){ container.innerHTML = '<p>Giỏ hàng trống.</p>'; if(totalEl) totalEl.textContent = '0đ'; return; }
    items.forEach(it=>{
      const row = document.createElement('div'); row.className = 'cart-row';
      row.innerHTML = `
        <div class="cart-img"><img src="${it.img||'images/anh_ao.png'}" alt=""/></div>
        <div class="cart-title">${it.title}</div>
        <div class="cart-qty"><button class="qty-dec" data-id="${it.id}">-</button><input data-id="${it.id}" value="${it.qty}"/><button class="qty-inc" data-id="${it.id}">+</button></div>
        <div class="cart-price">${formatVnd(it.price)}</div>
        <div class="cart-remove"><button class="remove-item" data-id="${it.id}">Xóa</button></div>
      `;
      container.appendChild(row);
    });
    if(totalEl) totalEl.textContent = formatVnd(total());

    // attach handlers
    container.querySelectorAll('.qty-dec').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const items=readItems(); const idx=items.findIndex(x=>x.id===id); if(idx>=0){ const q=(parseInt(items[idx].qty,10)||0)-1; updateQty(id, q); renderCart(); }}));
    container.querySelectorAll('.qty-inc').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const items=readItems(); const idx=items.findIndex(x=>x.id===id); if(idx>=0){ const q=(parseInt(items[idx].qty,10)||0)+1; updateQty(id, q); renderCart(); }}));
    container.querySelectorAll('.remove-item').forEach(b=> b.addEventListener('click', ()=>{ removeItem(b.dataset.id); renderCart(); }));
    container.querySelectorAll('.cart-qty input').forEach(inp=> inp.addEventListener('change', e=>{ const id=inp.dataset.id; const q=parseInt(inp.value,10)||1; updateQty(id, q); renderCart(); }));
  }

  function formatVnd(num){ const n = parseInt(num||0,10); if(isNaN(n)) return num; return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'; }

  // helper: add current product from product page
  function addCurrentProduct(){
    try{
      const title = document.querySelector('.product-title')?.textContent || 'Sản phẩm';
      const priceText = document.querySelector('.price-sale')?.textContent || document.querySelector('.product-price')?.textContent || '';
      const img = document.getElementById('product-main')?.src || 'images/anh_ao.png';
      // parse numeric price from formatted string
      const numeric = (document.querySelector('.price-sale')?.textContent || '').replace(/[^0-9]/g,'') || '';
      const original = (document.querySelector('.price-original')?.textContent || '').replace(/[^0-9]/g,'') || '';
      const id = 'p-' + Math.abs(hashCode(title));
      addItem({ id, title: title.trim(), price: parseInt(numeric||0,10), original: parseInt(original||0,10), img, qty: 1 });
    }catch(e){ console.error(e); }
  }

  function hashCode(str){ var h=0; for(var i=0;i<str.length;i++){ h = ((h<<5)-h)+str.charCodeAt(i); h|=0; } return h; }

  function notifyAdded(title){
    try{
      const text = `Đã thêm "${title}" vào giỏ hàng`;
      let toast = document.querySelector('.toast');
      if(!toast){
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(notifyAdded._t);
      notifyAdded._t = setTimeout(()=> toast.classList.remove('show'), 2000);
    }catch(e){ console.error(e); }
  }

  // expose public API
  window.cart = { addItem, updateQty, removeItem, readItems, clear, total, renderCart, addCurrentProduct, notifyAdded };

  document.addEventListener('DOMContentLoaded', ()=>{
    try{ updateBadge();
      // replace previous simple add-cart handler: add current product and update badge
      document.querySelectorAll('.add-cart').forEach(btn=> btn.addEventListener('click', e=>{
        try{ e.preventDefault(); }catch(e){}
        addCurrentProduct();
        updateBadge();
      }));

      // support direct add from links with ?add=1 params (promo direct-add if needed)
      const url = new URL(window.location.href);
      if(url.searchParams.get('add')==='1'){
        const p = url.searchParams.get('price');
        const o = url.searchParams.get('original');
        const t = url.searchParams.get('title');
        const img = url.searchParams.get('img');
        const id = 'p-' + Math.abs(hashCode(t||'promo'));
        addItem({ id, title: t? decodeURIComponent(t): 'Sản phẩm', price: parseInt(p||0,10), original: parseInt(o||0,10), img: img? decodeURIComponent(img): 'images/anh_ao.png', qty: 1 });
        updateBadge();
        // optional redirect to cart
        if(url.searchParams.get('goto')==='cart') window.location.href = 'cart.html';
      }

      // render cart page if present
      renderCart();
    }catch(err){ console.error('cart.js error', err); }
  });
})();
