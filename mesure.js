/* Mesure d'audience de fruitradar.fr, sans cookie ni service tiers.
   Elle compte les pages vues, d'où viennent les visites, le type d'appareil, et les clics sur les boutons
   (Voir l'offre, S'abonner, Essayer, la communauté Skool…), pour le serveur FruitRadar. Détails : page Confidentialité.
   Pour qu'une personne ne compte qu'une fois, même si elle revient ou reclique, ce navigateur garde un numéro tiré au hasard
   (« fr_mesure », 13 mois au plus, jamais prolongé), qui ne sert qu'à ces statistiques.
   « Ne pas suivre » (GPC ou Do Not Track), ou le bouton « Ne plus être compté » de la page Confidentialité : rien n'est envoyé. */
(function () {
  'use strict';
  var MESURE = 'https://fruitradar-serveur.pages.dev/mesure', CLE = 'fr_mesure', VIE = 395 * 864e5; // 13 mois
  var nav = navigator, ua = nav.userAgent || '';
  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }

  /* Le bouton « Ne plus être compté sur ce navigateur » (page Confidentialité) : marche même quand la mesure est déjà coupée */
  function etatBouton() {
    var b = document.querySelector('[data-mesure-stop]'), m = document.querySelector('[data-mesure-etat]');
    if (!b || !m) return;
    var non = lire() === 'non';
    b.hidden = non;
    m.textContent = non ? 'Ce navigateur n\'est plus compté. Pour être de nouveau compté, efface les données du site fruitradar.fr dans ton navigateur.' : '';
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-mesure-stop]') : null;
    if (!b) return;
    try { localStorage.setItem(CLE, 'non'); } catch (x) { /* stockage bloqué : rien n'est gardé, donc rien n'est relié */ }
    etatBouton();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', etatBouton); else etatBouton();

  if (nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1' || lire() === 'non') return;
  if (nav.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(ua)) return;

  /* Le numéro de ce navigateur : tiré au hasard la première fois, gardé 13 mois au plus (pas prolongé par les visites) */
  var numero = '';
  try {
    var s = JSON.parse(lire() || 'null'), t = Date.now();
    if (!s || !/^[0-9a-f]{32}$/.test(s.id) || !(t - s.cree >= 0 && t - s.cree < VIE)) {
      var a = new Uint8Array(16); crypto.getRandomValues(a);
      s = { id: Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''), cree: t };
      localStorage.setItem(CLE, JSON.stringify(s));
    }
    numero = s.id;
  } catch (e) { numero = ''; } // stockage bloqué : le serveur compte alors la personne une fois par jour

  var PAGES = { '': 'accueil', 'index.html': 'accueil', 'installer.html': 'installer', 'essai.html': 'essai', 'retrouver.html': 'retrouver',
    'conditions.html': 'conditions', 'confidentialite.html': 'confidentialite', 'utilisation.html': 'utilisation' };
  var page = PAGES[location.pathname.split('/').pop()] || 'autre';

  function envoyer(o) {
    o.p = page;
    if (numero) o.v = numero;
    var corps = JSON.stringify(o);
    try { if (nav.sendBeacon && nav.sendBeacon(MESURE, new Blob([corps], { type: 'text/plain' }))) return; } catch (e) { /* on essaie autrement */ }
    try { fetch(MESURE, { method: 'POST', body: corps, keepalive: true, mode: 'no-cors', credentials: 'omit' }); } catch (e) { /* tant pis : une mesure perdue */ }
  }

  /* Les applis qui ouvrent les liens dans leur propre navigateur (TikTok, Instagram…) ne disent pas toujours d'où on vient */
  var appli = /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? 'tiktok' : /Instagram/.test(ua) ? 'instagram'
    : /FBAN|FBAV|FB_IAB/.test(ua) ? 'facebook' : /Snapchat/i.test(ua) ? 'snapchat' : '';

  /* D'où vient la visite : un lien suivi (?s=bio-tiktok), sinon le site d'avant, sinon l'appli, sinon « direct ». Vide : on navigue dans le site. */
  function source() {
    var m = /[?&](?:s|utm_source)=([^&#]{1,40})/.exec(location.search);
    if (m) { try { return 'utm:' + decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return 'utm:' + m[1]; } }
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { ref = ''; }
    if (/(^|\.)fruitradar\.(fr|github\.io)$/.test(ref)) return '';
    if (!ref) return appli || 'direct';
    var T = [[/(^|\.)tiktok\.com$/, 'tiktok'], [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
      [/(^|\.)snapchat\.com$/, 'snapchat'], [/(^|\.)(facebook\.com|fb\.com|messenger\.com)$/, 'facebook'], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'],
      [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/(^|\.)duckduckgo\.com$/, 'duckduckgo'], [/(^|\.)qwant\.com$/, 'qwant'],
      [/(^|\.)ecosia\.org$/, 'ecosia'], [/(^|\.)yahoo\./, 'yahoo'], [/(^|\.)skool\.com$/, 'skool'], [/(^|\.)(linktr\.ee|linktree\.com)$/, 'linktree'],
      [/(^|\.)discord(app)?\.com$/, 'discord'], [/(^|\.)reddit\.com$/, 'reddit'], [/(^|\.)pinterest\./, 'pinterest'], [/(^|\.)whatsapp\.com$/, 'whatsapp'],
      [/(^|\.)(telegram\.org|t\.me)$/, 'telegram'], [/(^|\.)linkedin\.com$/, 'linkedin'], [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt']];
    for (var i = 0; i < T.length; i++) if (T[i][0].test(ref)) return T[i][1];
    return appli || 'autre-site';
  }

  var ipad = /Macintosh/.test(ua) && nav.maxTouchPoints > 1;
  var appareil = /iPad|Tablet|PlayBook|Silk/i.test(ua) || ipad || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablette'
    : /Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(ua) ? 'mobile' : 'ordinateur';
  var navigateur = appli || (/Edg(e|A|iOS)?\//.test(ua) ? 'edge' : /OPR\/|Opera/.test(ua) ? 'opera' : /SamsungBrowser/.test(ua) ? 'samsung'
    : nav.brave ? 'brave' : /Firefox|FxiOS/.test(ua) ? 'firefox' : /Chrome|CriOS/.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'autre');
  var systeme = /Windows/.test(ua) ? 'windows' : /iPhone|iPad|iPod/.test(ua) || ipad ? 'ios' : /Mac OS X|Macintosh/.test(ua) ? 'macos'
    : /CrOS/.test(ua) ? 'chromeos' : /Android/.test(ua) ? 'android' : /Linux/.test(ua) ? 'linux' : 'autre';

  envoyer({ t: 'vue', src: source(), a: appareil, n: navigateur, o: systeme, l: String(nav.language || '').slice(0, 2).toLowerCase() });

  /* Les clics qui comptent : le nom vient de data-stat, sinon de l'adresse du lien */
  function nomClic(el) {
    if (el.getAttribute('data-stat')) return el.getAttribute('data-stat');
    if (el.hasAttribute('data-copie')) return 'copier-adresse';
    if (el.matches('.fleche, #points button')) return 'coulisses';
    var h = el.getAttribute('href') || '';
    if (!h) return '';
    if (/skool\.com/.test(h)) return 'skool';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/tiktok\.com/.test(h)) return 'tiktok';
    if (/^mailto:|mail\.google\.com/.test(h)) return 'contact';
    if (/\/acheter\b/.test(h)) return 'paiement';
    if (/\.zip(\?|$)/.test(h)) return 'telechargement';
    if (/google\.com\/chrome/.test(h)) return 'chrome';
    if (/installer\.html\?choix=essai/.test(h)) return 'essayer';
    if (/^installer\.html$/.test(h) && page === 'accueil') return 'abonner';
    if (/^essai\.html/.test(h) && el.hasAttribute('data-choix')) return 'choix-essai';
    if (h === '#prix') return 'offre';
    if (/^retrouver\.html/.test(h)) return 'cle-perdue';
    if (/^#(videos|skool|generique)$/.test(h)) return 'menu-' + h.slice(1);
    if (/^(conditions|confidentialite|utilisation)\.html/.test(h)) return 'legal';
    return '';
  }
  var une = {}; // défiler les captures : compté une fois par page
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
    var c = el ? nomClic(el) : '';
    if (!c || (c === 'coulisses' && une[c])) return;
    une[c] = 1;
    envoyer({ t: 'clic', c: c });
  }, true);
  document.addEventListener('submit', function (e) {
    var id = e.target && e.target.id;
    if (id === 'formEssai' || id === 'formCle') envoyer({ t: 'clic', c: id === 'formEssai' ? 'form-essai' : 'form-cle' });
  }, true);

  /* Les sections de l'accueil vraiment vues (au moins un quart à l'écran) */
  if ('IntersectionObserver' in window) {
    var vues = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        var id = x.target.id;
        if (!x.isIntersecting || vues[id]) return;
        vues[id] = 1; io.unobserve(x.target); envoyer({ t: 'section', s: id });
      });
    }, { threshold: 0.25 });
    ['generique', 'videos', 'coulisses', 'skool', 'prix'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* Au départ (ou au changement d'onglet) : le temps passé sur la page, et jusqu'où elle a été lue */
  var visible = 0, depuis = document.visibilityState === 'visible' ? Date.now() : 0, lu = 0, fini = false;
  function mesurerLecture() {
    var d = document.documentElement, h = Math.max(1, d.scrollHeight);
    lu = Math.max(lu, ((window.scrollY || d.scrollTop) + window.innerHeight) / h);
  }
  function finir() {
    if (fini) return;
    fini = true;
    if (depuis) visible += Date.now() - depuis;
    var s = visible / 1000;
    var d = s < 10 ? '0-10s' : s < 30 ? '10-30s' : s < 60 ? '30s-1min' : s < 180 ? '1-3min' : s < 600 ? '3-10min' : '10min+';
    var o = { t: 'fin', d: d };
    if (page === 'accueil') { mesurerLecture(); o.sc = lu >= 0.95 ? '100' : lu >= 0.75 ? '75' : lu >= 0.5 ? '50' : lu >= 0.25 ? '25' : ''; }
    envoyer(o);
  }
  addEventListener('scroll', mesurerLecture, { passive: true });
  addEventListener('load', mesurerLecture);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') finir(); else if (!fini) depuis = Date.now();
  });
  addEventListener('pagehide', finir);
})();
