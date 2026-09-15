# ki-cards 3.53.0

## Editoren dekker nå det som bare fantes i YAML

Tre ting i en vanlig `ki-hjem-card`-konfigurasjon kunne ikke røres fra grensesnittet i det
hele tatt.

**Swipe-grupper i `hjem.stov`.** Et element i lista er enten en flis eller en `swipe:`-
gruppe med egne kort inni. Editoren så bare flisene, og en gruppe ble vist som en tom
«Fri flis». Nå vises gruppa som «Swipe-gruppe (2 kort)» med høyde og swipe-type som egne
felt, og kortene inni ligger under den — innrykket, med opp, ned og fjern hver for seg.
Redigerer du ett kort inni gruppa, er søsterkortene og høyden urørt.

«+ Legg til swipe-gruppe» ved siden av «+ Legg til flis».

**`aktuelt.sesong`.** Sesongflisene — jul, vanning, brøyting — fantes ikke i editoren.
Egen seksjon nå, med «Vises fra» og «Vises til» på `MM-DD`-form pluss flisens vanlige
felt. Overskriften viser perioden: «Jul (09-01 – 03-01)».

**Romfelt.** `ikon`, `temperatur` og `fuktighet` per rom manglet. De er lagt inn; tomt
ikon betyr fortsatt rommets ikon fra Home Assistant, og tomme sensorer betyr husets
fellessensorer som før.

## En feil funnet underveis

Lista for fliser og lista for sesongkort delte samme kode, og jeg brukte `skjema` både
som feltdefinisjon og som markør for «enkel liste uten grupper». Flislista fikk derfor
aldri swipe-grenen. Markøren heter nå `enkel`, og swipe-grupper vises som de skal.
