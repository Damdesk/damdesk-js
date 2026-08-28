/**
 * Le fichier de ce dépôt est-il bien celui que le CDN sert ?
 *
 * damdesk.js est ENGENDRÉ par le Worker, à partir des mêmes constantes que la
 * livraison : c'est ce qui garantit que les paliers connus du navigateur sont
 * exactement ceux qu'applique le serveur. La copie versionnée ici sert à
 * lire le code avant de l'embarquer sur son site — elle n'est pas la source.
 *
 * Une copie qui dérive serait pire que pas de copie du tout : on lirait une
 * chose et on exécuterait l'autre. Ce test le détecte.
 */
import fs from 'node:fs';

const URL_CDN = process.argv[2] || 'https://cdn.damdesk.com/damdesk.js';
const local = fs.readFileSync(new URL('../damdesk.js', import.meta.url), 'utf8');
const distant = await (await fetch(URL_CDN)).text();

const empreinte = async (s) => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

const [a, b] = await Promise.all([empreinte(local), empreinte(distant)]);
console.log(`  dépôt : ${a}  (${local.length} octets)`);
console.log(`  CDN   : ${b}  (${distant.length} octets)`);

if (a !== b) {
  console.error('\n  ✗ la copie du dépôt a dérivé de ce que le CDN sert.');
  console.error('    Rafraîchir :  curl -s -o damdesk.js ' + URL_CDN);
  process.exit(1);
}

// Et le contrat qui compte vraiment : les paliers doivent être là.
const paliers = /var PALIERS = (\[[^\]]+\])/.exec(distant);
if (!paliers) {
  console.error('\n  ✗ les paliers de largeur ont disparu du script.');
  process.exit(1);
}
console.log(`  paliers : ${paliers[1]}`);
console.log('\n  ✓ le dépôt et le CDN servent le même script.\n');
