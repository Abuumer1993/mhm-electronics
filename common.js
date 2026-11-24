// MHM Electronics - shared code for admin and customer app

var TERMS = [
  'کسی بھی قسم کے کلیم کی ذمہ دار MHM الیکٹرانکس کمپنی نہ ہوگی۔ کلیم کی مکمل ذمہ داری کسٹمر کی ہوگی۔',
  'پراڈکٹ وصول کرتے وقت اپنی پوری تسلی کر لیں۔ بعد میں کسی بھی قسم کی خرابی یا نقصان کی ذمہ داری کسٹمر کی ہوگی۔',
  'کسٹمر ایڈوانس کے ساتھ ایک سیکیورٹی چیک ادا کرے گا۔ جو کہ کسٹمر کے اپنے ذاتی اکاؤنٹ کا ہوگا اور اس چیک پر وہ پوری رقم درج کی جائے گی جو کہ کسٹمر ادا کرنے کا پابند ہوگا۔',
  'سیکیورٹی کے طور پر جمع کرایا گیا چیک کسٹمر کی امانت ہوگا جو کہ اقساط کی مکمل ادائیگی کے بعد کسٹمر کو واپس کر دیا جائے گا۔ لیکن بصورت خلاف ورزی اس چیک کا استعمال قانونی کارروائی کا باعث بن سکتا ہے۔',
  'ماہانہ اقساط کی مدت اور رقم میں تبدیلی کسی بھی صورت ممکن نہ ہوگی جو کہ خلاف شرع بھی ہے اور خلاف ادب بھی۔ اگر کوئی کسٹمر اقساط کی مدت میں کمی کروانا چاہے تو بھی کل طے شدہ رقم مکمل ادا کرنا ہوگی اس میں کسی قسم کی کمی زیادتی نہ ہوگی۔',
  'ماہانہ قسط کی ادائیگی کی تاریخ کا تعین بھی ضروری ہے تاکہ کسٹمرز کو کسی بھی قسم کی پریشانی کا سامنا نہ کرنا پڑے۔',
  'ضامن سے گزارش ہے کہ ضمانت دیتے وقت اس بات کا خاص خیال رکھے کہ درخواست دہندہ قابل اعتماد فرد ہے جو کسی قسم کی دھوکے بازی یا فراڈ کا مرتکب نہ ہے۔ کہیں ایسا نہ ہو کہ بعد میں ضامن کو بھی پریشانی کا سامنا کرنا پڑے۔',
  'ہمارا عزم معزز کسٹمرز کے لئے سہولت فراہم کرنا ہے اور ہر قسم کی دھوکے بازی یا فراڈ سے بچنا ہے لہذا پراڈکٹ لیتے وقت اور ضمانت / گارنٹی دیتے وقت ہر قسم کی تسلی ضروری ہے تاکہ نقصان اور پریشانی سے بچا جا سکے۔'
];

function termsHtml() {
  return '<ol class="terms">' + TERMS.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
}

function ackText(c, d) {
  return 'میں مسمی ' + (c.name || '____') + ' ولد ' + (c.fatherName || '____') + ' شناختی کارڈ نمبر ' + (c.cnic || '____') +
    ' اس بات کا اقرار کرتا ہوں کہ میں نے پراڈکٹ ' + (d.itemType || '') + ' ' + (d.company || '') + ' ماڈل نمبر ' + (d.model || '____') +
    ' سیریل نمبر ' + (d.serial || '____') + ' کمپنی سے وصول کر لی ہے۔ جس میں کسی بھی قسم کا نقص نہ ہے۔';
}

// ---------- Basic helpers ----------
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }
function initial(name) { return esc(String(name || '؟').trim().charAt(0)); }

function toast(msg, err) {
  var t = $('toast');
  t.textContent = msg;
  t.className = err ? 'err' : '';
  t.style.display = 'block';
  clearTimeout(t._h);
  t._h = setTimeout(function () { t.style.display = 'none'; }, err ? 6000 : 3000);
}
function busy(on) { $('loading').style.display = on ? 'flex' : 'none'; }
function modal(html) {
  $('modalHost').innerHTML = '<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">' + html + '</div></div>';
}
function closeModal() {
  if (window._scanner) { try { window._scanner.stop(); } catch (e) {} window._scanner = null; }
  $('modalHost').innerHTML = '';
}

function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function load(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }

