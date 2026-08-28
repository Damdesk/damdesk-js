<!--
  Le même principe en Vue 3. Le script observe le DOM, donc les images
  montées par Vue sont prises en charge sans rien déclarer.
-->
<script setup>
defineProps({
  nom: { type: String, required: true },
  ratio: String,
  taille: String,
  focus: String,
  immediat: Boolean,
  alt: { type: String, default: '' },
});
</script>

<template>
  <img
    :data-dam="nom"
    :data-dam-ratio="ratio"
    :data-dam-taille="taille"
    :data-dam-focus="focus"
    :data-dam-charge="immediat ? 'immediat' : undefined"
    :alt="alt"
  >
</template>

<!--
  Utilisation :
    <Image nom="044_32_s1" ratio="4/3" alt="Pull col roulé" />

  Et dans index.html, une fois :
    <script defer src="https://cdn.damdesk.com/damdesk.js" data-espace="votre-espace"></script>
-->
