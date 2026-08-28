/* DAMDesk — composant de diffusion. Engendré par le serveur. */
(function () {
  'use strict';
  if (window.__damdesk) return;
  window.__damdesk = 1;

  var PALIERS = [64,128,256,384,512,640,768,1024,1280,1600,2048,2560,3200];
  var RATIOS = ["1/1","4/3","3/2","16/9","21/9","3/4","2/3","9/16"];

  // Réglages, lus sur la balise <script> qui nous a chargés.
  var moi = document.currentScript || document.querySelector('script[src*="damdesk.js"]');
  var lire = function (nom, defaut) {
    var v = moi && moi.getAttribute('data-' + nom);
    return v === null || v === undefined || v === '' ? defaut : v;
  };
  var ESPACE = lire('espace', '');
  var BASE = lire('base', 'https://cdn.damdesk.com');
  var MAX_DPR = Math.max(1, parseFloat(lire('max-dpr', '2')) || 2);
  var ANTICIPATION = lire('anticipation', '25%');
  var FORMAT = lire('format', 'webp');
  var QUALITE = lire('qualite', '');
  /*
   * Développement = machine locale, ou demande explicite. On ne se fie pas à
   * un indicateur de build : le script est le même partout, c'est le contexte
   * d'exécution qui tranche.
   */
  var DIAGNOSTIC = lire('diagnostic', null) !== null
    || /^(localhost|127.0.0.1|[::1])$/.test(location.hostname)
    || /.(local|test|localhost)$/.test(location.hostname);

  /*
   * On arrondit AU-DESSUS. Servir 900 px dans une boîte de 1000 donnerait une
   * image floue, ce qu'aucun gain de poids ne rachète sur un site de marque.
   */
  var palier = function (px) {
    for (var i = 0; i < PALIERS.length; i++) if (PALIERS[i] >= px) return PALIERS[i];
    return PALIERS[PALIERS.length - 1];
  };

  var adresse = function (el, largeur) {
    var nom = el.getAttribute('data-dam') || el.getAttribute('data-dam-bg');
    var espace = el.getAttribute('data-dam-espace') || ESPACE;
    var base = /^https?:/.test(nom) ? nom
      : BASE + '/' + espace + '/' + nom.replace(/^\/+/, '');
    var p = ['w=' + largeur, 'fm=' + (el.getAttribute('data-dam-format') || FORMAT)];
    var r = el.getAttribute('data-dam-ratio');
    if (r && RATIOS.indexOf(r.replace(/[x:]/g, '/')) >= 0) p.push('ratio=' + encodeURIComponent(r));
    var f = el.getAttribute('data-dam-focus');
    if (f) p.push('focus=' + encodeURIComponent(f));
    var q = el.getAttribute('data-dam-qualite') || QUALITE;
    if (q) p.push('q=' + q);
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + p.join('&');
  };

  var largeurVoulue = function (el) {
    var boite = el.getBoundingClientRect().width
      || (el.parentElement && el.parentElement.getBoundingClientRect().width) || 0;
    // Une boîte de largeur nulle veut dire « pas encore mise en page ». On ne
    // devine pas : on attend le prochain passage du ResizeObserver.
    if (!boite) return 0;
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    return palier(Math.ceil(boite * dpr));
  };

  var charger = function (el) {
    var voulue = largeurVoulue(el);
    if (!voulue) return;
    // Jamais de retour en arrière : redescendre d'un palier coûterait une
    // requête de plus pour une image moins bonne.
    var servie = +(el.getAttribute('data-dam-servie') || 0);
    if (servie >= voulue) return;
    el.setAttribute('data-dam-servie', String(voulue));
    var url = adresse(el, voulue);

    if (el.hasAttribute('data-dam-bg')) {
      var img = new Image();
      img.onload = function () {
        el.style.backgroundImage = 'url("' + url + '")';
        el.classList.add('dam-pret');
      };
      img.onerror = function () { el.classList.add('dam-echec'); };
      img.src = url;
      return;
    }
    el.addEventListener('load', function () { el.classList.add('dam-pret'); }, { once: true });
    el.addEventListener('error', function () {
      el.classList.add('dam-echec');
      /*
       * 403 = droits expirés. Le développeur doit l'apprendre pendant qu'il
       * intègre, pas par un trou dans la page en production.
       *
       * Mais ce diagnostic coûte UNE REQUÊTE DE PLUS, puisqu'il faut relire le
       * corps que le navigateur nous cache sur une balise <img>. On ne le fait
       * donc qu'en développement, ou si le site l'a explicitement demandé.
       * Doubler chaque image cassée pour tous les visiteurs serait payer cher
       * une information qui ne s'adresse pas à eux.
       */
      if (!DIAGNOSTIC) return;
      fetch(url, { cache: 'no-store' }).then(function (r) {
        if (r.status === 403) return r.text().then(function (motif) {
          console.warn('[DAMDesk] image non servie : ' + motif, el);
        });
      }).catch(function () {});
    }, { once: true });
    el.src = url;
  };

  // ── mise en place d'un élément : réserver la place AVANT de charger
  var prepare = function (el) {
    if (el.__dam) return;
    el.__dam = 1;
    /*
     * RÉSERVER LA PLACE, sinon la page saute au chargement.
     *
     * Deux façons de connaître le rapport avant d'avoir l'image :
     *   - data-dam-ratio, quand on impose un cadre ;
     *   - data-dam-taille="2400x1600", les dimensions du fichier, que le DAM
     *     connaît et écrit dans le code à copier.
     *
     * Sans l'un des deux, on ne PEUT pas réserver : une balise <img> vide a
     * une hauteur nulle, et la page se décale quand l'image arrive. Mesuré :
     * 0,15 de décalage cumulé sur une grille de quatre colonnes, ce qui suffit
     * à faire échouer un audit de performance.
     */
    var r = el.getAttribute('data-dam-ratio');
    var taille = el.getAttribute('data-dam-taille');
    if (r) {
      var m = r.replace(/[x:]/g, '/').split('/');
      if (m.length === 2) el.style.aspectRatio = m[0] + ' / ' + m[1];
    } else if (taille) {
      var t = taille.split(/[x×*]/);
      if (t.length === 2 && +t[0] > 0 && +t[1] > 0) el.style.aspectRatio = +t[0] + ' / ' + +t[1];
    }
    var couleur = el.getAttribute('data-dam-couleur');
    if (couleur) el.style.backgroundColor = couleur;
    if (!el.hasAttribute('data-dam-bg')) {
      if (!el.getAttribute('alt')) el.setAttribute('alt', '');
      el.decoding = 'async';
    }
    observateurTaille.observe(el);
    if (el.getAttribute('data-dam-charge') === 'immediat') {
      /*
       * Une image à cadrage immédiat DOIT attendre la mise en page.
       *
       * connectedCallback d'une balise personnalisée s'exécute avant que le
       * navigateur n'ait calculé la grille qui la contient : la boîte mesure
       * alors quelques pixels, on demande le palier 64, puis le
       * redimensionnement corrige à 512. Deux requêtes pour une image, et la
       * première est facturée pour rien. Un tour de boucle d'affichage suffit
       * à ce que la largeur soit vraie.
       */
      requestAnimationFrame(function () { charger(el); });
    } else observateurVue.observe(el);
  };

  var observateurVue = new IntersectionObserver(function (entrees) {
    for (var i = 0; i < entrees.length; i++) {
      if (entrees[i].isIntersecting) {
        observateurVue.unobserve(entrees[i].target);
        charger(entrees[i].target);
      }
    }
  }, { rootMargin: ANTICIPATION });

  /*
   * Le redimensionnement fait MONTER de palier si la boîte grandit — colonne
   * qui s'élargit, orientation du téléphone, panneau qu'on replie. On temporise
   * pour ne pas tirer une requête à chaque image d'un glissement de souris.
   */
  var minuteur;
  var observateurTaille = new ResizeObserver(function (entrees) {
    clearTimeout(minuteur);
    var cibles = entrees.map(function (e) { return e.target; });
    minuteur = setTimeout(function () {
      for (var i = 0; i < cibles.length; i++) {
        if (cibles[i].getAttribute('data-dam-servie')) charger(cibles[i]);
      }
    }, 180);
  });

  var balayer = function (racine) {
    var els = (racine || document).querySelectorAll('[data-dam],[data-dam-bg]');
    for (var i = 0; i < els.length; i++) prepare(els[i]);
  };

  // Le DOM bouge : rendu côté client, contenu injecté, navigation d'un SPA.
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var ajouts = records[i].addedNodes;
      for (var j = 0; j < ajouts.length; j++) {
        if (ajouts[j].nodeType === 1) {
          if (ajouts[j].hasAttribute && (ajouts[j].hasAttribute('data-dam') || ajouts[j].hasAttribute('data-dam-bg'))) prepare(ajouts[j]);
          balayer(ajouts[j]);
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });



  // ── la feuille de style minimale : réserver la place, puis révéler
  var style = document.createElement('style');
  style.textContent =
    'img[data-dam]{opacity:0;transition:opacity .35s ease}' +
    'img[data-dam].dam-pret{opacity:1}' +
    'img[data-dam].dam-echec{opacity:1}' +
    '[data-dam-bg]{background-size:cover;background-position:center;' +
      'opacity:.999;transition:background-image .35s ease}' +
    '@media (prefers-reduced-motion:reduce){img[data-dam]{transition:none}}';
  document.head.appendChild(style);

  /*
   * ── <dam-img> : le même moteur, sous forme de balise.
   *
   * Un composant web natif plutôt qu'un paquet par framework. Vue, Svelte,
   * Angular, Astro et le HTML nu savent tous poser une balise personnalisée ;
   * écrire cinq paquets pour cinq façons de produire le même DOM serait de
   * l'entretien pur.
   *
   * En LIGHT DOM, sans Shadow : une règle img{width:100%} de la feuille de
   * style du site doit s'appliquer. Une racine d'ombre isolerait le composant
   * de la mise en page, ce qui est l'inverse du service rendu.
   */
  if (window.customElements && !customElements.get('dam-img')) {
    var ATTRS = [ 'nom', 'ratio', 'taille', 'focus', 'couleur', 'format', 'qualite', 'espace' ];
    var DamImg = function () {
      return Reflect.construct(HTMLElement, [], DamImg);
    };
    DamImg.prototype = Object.create(HTMLElement.prototype);
    DamImg.prototype.constructor = DamImg;
    Object.setPrototypeOf(DamImg, HTMLElement);

    DamImg.observedAttributes = ATTRS.concat([ 'alt', 'immediat' ]);

    DamImg.prototype.connectedCallback = function () {
      if (this.__img) return;
      var img = document.createElement('img');
      this.__img = img;
      this.__refleter();
      this.appendChild(img);
      prepare(img);
    };
    DamImg.prototype.attributeChangedCallback = function () {
      if (this.__img) this.__refleter();
    };
    DamImg.prototype.__refleter = function () {
      var img = this.__img, self = this;
      ATTRS.forEach(function (a) {
        var v = self.getAttribute(a);
        var cible = a === 'nom' ? 'data-dam' : 'data-dam-' + a;
        if (v === null) img.removeAttribute(cible);
        else img.setAttribute(cible, v);
      });
      img.setAttribute('alt', this.getAttribute('alt') || '');
      if (this.hasAttribute('immediat')) img.setAttribute('data-dam-charge', 'immediat');
      else img.removeAttribute('data-dam-charge');
    };
    customElements.define('dam-img', DamImg);
    // La balise n'a pas de style propre : c'est un conteneur transparent.
    style.textContent += 'dam-img{display:block}dam-img>img{width:100%;height:100%;display:block}';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { balayer(); });
  } else balayer();

  window.damdesk = { balayer: balayer, paliers: PALIERS, ratios: RATIOS };
})();
