# ki-cards 4.23.0

## `ki-varsling-card` tar også varslene fra KI Energi

Kortet leter nå i både `ki_notifications` og `ki_energi`. `plattform:` overstyrer lista.

Tre ting måtte håndteres, fordi KI Energi er bygget annerledes:

**206 entiteter på én enhet.** Bare de som handler om varsling tas med — `varsel`,
`varsler` eller `spor_` i ID-en. De øvrige 200 er styring og hører hjemme i klimakortet.
Testet med 21 styringsbrytere blandet inn: ingen av dem kom med.

**Mastermodus gjelder ikke her.** `ki_notifications` har én enhet per regel, så
hovedbryteren er den ene som betyr noe. KI Energi har alle sine på samme enhet, og de er
**sidestilte valg** — effektgrense, hjemkomst, varmtvann. Hadde mastermodus slått inn,
ville fem av seks forsvunnet.

**Navn og forklaring** for alle ni: Energivarsler, Effektgrense, Hjemkomst, Sommermodus,
Varmtvann, Håndklevarmer, Bortemodus, Spør torsdag og Spør fredag — med integrasjonens
egne ikoner.

Hovedbryteren `ki_energi_varsler` har sin egen oppføring, slik at den ikke forveksles med
`ki_varsel_effekt`. Uten den fikk den «Strømforbruk» og et søylediagram-ikon, fordi
«energi» traff gjettemønsteret for forbruk.

## Popupen har fått en Strøm-fane

Tre faner nå: Automasjoner, Push varsler og Strøm. 81 linjer, fortsatt uten en eneste
entitets-ID.

---

# ki-cards 4.22.0

Én bryter per regel fra `ki_notifications`, og navnene dine lagt inn i kortet.
