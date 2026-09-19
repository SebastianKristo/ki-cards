# ki-cards 4.20.1

## `ki-varsling-card` bruker malen din, ikke min egen form

Jeg lagde en egen radform i 4.20.0. Den skulle sett ut som
`template_toggle_card_small`, og gjør det nå — målene er hentet rett fra malen i
dashbordet:

| | |
| --- | --- |
| Høyde | 66 px |
| Hjørner | 75 px |
| Rutenett | `76px 1fr min-content` |
| Navn | 16 px, vekt 500 |
| Etikett | 14 px, dekning 0,7 |
| Bryter | `mdi:toggle-switch`, 50 × 40 px |
| Av | rød flate, svart tekst og ikon |

Ikonet står i en rund flate på `rgba(var(--highlight))` som før, og bryteren til høyre er
den samme `toggle-switch`-ikonet malen bruker — ikke tekst.

## Navn og beskrivelse deles som i malen

`friendly_name` deles på et skilletegn: navnet foran, beskrivelsen bak. «Vekking - Lys og
lyd på vekketidspunkt» blir to linjer, akkurat som i dashbordet. `skille: '/'` endrer
tegnet.

Uten skilletegn faller kortet tilbake til enhetsnavnet som overskrift og resten som
beskrivelse, så «Autolås Autolås» ikke står to ganger på samme rad.

`navn:` og `undertekst:` overstyrer begge deler.

### Kontrollert

Fire navneformer: med bindestrek, uten, med enhetsnavn som prefiks, og et enkeltord.
Alle sju målene fra malen kontrollert mot den genererte CSS-en.

---

# ki-cards 4.20.0

Nytt kort `ki-varsling-card`: bryterne fra KI Varslinger og sikkerhet finnes gjennom
entitetsregisteret og grupperes per regel. `bare:`, `ekstra:`, `skjul:`, søk fra åtte
brytere, og langt trykk for å åpne entiteten.
