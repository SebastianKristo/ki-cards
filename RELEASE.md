# ki-cards 5.5.0

## `ki-tesla-card`: vinduer på gløtt

Nytt felt `vindu`, som standard `switch.tesla_model_y_klima_climate_window_vent`. Står
den på, tegnes vinduene med en glipe og kortet får klassen `vindu`.

## Låsrettelsen måtte bæres over igjen

Også denne fila hadde `lock.folkevogn_lock` med `state === "unlocked"`, som aldri slår
til for en `on`/`off`-bryter — bilen ville vist seg som låst uansett.

Denne gangen kontrollerte jeg hver av de fire erstatningene enkeltvis i stedet for å anta
at de traff. Alle fire gjorde det: standardentiteten, utregningen, editorfeltet og
etiketten.

Det er andre gang på rad. Henter du siste versjon fra repoet før du redigerer videre,
slipper vi runden — men jeg sjekker uansett.

### Kontrollert

Låsen i fire former: `on` gir åpen, `off` gir låst, en ekte `lock.`-entitet virker, og
`laas_omvendt: false` snur tolkningen. Vindusbryteren gir klassen `vindu` og fire glipe-
elementer i tegningen. Lading, bagasjerom, frunk og defrost som før.

---

# ki-cards 5.4.0

`ki-tesla-card` med ladescene, vei og rullende hjul. Nytt kort `ki-strom-card`.
