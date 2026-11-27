// MHM Electronics - shared code for admin and customer app (needs i18n.js first)

// ---------- Storage ----------
function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function load(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }

// ---------- Language ----------
var LANG = load('mhm_lang') || 'ur';
if (!(LANG in LANGS)) LANG = 'ur';

function t(key, vars) {
  var row = I18N_RAW[key];
  var s = row ? (row[LANGS[LANG]] || row[0]) : key;
  if (vars && typeof s === 'string') {
    for (var v in vars) s = s.split('{' + v + '}').join(vars[v] == null ? '' : vars[v]);
  }
  return s;
}

function applyLang() {
  var h = document.documentElement;
  h.lang = LANG;
  h.dir = LANG === 'en' ? 'ltr' : 'rtl';
  var q = function (sel, fn) { var els = document.querySelectorAll(sel); for (var i = 0; i < els.length; i++) fn(els[i]); };
  q('[data-i18n]', function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  q('[data-i18n-ph]', function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  q('.lang-switch button', function (el) { el.classList.toggle('active', el.getAttribute('data-l') === LANG); });
}

function setLang(l) {
  LANG = l;
  store('mhm_lang', l);
  applyLang();
  if (window.onLangChange) window.onLangChange();
}

function langSwitchHtml() {
  return '<div class="lang-switch"><button data-l="ur" onclick="setLang(\'ur\')">اردو</button>' +
    '<button data-l="en" onclick="setLang(\'en\')">English</button><button data-l="ar" onclick="setLang(\'ar\')">العربية</button></div>';
}

function termsHtml() {
  return '<ol class="terms">' + TERMS_ALL[LANG].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
}

function ackText(c, d) {
  return ACK_ALL[LANG]
    .replace('{name}', c.name || '____').replace('{father}', c.fatherName || '____').replace('{cnic}', c.cnic || '____')
    .replace('{product}', ((d.itemType || '') + ' ' + (d.company || '')).trim() || '____')
    .replace('{model}', d.model || '____').replace('{serial}', d.serial || '____');
}

// ---------- Basic helpers ----------
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }
function initial(name) { return esc(String(name || '?').trim().charAt(0)); }

function toast(msg, err) {
  var el = $('toast');
  el.textContent = msg;
  el.className = err ? 'err' : '';
  el.style.display = 'block';
  clearTimeout(el._h);
  el._h = setTimeout(function () { el.style.display = 'none'; }, err ? 6000 : 3000);
}
function busy(on) { $('loading').style.display = on ? 'flex' : 'none'; }
function modal(html) {
  $('modalHost').innerHTML = '<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">' + html + '</div></div>';
}
function closeModal() {
  if (window._scanner) { try { window._scanner.stop(); } catch (e) {} window._scanner = null; }
  $('modalHost').innerHTML = '';
}

function badge(s) { return '<span class="badge b-' + String(s).replace(/\s/g, '') + '">' + esc(I18N_RAW['st_' + s] ? t('st_' + s) : s) + '</span>'; }

function waNum(m) {
  var s = String(m || '').replace(/\D/g, '');
  if (s.indexOf('0') === 0) s = '92' + s.substring(1);
  return s;
}
function waLink(num, msg) { return 'https://wa.me/' + encodeURIComponent(num || '') + '?text=' + encodeURIComponent(msg); }
function portalUrl() { return new URL('portal.html', location.href).href.split('?')[0].split('#')[0]; }

// ---------- Server call ----------
function api(fn, args, quiet) {
  if (!window.MHM_API || window.MHM_API.indexOf('http') !== 0) {
    toast(t('e_NO_API'), true);
    return Promise.reject(new Error('NO_API'));
  }
  if (!quiet) busy(true);
  return fetch(window.MHM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn: fn, args: args || [] })
  }).then(function (r) { return r.json(); })
    .then(function (res) {
      busy(false);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    })
    .catch(function (e) { busy(false); throw e; });
}

function errMsg(e) {
  var m = String(e && e.message || e);
  return I18N_RAW['e_' + m] ? t('e_' + m) : (t('problem') + ' ' + m);
}
function fail(e) { toast(errMsg(e), true); }

