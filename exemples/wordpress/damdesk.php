<?php
/**
 * DAMDesk pour WordPress — à coller dans functions.php.
 *
 * Deux choses : charger le script, et fournir un code court pour poser une
 * image sans écrire de HTML.
 */

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'damdesk',
        'https://cdn.damdesk.com/damdesk.js',
        [], null, [ 'strategy' => 'defer', 'in_footer' => false ]
    );
} );

// wp_enqueue_script ne pose pas d'attributs data- : on les ajoute à la volée.
add_filter( 'script_loader_tag', function ( $tag, $handle ) {
    if ( 'damdesk' !== $handle ) {
        return $tag;
    }
    return str_replace( ' src=', ' data-espace="votre-espace" src=', $tag );
}, 10, 2 );

/**
 * [damdesk nom="044_32_s1" ratio="4/3" alt="Pull col roulé"]
 */
add_shortcode( 'damdesk', function ( $a ) {
    $a = shortcode_atts( [
        'nom'    => '',
        'ratio'  => '',
        'taille' => '',
        'focus'  => '',
        'alt'    => '',
        'class'  => '',
    ], $a );

    if ( ! $a['nom'] ) {
        return '';
    }

    $attrs = [ 'data-dam' => $a['nom'], 'alt' => $a['alt'] ];
    foreach ( [ 'ratio', 'taille', 'focus' ] as $cle ) {
        if ( $a[ $cle ] ) {
            $attrs[ 'data-dam-' . $cle ] = $a[ $cle ];
        }
    }
    if ( $a['class'] ) {
        $attrs['class'] = $a['class'];
    }

    $html = '<img';
    foreach ( $attrs as $k => $v ) {
        $html .= sprintf( ' %s="%s"', $k, esc_attr( $v ) );
    }
    return $html . '>';
} );
