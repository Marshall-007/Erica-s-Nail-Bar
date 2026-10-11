/* ===========================================================================
   Erica's Nail Bar, main.js
   Vanilla JS, no dependencies. Everything degrades gracefully.
   =========================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     ONLINE BOOKING (Cal.com)
     Paste your Cal.com link between the quotes below and every "Pick a time
     online" button switches on by itself. Leave it empty and the site simply
     keeps booking through WhatsApp.
       e.g. var CAL_LINK = 'https://cal.com/ericasnailbar/gel-x-set';
     ------------------------------------------------------------------------- */
  var CAL_LINK = 'https://cal.com/enb24';

  var WA   = 'https://wa.me/27720806146';
  var $    = function (s, c) { return (c || document).querySelector(s); };
  var $$   = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     The work: read straight off the cards in index.html so the markup is
     the single source of truth (good for SEO, and it still renders without
     JS). Every image was made at Erica's Nail Bar.
     ------------------------------------------------------------------- */
  var LOOKS = Array.prototype.map.call(
    document.querySelectorAll('#reel .reel-card'),
    function (card, i) {
      // Index comes from DOM order, so cards can be reordered or inserted
      // without any hand-kept numbering falling out of step.
      card.setAttribute('data-i', i);
      return {
        f: card.getAttribute('data-file'),
        n: card.getAttribute('data-name'),
        d: (card.querySelector('.reel-body p') || {}).textContent || '',
        t: (card.getAttribute('data-tags') || '').split('|').filter(Boolean),
        from: parseInt(card.getAttribute('data-from'), 10) || 0,
        // further angles of the same set, shown in the scrolling band
        alts: (card.getAttribute('data-alt-files') || '').split('|').filter(Boolean)
      };
    }
  );

  // Every photo we hold, each tagged with the look it belongs to.
  var PHOTOS = [];
  LOOKS.forEach(function (l, i) {
    PHOTOS.push({ i: i, f: l.f, look: l });
    l.alts.forEach(function (f) { PHOTOS.push({ i: i, f: f, look: l }); });
  });

  /* ------------------------------------------------------------- helpers */
  // <picture> so browsers without WebP still get a JPEG.
  function img(file, look) {
    var base = 'assets/img/' + file;
    return '<picture>' +
             '<source type="image/webp" srcset="' + base + '-640.webp">' +
             '<img src="' + base + '-640.jpg" alt="' + look.n + '. ' + look.d + '" ' +
                  'loading="lazy" decoding="async" width="640" height="800">' +
           '</picture>';
  }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function money(n) { return 'R' + (n % 1 === 0 ? n : n.toFixed(2)); }

  /* ------------------------------------------------------- header + rail */
  var header = $('#siteHeader');
  var bar    = $('.scroll-progress i');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    header.classList.toggle('stuck', y > 40);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* --------------------------------------------------------- mobile menu */
  var burger = $('#burger'), menu = $('#mobileMenu'), lastFocus = null;
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      lastFocus = document.activeElement;
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      // Move focus into the dialog without painting a ring on the first link.
      menu.setAttribute('tabindex', '-1');
      setTimeout(function () { menu.focus({ preventScroll: true }); }, 220);
    } else {
      menu.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { menu.hidden = true; }, 420);
      if (lastFocus) lastFocus.focus();
    }
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('#mobileMenu a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* --------------------------------------------------------- reveal-in */
  var revealables = $$('.reveal');
  function showAll() { revealables.forEach(function (el) { el.classList.add('in'); }); }

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });

    // Failsafe: anything already on screen after 1.6s gets shown regardless,
    // so a stalled observer can never leave the page blank.
    setTimeout(function () {
      revealables.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 1600);
  } else {
    showAll();
  }

  /* ---------------------------------------------------------- sparkles */
  var sp = $('.sparkles');
  if (sp && !reduce) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.style.setProperty('--s', rand(6, 15).toFixed(1) + 'px');
      s.style.setProperty('--dur', rand(3.4, 7.5).toFixed(2) + 's');
      s.style.setProperty('--del', rand(0, 6).toFixed(2) + 's');
      s.style.left = rand(4, 94).toFixed(2) + '%';
      s.style.top  = rand(6, 78).toFixed(2) + '%';
      frag.appendChild(s);
    }
    sp.appendChild(frag);
  }

  /* ---------------------------------------------------------- marquee */
  var rows = $$('.marquee-row');
  // Deal the photos alternately so the two rows never show the same set
  // side by side, and so extra angles are spread across both.
  var sets = [[], []];
  PHOTOS.forEach(function (p, n) { sets[n % 2].push(p); });

  rows.forEach(function (row, ri) {
    var track = $('.marquee-track', row);
    var items = sets[ri] || PHOTOS;
    var html = items.map(function (p) {
      return '<figure data-i="' + p.i + '" data-file="' + p.f + '" tabindex="0" role="button" ' +
             'aria-label="View ' + p.look.n + '">' + img(p.f, p.look) + '</figure>';
    }).join('');
    track.innerHTML = html + html;              // duplicate for a seamless loop

    if (!reduce) {
      // Duration derived from real width so every row scrolls at one speed.
      var speed = parseFloat(row.getAttribute('data-speed')) || 55;   // px / second
      var setDur = function () {
        var w = track.scrollWidth / 2;
        if (w > 0) track.style.animation = 'marq ' + (w / speed) + 's linear infinite' + (row.classList.contains('rev') ? ' reverse' : '');
      };
      if (document.readyState === 'complete') setDur();
      else window.addEventListener('load', setDur);
      setTimeout(setDur, 400);
      window.addEventListener('resize', function () { clearTimeout(row._t); row._t = setTimeout(setDur, 250); });
    }
  });

  /* ------------------------------------------------------------- reel */
  var reel = $('#reel'), dots = $('#reelDots');

  dots.innerHTML = LOOKS.map(function (l, i) {
    return '<button role="tab" aria-selected="' + (i === 0) + '" aria-label="Go to ' + l.n + '"></button>';
  }).join('');
  var dotEls = $$('button', dots);
  var cards  = $$('.reel-card', reel);

  function cardStep() {
    if (cards.length < 2) return reel.clientWidth;
    return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  }
  function activeIndex() {
    var step = cardStep() || 1;
    return Math.max(0, Math.min(cards.length - 1, Math.round(reel.scrollLeft / step)));
  }
  var rTick = false;
  reel.addEventListener('scroll', function () {
    if (rTick) return;
    rTick = true;
    window.requestAnimationFrame(function () {
      var a = activeIndex();
      dotEls.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === a)); });
      rTick = false;
    });
  }, { passive: true });

  function scrollToCard(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    reel.scrollTo({ left: i * cardStep(), behavior: reduce ? 'auto' : 'smooth' });
  }
  $('#reelPrev').addEventListener('click', function () { scrollToCard(activeIndex() - 1); });
  $('#reelNext').addEventListener('click', function () { scrollToCard(activeIndex() + 1); });
  dotEls.forEach(function (d, i) { d.addEventListener('click', function () { scrollToCard(i); }); });
  reel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToCard(activeIndex() + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollToCard(activeIndex() - 1); }
  });

  /* --------------------------------------------------------- lightbox */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'),
      lbMeta = $('#lbMeta'), lbBook = $('#lbBook');
  var lbIndex = 0, lbLast = null;

  // `file` shows the exact photo that was clicked; without it the set's
  // main photo is used, which is what the arrows step through.
  function openLB(i, file) {
    lbIndex = (i + LOOKS.length) % LOOKS.length;
    var l = LOOKS[lbIndex];
    lbImg.src = 'assets/img/' + (file || l.f) + '-1100.jpg';
    lbImg.alt = l.n + '. ' + l.d;
    lbTitle.textContent = l.n;
    lbMeta.textContent = l.t.join(' · ') + ' · from ' + money(l.from) + ' + art & charms';
    lbBook.href = WA + '?text=' + encodeURIComponent(
      "Hi Erica, I love the \"" + l.n + "\" set on your website. I'd like to book something similar."
    );
    if (lb.hidden) {
      lbLast = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      lb.setAttribute('tabindex', '-1');
      lb.focus({ preventScroll: true });
    }
  }
  function closeLB() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 320);
    if (lbLast) lbLast.focus();
  }
  function openFrom(el) {
    var i = parseInt(el.getAttribute('data-i'), 10);
    if (!isNaN(i)) openLB(i, el.getAttribute('data-file'));
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.marquee figure, .reel-card');
    if (t) openFrom(t);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest && e.target.closest('.marquee figure, .reel-card');
    if (t) { e.preventDefault(); openFrom(t); }
  });
  $('#lbClose').addEventListener('click', closeLB);
  $('#lbPrev').addEventListener('click', function () { openLB(lbIndex - 1); });
  $('#lbNext').addEventListener('click', function () { openLB(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowRight') openLB(lbIndex + 1);
    if (e.key === 'ArrowLeft')  openLB(lbIndex - 1);
  });
  // swipe
  var tx = 0, ty = 0;
  lb.addEventListener('touchstart', function (e) {
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) openLB(lbIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLB();
  }, { passive: true });

  /* ----------------------------------------------------- price builder */
  var state = { base: { label: "Gel X Plain Set", price: 150 }, art: {}, charm: {} };

  $$('.stepper').forEach(function (row) {
    var name  = row.getAttribute('data-name');
    var price = parseInt(row.getAttribute('data-price'), 10);
    var group = row.parentNode.getAttribute('data-group');
    row.innerHTML =
      '<span class="s-name">' + name + '</span>' +
      '<span class="s-price">' + money(price) + '</span>' +
      '<span class="s-ctrl">' +
        '<button class="s-btn minus" type="button" aria-label="Remove one ' + name + '" disabled>−</button>' +
        '<span class="s-qty" aria-live="polite" aria-label="' + name + ' quantity">0</span>' +
        '<button class="s-btn plus" type="button" aria-label="Add one ' + name + '">+</button>' +
      '</span>';

    var qtyEl = $('.s-qty', row), minus = $('.minus', row), plus = $('.plus', row);
    function set(q) {
      q = Math.max(0, Math.min(20, q));
      qtyEl.textContent = q;
      minus.disabled = q === 0;
      row.classList.toggle('active', q > 0);
      if (q === 0) delete state[group][name];
      else state[group][name] = { q: q, price: price };
      recalc();
    }
    plus.addEventListener('click',  function () { set(parseInt(qtyEl.textContent, 10) + 1); });
    minus.addEventListener('click', function () { set(parseInt(qtyEl.textContent, 10) - 1); });
  });

  $$('input[name="base"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.base = { label: r.getAttribute('data-label'), price: parseInt(r.value, 10) };
      recalc();
    });
  });

  function listOf(group) {
    return Object.keys(state[group]).map(function (k) {
      var it = state[group][k];
      return { name: k, q: it.q, sum: it.q * it.price };
    });
  }
  function recalc() {
    var art = listOf('art'), charm = listOf('charm');
    var extras = art.concat(charm);
    var extraSum = extras.reduce(function (a, b) { return a + b.sum; }, 0);
    var total = state.base.price + extraSum;

    $('#sumBase').textContent  = state.base.label + ' · ' + money(state.base.price);
    $('#sumExtras').textContent = extras.length
      ? extras.map(function (e) { return e.name + ' ×' + e.q; }).join(', ')
      : 'None yet';
    $('#sumTotal').textContent   = money(total);
    $('#sumDeposit').textContent = money(total / 2);

    var msg = "Hi Erica, I'd like to book this set 💅\n\n" +
              "Base: " + state.base.label + " (" + money(state.base.price) + ")\n" +
              (art.length   ? "Nail art: " + art.map(function (e) { return e.name + ' ×' + e.q + ' (' + money(e.sum) + ')'; }).join(', ') + "\n" : '') +
              (charm.length ? "Charms: "   + charm.map(function (e) { return e.name + ' ×' + e.q + ' (' + money(e.sum) + ')'; }).join(', ') + "\n" : '') +
              "\nEstimated total: " + money(total) +
              "\nDeposit (50%): " + money(total / 2) +
              "\n\nMy name and surname: ";
    $('#builderSend').href = WA + '?text=' + encodeURIComponent(msg);
  }
  recalc();

  /* -------------------------------------------------------------- share */
  var shareBtn = $('#shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var data = {
        title: "Erica's Nail Bar",
        text: "Elegant nails, affordable luxury. Gel X, nail art and gel toes in Ga-rankuwa View, Pretoria.",
        url: location.href
      };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          var old = shareBtn.textContent;
          shareBtn.textContent = 'Link copied ✓';
          setTimeout(function () { shareBtn.textContent = old; }, 2200);
        });
      }
    });
  }

  /* ------------------------------------------------- online booking link */
  $$('[data-cal]').forEach(function (el) {
    var fallback = el.getAttribute('data-cal-fallback');
    if (CAL_LINK) {
      el.href = CAL_LINK;
      el.hidden = false;                 // reveal the optional buttons
    } else if (fallback) {
      el.href = fallback;                // always-on buttons revert to WhatsApp
    }
  });

  /* ------------------------------------------------------------ sundry */
  $('#year').textContent = new Date().getFullYear();
  $('#toTop').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  // Offline shell, only on a real server, never on file://
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
