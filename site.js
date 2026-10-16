/* Carolina Cravens: shared behavior for index.html and es.html.
   Loaded with "defer", so it never blocks the page from showing. */
(function () {
var $ = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var conn = navigator.connection || {};
var light = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
var es = (document.documentElement.lang || 'en').slice(0, 2) === 'es';
var hasIO = 'IntersectionObserver' in window;

/* NAV: solid after scrolling, mobile menu */
var nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
if (nav) {
var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
if (toggle && links) {
var setMenu = function (open) {
links.classList.toggle('open', open); toggle.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
toggle.setAttribute('aria-label', open ? (es ? 'Cerrar menú' : 'Close menu') : (es ? 'Abrir menú' : 'Open menu'));
};
toggle.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
}

/* REVEAL ON SCROLL + COUNT-UP NUMBERS */
function countUp(el) {
var target = parseInt(el.getAttribute('data-count'), 10), suffix = el.getAttribute('data-suffix') || '';
if (reduce || isNaN(target)) { el.textContent = target + suffix; return; }
var t0 = null;
(function step(t) {
if (!t0) t0 = t;
var p = Math.min((t - t0) / 1300, 1);
el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
if (p < 1) requestAnimationFrame(step);
})(performance.now());
}
var reveals = $$('.reveal');
if (hasIO && !reduce) {
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) {
if (!en.isIntersecting) return;
en.target.classList.add('in');
$$('[data-count]', en.target).forEach(countUp);
io.unobserve(en.target);
});
}, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(function (el) { io.observe(el); });
$$('.hero-stats [data-count]').forEach(function (el) { setTimeout(function () { countUp(el); }, 900); });
} else {
reveals.forEach(function (el) { el.classList.add('in'); });
}

/* DESKTOP-ONLY EFFECTS: blend cursor, magnetic buttons, spotlight cards, portrait tilt */
if (fine && !reduce) {
var cur = $('.cursor');
if (cur) {
document.documentElement.classList.add('has-cursor');
var mx = -50, my = -50, cx = -50, cy = -50, raf = null;
var loop = function () {
cx += (mx - cx) * .2; cy += (my - cy) * .2;
cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
raf = (Math.abs(mx - cx) > .2 || Math.abs(my - cy) > .2) ? requestAnimationFrame(loop) : null;
};
document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
var big = 'a, button, .tile, .svc, .product';
document.addEventListener('mouseover', function (e) { if (e.target.closest(big)) document.documentElement.classList.add('cursor-big'); });
document.addEventListener('mouseout', function (e) {
var f = e.target.closest(big);
if (f && !(e.relatedTarget && f.contains(e.relatedTarget))) document.documentElement.classList.remove('cursor-big');
});
}
$$('.magnetic').forEach(function (b) {
b.addEventListener('mousemove', function (e) {
var r = b.getBoundingClientRect();
b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .22 + 'px,' + (e.clientY - r.top - r.height / 2) * .32 + 'px)';
});
b.addEventListener('mouseleave', function () { b.style.transform = ''; });
});
$$('.svc').forEach(function (c) {
c.addEventListener('mousemove', function (e) {
var r = c.getBoundingClientRect();
c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});
});
var stage = $('#stage');
if (stage) {
stage.addEventListener('mousemove', function (e) {
var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
stage.style.transform = 'perspective(1100px) rotateY(' + x * 7 + 'deg) rotateX(' + y * -7 + 'deg)';
});
stage.addEventListener('mouseleave', function () { stage.style.transform = ''; });
}
}

/* VIDEO: one 1.2 MB file shared by the hero and the showcase.
   Hero: desktop only, after the page loads, paused off-screen.
   Showcase: autoplays on desktop when in view; on phones it waits for a tap. */
var hero = $('#heroVideo'), show = $('#showVideo'), phone = $('#phone');
var playBtn = $('#vidPlay'), pauseBtn = $('#vidToggle');
function load(v) { if (v && !v.getAttribute('src')) v.src = v.getAttribute('data-src'); }
function safePlay(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
function watch(v, onIn) {
if (!v || !hasIO) return;
new IntersectionObserver(function (en) {
if (en[0].isIntersecting) onIn(); else if (!v.paused) v.pause();
}, { threshold: .25 }).observe(v.parentElement);
}
function playShow() {
if (!show) return;
load(show); safePlay(show); show.classList.add('on'); phone.classList.add('playing');
pauseBtn.textContent = '❚❚'; pauseBtn.setAttribute('aria-label', es ? 'Pausar el video' : 'Pause the AI video');
}
var autoOK = fine && !reduce && !light && window.innerWidth >= 900;
if (autoOK) {
var startHero = function () {
if (!hero) return;
load(hero);
hero.addEventListener('canplay', function () { hero.classList.add('on'); }, { once: true });
watch(hero, function () { safePlay(hero); });
safePlay(hero);
};
if (document.readyState === 'complete') setTimeout(startHero, 800);
else window.addEventListener('load', function () { setTimeout(startHero, 800); }, { once: true });
if (show) watch(show, function () { if (!phone.classList.contains('user-paused')) playShow(); });
}
if (playBtn) playBtn.addEventListener('click', function () { phone.classList.remove('user-paused'); playShow(); });
if (pauseBtn) pauseBtn.addEventListener('click', function () {
if (show.paused) { phone.classList.remove('user-paused'); playShow(); }
else {
show.pause(); phone.classList.add('user-paused');
pauseBtn.textContent = '▶'; pauseBtn.setAttribute('aria-label', es ? 'Reproducir el video' : 'Play the AI video');
}
});

/* SHOP FILTER (es.html): show all, Pop Mart, or Starbucks */
var filters = $$('.shop-filter button');
if (filters.length) {
filters.forEach(function (btn) {
btn.addEventListener('click', function () {
var f = btn.getAttribute('data-filter');
filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
$$('.product').forEach(function (p) { p.hidden = !(f === 'all' || p.getAttribute('data-cat') === f); });
});
});
}

/* PRODUCT PHOTOS: flip between front and side (hover on desktop, button everywhere) */
$$('.p-flip').forEach(function (b) {
b.addEventListener('click', function () {
var on = b.parentElement.classList.toggle('show-alt');
b.setAttribute('aria-pressed', on ? 'true' : 'false');
});
});

/* LANGUAGE SWITCHER: Google's ~150 KB script loads only when someone reaches for it */
var langBtn = $('#ccLangBtn'), started = false;
window.googleTranslateElementInit = function () {
new google.translate.TranslateElement({ pageLanguage: es ? 'es' : 'en', autoDisplay: false, layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
};
function startTranslate() {
if (started) return; started = true;
if (langBtn) { langBtn.textContent = es ? 'Cargando…' : 'Loading…'; langBtn.disabled = true; }
var s = document.createElement('script');
s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
document.body.appendChild(s);
}
if (langBtn) {
langBtn.addEventListener('click', startTranslate);
langBtn.addEventListener('focus', startTranslate);
langBtn.addEventListener('pointerenter', startTranslate);
}
if (document.cookie.indexOf('googtrans=') > -1) startTranslate();
})();