// ---------- Images ----------
function readImage(input, maxSize) {
  return new Promise(function (resolve) {
    var f = input && input.files && input.files[0];
    if (!f) { resolve(null); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = maxSize || 1400, w = img.width, h = img.height;
        if (w > max || h > max) { var k = max / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ data: c.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: 'image/jpeg', name: f.name });
      };
      img.onerror = function () { resolve({ data: String(reader.result).split(',')[1], mimeType: f.type, name: f.name }); };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  });
}
function readImages(map) {
  var out = {}, keys = Object.keys(map);
  return keys.reduce(function (p, k) {
    return p.then(function () { return readImage($(map[k])).then(function (r) { if (r) out[k] = r; }); });
  }, Promise.resolve()).then(function () { return out; });
}

// Fill form fields from a CNIC scan. ids = {name, father, cnic, address}
function fillFromScan(kind, fields, ids) {
  var n = 0;
  var set = function (id, v, onlyIfEmpty) {
    var el = id && $(id);
    if (!el || !v) return;
    if (onlyIfEmpty && el.value) return;
    el.value = v; n++;
  };
  if (kind === 'cnicFront') { set(ids.name, fields.name); set(ids.father, fields.fatherName); set(ids.cnic, fields.cnic); }
  if (kind === 'cnicBack') { set(ids.address, fields.address); set(ids.cnic, fields.cnic, true); }
  toast(n ? t('scan_filled', { n: n }) : t('scan_none'), !n);
}

// ---------- Receipt image ----------
function receiptHtml(info) {
  var p = info.payment, d = info.deal, c = info.customer, shop = info.shop || {};
  var dir = LANG === 'en' ? 'ltr' : 'rtl';
  var hist = (d.payments || []).filter(function (x) { return x.status === 'Shop Received' || x.status === 'Confirmed'; }).slice().reverse();
  var N = 'font-family:Poppins,Arial;direction:ltr;unicode-bidi:isolate';
  var rows = hist.map(function (x, i) {
    var cur = x.receiptNo === p.receiptNo;
    return '<tr' + (cur ? ' style="background:#fff6dc;font-weight:700"' : '') + '><td style="' + N + '">' + (i + 1) +
      '</td><td style="' + N + '">' + esc(x.receiptNo) + '</td><td style="' + N + '">' +
      esc((x.shopConfirmedAt || x.date).split(' ')[0]) + '</td><td style="' + N + '">' + money(x.amount) + '</td></tr>';
  }).join('');
  var row = function (a, b, style) { return '<div class="row"><span>' + a + '</span><b style="' + N + (style || '') + '">' + b + '</b></div>'; };
  return '<div class="rcpt lang-' + LANG + '" dir="' + dir + '">' +
    '<img class="rcpt-lh" src="lh-header.jpg"><div class="rcpt-title">' + t('r_title') + '</div>' +
    '<div class="rcpt-body">' +
    '<div class="row"><span>' + t('r_customer') + '</span><b>' + esc(c.name) + '</b></div>' +
    row(t('account_no'), esc(d.accountNo)) +
    '<div class="row"><span>' + t('product') + '</span><span>' + esc(d.itemType + ' - ' + d.company + ' ' + d.model) + '</span></div>' +
    '<div class="rcpt-amt"><span>' + t('r_this_amt') + '</span><b>' + money(p.amount) + '</b><span style="' + N + ';font-size:11px">' +
    esc(p.receiptNo) + ' | ' + esc(p.shopConfirmedAt || p.date) + '</span></div>' +
    '<div class="rcpt-count"><div style="background:#2f6fde">' + t('r_total_inst') + '<b>' + d.schedule.length + '</b></div>' +
    '<div style="background:#1f9d55">' + t('r_paid') + '<b>' + d.paidCount + '</b></div>' +
    '<div style="background:#e8890c">' + t('r_left') + '<b>' + d.remainingCount + '</b></div></div>' +
    '<div style="font-weight:700;color:#0a1f44">' + t('r_all') + '</div>' +
    '<table><tr><th>#</th><th>' + t('r_receipt') + '</th><th>' + t('date') + '</th><th>' + t('amount') + '</th></tr>' + rows + '</table>' +
    row(t('total_price'), money(d.totalPrice)) + row(t('advance'), money(d.advance)) +
    row(t('total_paid'), money(d.totalPaid), ';color:#1f9d55') + row(t('balance'), money(d.balance), ';color:#d64545') +
    '<p style="text-align:center;color:#0a1f44;margin:6px 0 0">' + t('thanks') + ' — ' + esc(shop.shopName || 'MHM Electronics') + '</p>' +
    '</div><img class="rcpt-lh" src="lh-footer.jpg"></div>';
}

