# ki-cards 3.60.1

## `examples/soppel-popup.yaml`: flisene har fått ikonet tilbake

Søppelflisene hadde `icon: null`, så det runde ikonfeltet med bakgrunn sto tomt. De var
dermed de eneste flisene i dashbordet uten det trekket.

Ikonet er tilbake, med fraksjonen kjent igjen på navnet: avispapir for papir og papp,
resirkuleringssymbol for plast, flaske for glass og metall, eple for matavfall, blad for
hageavfall, og søppelbøtte for restavfall. Ikon og felt får fraksjonens farge — papir
blått, plast lilla, glass og metall grønt, restavfall grått.

**Tømmes fraksjonen i dag**, får hele flisen fraksjonens farge, slik de andre flisene
dine gjør for aktiv tilstand. Da byttes ikonet og teksten til mørkt — et blått ikon på
blå bakgrunn er usynlig, og det var den ene feilen som lett kunne blitt stående.

Alt annet er uendret: `template_sensor_big_alt`, to kolonner, `text_sub` med
`friendly_name`, `text_alt` med datoen, sortering på `days_to_pickup`. Den animerte
heroen ligger fortsatt over.

Alle åtte JavaScript-blokkene er kjørt gjennom med fraksjoner på 0, 1, 5 og 26 dager.