var STATUS_UR = {
  'Pending Shop': 'دکاندار کی تصدیق باقی', 'Shop Received': 'گاہک کی تصدیق باقی', 'Confirmed': 'دونوں طرف سے کنفرم',
  'Rejected': 'مسترد', 'Active': 'جاری', 'Completed': 'مکمل ادا', 'Good': 'اچھا گاہک', 'Late': 'لیٹ',
  'Defaulter': 'نادہندہ', 'New': 'نیا', 'Due': 'باقی', 'Partial': 'ادھوری', 'Paid': 'ادا', 'Overdue': 'لیٹ',
  'Pending': 'منظوری باقی', 'Approved': 'منظور شدہ'
};
function badge(s) { return '<span class="badge b-' + String(s).replace(/\s/g, '') + '">' + esc(STATUS_UR[s] || s) + '</span>'; }

function waNum(m) {
  var s = String(m || '').replace(/\D/g, '');
  if (s.indexOf('0') === 0) s = '92' + s.substring(1);
  return s;
}
function waLink(num, msg) { return 'https://wa.me/' + encodeURIComponent(num || '') + '?text=' + encodeURIComponent(msg); }
function portalUrl() { return new URL('portal.html', location.href).href.split('?')[0]; }

// ---------- Server call ----------
function api(fn, args, quiet) {
  if (!window.MHM_API || window.MHM_API.indexOf('http') !== 0) {
    toast('config.js میں Web App کا لنک نہیں ڈالا گیا', true);
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
    .catch(function (e) {
      busy(false);
      throw e;
    });
}

var ERR_UR = {
  WRONG_PASSWORD: 'پاس ورڈ غلط ہے', NOT_REGISTERED: 'اس نمبر سے ابھی لاگ ان کی درخواست نہیں دی گئی',
  PENDING: 'آپ کی درخواست ابھی منظوری کے لیے زیر غور ہے', REJECTED: 'آپ کی درخواست منظور نہیں ہوئی، دکان سے رابطہ کریں',
  WRONG_PIN: 'PIN غلط ہے', INVALID_MOBILE: 'موبائل نمبر درست لکھیں (11 ہندسے)', INVALID_PIN: 'PIN صرف 4 ہندسوں کا ہو',
  TERMS_REQUIRED: 'شرائط سے اتفاق ضروری ہے', NO_CUSTOMER: 'اس نمبر پر کوئی کسٹمر رجسٹر نہیں، دکان سے رابطہ کریں',
  ALREADY_APPROVED: 'آپ کا لاگ ان پہلے سے منظور ہے، لاگ ان کریں', NO_API: 'سیٹنگ مکمل نہیں',
  'Failed to fetch': 'انٹرنیٹ کا مسئلہ، دوبارہ کوشش کریں'
};
function errMsg(e) { var m = String(e && e.message || e); return ERR_UR[m] || ('مسئلہ: ' + m); }
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

// ---------- Receipt image ----------
function receiptHtml(info) {
  var p = info.payment, d = info.deal, c = info.customer, shop = info.shop || {};
  var hist = (d.payments || []).filter(function (x) { return x.status === 'Shop Received' || x.status === 'Confirmed'; }).slice().reverse();
  var rows = hist.map(function (x, i) {
    var cur = x.receiptNo === p.receiptNo;
    return '<tr' + (cur ? ' style="background:#fff6dc;font-weight:700"' : '') + '><td style="font-family:Poppins,Arial">' + (i + 1) +
      '</td><td style="font-family:Poppins,Arial;direction:ltr">' + esc(x.receiptNo) + '</td><td style="font-family:Poppins,Arial;direction:ltr">' +
      esc((x.shopConfirmedAt || x.date).split(' ')[0]) + '</td><td style="font-family:Poppins,Arial;direction:ltr">' + money(x.amount) + '</td></tr>';
  }).join('');
  return '<div class="rcpt">' +
    '<img class="rcpt-lh" src="lh-header.jpg"><div class="rcpt-title">قسط کی رسید</div>' +
    '<div class="rcpt-body">' +
    '<div class="row"><span>گاہک</span><b>' + esc(c.name) + '</b></div>' +
    '<div class="row"><span>اکاؤنٹ نمبر</span><b style="font-family:Poppins,Arial">' + esc(d.accountNo) + '</b></div>' +
    '<div class="row"><span>پراڈکٹ</span><span>' + esc(d.itemType + ' - ' + d.company + ' ' + d.model) + '</span></div>' +
    '<div class="rcpt-amt"><span>اس قسط کی رقم</span><b>' + money(p.amount) + '</b><span style="font-family:Poppins,Arial;font-size:11px">' +
    esc(p.receiptNo) + ' | ' + esc(p.shopConfirmedAt || p.date) + '</span></div>' +
    '<div class="rcpt-count"><div style="background:#2f6fde">کل قسطیں<b>' + d.schedule.length + '</b></div>' +
    '<div style="background:#1f9d55">ادا شدہ<b>' + d.paidCount + '</b></div>' +
    '<div style="background:#e8890c">باقی<b>' + d.remainingCount + '</b></div></div>' +
    '<div style="font-weight:700;color:#0a1f44">اب تک کی تمام ادائیگیاں</div>' +
    '<table><tr><th>#</th><th>رسید</th><th>تاریخ</th><th>رقم</th></tr>' + rows + '</table>' +
    '<div class="row" style="margin-top:6px"><span>کل قیمت</span><b style="font-family:Poppins,Arial">' + money(d.totalPrice) + '</b></div>' +
    '<div class="row"><span>ایڈوانس</span><span style="font-family:Poppins,Arial">' + money(d.advance) + '</span></div>' +
    '<div class="row"><span>کل ادا شدہ</span><b style="font-family:Poppins,Arial;color:#1f9d55">' + money(d.totalPaid) + '</b></div>' +
    '<div class="row"><span>بقایا</span><b style="font-family:Poppins,Arial;color:#d64545">' + money(d.balance) + '</b></div>' +
    '<p style="text-align:center;color:#0a1f44;margin:6px 0 0">شکریہ — ' + esc(shop.shopName || 'MHM Electronics') + '</p>' +
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
  var run = function () {
    return htmlToImage.toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true });
  };
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
    toast('رسید کی تصویر ڈاؤن لوڈ ہو گئی');
  }).catch(function (e) { busy(false); fail(e); });
}

