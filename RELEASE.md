# ki-cards 5.15.0

## Mastermodus gjaldt feil vei

La du til en ny integrasjon i `ki-varsling-card`, falt alle bryterne fra samme enhet
sammen til én rad. KI Utelys sine tre viste seg som «KI Utelys» tre ganger.

Unntaket var hardkodet til `ki_energi`. Regelen skal være omvendt: mastermodus gir bare
mening der **én enhet er én regel**, som i `ki_notifications`. Alt annet vises som
sidestilte brytere.

Nå gjelder det enhver integrasjon du legger til, ikke bare de to jeg rakk å tenke på.

## Navn for KI Utelys

Automatikk, Morgen og Kveld, med hvert sitt ikon og en forklaring.

## Og en ting som ikke var en feil

`enheter:` er en **hviteliste** som filtrerer på regelnavn. Står det
`lås, ansikt, vekking, dørlys` der, slipper ingenting annet gjennom — heller ikke en
plattform du nettopp la til.

Legg `utelys` til i lista, eller fjern filteret:

```yaml
enheter:
  - lås
  - ansikt
  - vekking
  - dørlys
  - utelys
```

### Kontrollert

Tre plattformer samtidig gir seks rader: dørlåsen samlet til hovedbryteren, to fra KI
Energi og tre fra KI Utelys, hver med eget navn og ikon. `ki_notifications` alene gir
fortsatt én rad.

---

# ki-cards 5.14.0

`ki-utelys-card` oppdatert med fire lag i scenen og tydeligere tilstandsklasser.