function receiptImage(info) {
  var wrap = document.createElement('div');
  wrap.className = 'receipt-wrap';
  wrap.innerHTML = receiptHtml(info);
  document.body.appendChild(wrap);
  var node = wrap.firstChild;
  var imgs = Array.prototype.slice.call(node.querySelectorAll('img'));
  var ready = Promise.all(imgs.map(function (im) {
    return im.complete ? 0 : new Promise(function (r) { im.onload = im.onerror = r; });
  }));
  var run = function () { return htmlToImage.toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true }); };
  return ready.then(run).catch(run).then(function (blob) {
    document.body.removeChild(wrap);
    return blob;
  }, function (e) { document.body.removeChild(wrap); throw e; });
}

function shareReceipt(info) {
  busy(true);
  return receiptImage(info).then(function (blob) {
    busy(false);
    var name = 'Receipt-' + info.payment.receiptNo + '.png';
    var file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: name }).catch(function () {});
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast(t('receipt_downloaded'));
  }).catch(function (e) { busy(false); fail(e); });
}

// ---------- Printable agreement ----------
function printAgreement(c, d) {
  var w = window.open('', '_blank');
  if (!w) { toast(t('allow_popup'), true); return; }
  var dir = LANG === 'en' ? 'ltr' : 'rtl';
  var line = function (a, b) { return '<tr><th>' + a + '</th><td>' + esc(b) + '</td></tr>'; };
  w.document.write('<!DOCTYPE html><html dir="' + dir + '" lang="' + LANG + '"><head><meta charset="utf-8"><title>' + esc(d.accountNo) + '</title>' +
    '<link rel="stylesheet" href="' + new URL('style.css', location.href).href + '"><style>body{padding:20px;background:#fff}table{margin-bottom:10px}th{width:35%}' +
    '.sig{display:flex;justify-content:space-between;margin-top:40px}.sig div{width:45%;border-top:1px solid #333;text-align:center;padding-top:4px}</style></head><body>' +
    '<img src="' + new URL('lh-header.jpg', location.href).href + '" style="width:100%;display:block">' +
    '<h3 style="text-align:center">' + t('agr_title') + '</h3><table>' +
    line(t('account_no'), d.accountNo) + line(t('r_customer'), c.name + ' ' + t('son_of') + ' ' + c.fatherName) + line(t('cnic'), c.cnic) +
    line(t('mobile'), c.mobile) + line(t('product'), d.itemType + ' - ' + d.company + ' ' + d.model + ' ' + (d.color || '')) +
    line(t('imei_serial'), d.serial) + line(t('total_price'), money(d.totalPrice)) + line(t('advance'), money(d.advance)) +
    line(t('monthly_inst'), money(d.monthly) + ' x ' + d.installments) + line(t('first_due'), d.firstDue) +
    (d.chequeNo ? line(t('cheque_sec'), (d.chequeBank || '') + ' | ' + t('cheque_no') + ' ' + d.chequeNo + ' | ' + t('account') + ' ' + d.chequeAccount) : '') +
    '</table><h3>' + t('terms_title') + '</h3>' + termsHtml() +
    '<h3>' + t('office_use') + '</h3><p>' + esc(ackText(c, d)) + '</p>' +
    (d.ackCustomer ? '<p>' + t('ack_cust_digital') + ' ' + esc(d.ackCustomer) + '</p>' : '') +
    (d.ackShop ? '<p>' + t('ack_shop_digital') + ' ' + esc(d.ackShop) + '</p>' : '') +
    '<div class="sig"><div>' + t('sig_cust') + '</div><div>' + t('sig_mgr') + '</div></div>' +
    '<img src="' + new URL('lh-footer.jpg', location.href).href + '" style="width:100%;display:block;margin-top:30px">' +
    '<script>setTimeout(function(){window.print()},900)<\/script></body></html>');
  w.document.close();
}