// ---------- Printable agreement ----------
function printAgreement(c, d, shopName) {
  var w = window.open('', '_blank');
  if (!w) { toast('Pop-up کی اجازت دیں', true); return; }
  var line = function (a, b) { return '<tr><th>' + a + '</th><td>' + esc(b) + '</td></tr>'; };
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>' + esc(d.accountNo) + '</title>' +
    '<link rel="stylesheet" href="style.css"><style>body{padding:20px;background:#fff}table{margin-bottom:10px}th{width:35%}' +
    '.sig{display:flex;justify-content:space-between;margin-top:40px}.sig div{width:45%;border-top:1px solid #333;text-align:center;padding-top:4px}</style></head><body>' +
    '<img src="lh-header.jpg" style="width:100%;display:block">' +
    '<h3 style="text-align:center">قسطوں کا معاہدہ</h3><table>' +
    line('اکاؤنٹ نمبر', d.accountNo) + line('گاہک', c.name + ' ولد ' + c.fatherName) + line('شناختی کارڈ', c.cnic) +
    line('موبائل', c.mobile) + line('پراڈکٹ', d.itemType + ' - ' + d.company + ' ' + d.model + ' ' + (d.color || '')) +
    line('سیریل / IMEI', d.serial) + line('کل قیمت', money(d.totalPrice)) + line('ایڈوانس', money(d.advance)) +
    line('ماہانہ قسط', money(d.monthly) + ' x ' + d.installments) + line('پہلی قسط کی تاریخ', d.firstDue) +
    (d.chequeNo ? line('سیکیورٹی چیک', (d.chequeBank || '') + ' | چیک نمبر ' + d.chequeNo + ' | اکاؤنٹ ' + d.chequeAccount) : '') +
    '</table><h3>شرائط و ضوابط</h3>' + termsHtml() +
    '<h3>برائے دفتری استعمال</h3><p>' + esc(ackText(c, d)) + '</p>' +
    (d.ackCustomer ? '<p>✅ گاہک نے ڈیجیٹل اقرار کیا: ' + esc(d.ackCustomer) + '</p>' : '') +
    (d.ackShop ? '<p>✅ کمپنی نے تصدیق کی: ' + esc(d.ackShop) + '</p>' : '') +
    '<div class="sig"><div>دستخط درخواست دہندہ / نشان انگوٹھا</div><div>دستخط کمپنی مینیجر / نشان انگوٹھا</div></div>' +
    '<img src="lh-footer.jpg" style="width:100%;display:block;margin-top:30px">' +
    '<script>setTimeout(function(){window.print()},800)<\/script></body></html>');
  w.document.close();
}
