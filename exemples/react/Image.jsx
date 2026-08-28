/**
 * Un composant React de trois lignes.
 *
 * Il n'y a pas de paquet npm à installer : le script, chargé une fois dans
 * votre page, observe le DOM et prend en charge tout ce que React ajoute
 * après coup — y compris les navigations d'une application monopage.
 *
 * Ce fichier ne fait donc que donner des noms de props lisibles aux attributs.
 */
export function Image({ nom, ratio, taille, focus, immediat, alt = '', ...reste }) {
  return (
    <img
      data-dam={nom}
      data-dam-ratio={ratio}
      data-dam-taille={taille}
      data-dam-focus={focus}
      data-dam-charge={immediat ? 'immediat' : undefined}
      alt={alt}
      {...reste}
    />
  );
}

/* Utilisation :
 *
 *   <Image nom="044_32_s1" ratio="4/3" alt="Pull col roulé" />
 *   <Image nom="banniere" ratio="21/9" immediat alt="" />
 *
 * Et une seule fois, dans app/layout.jsx (Next) ou index.html (Vite) :
 *
 *   <script defer src="https://cdn.damdesk.com/damdesk.js" data-espace="votre-espace" />
 */
