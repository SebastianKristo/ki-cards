# ki-cards 3.26.0

## Dyplenken til en fane virket fortsatt ikke

Vakten ryddet hashen riktig og sendte `ki-fane`, men hendelsen gikk ut **før** popupen
hadde rukket å bygge kortet. Det fantes ingen lytter å høre den, og fanen ble aldri valgt.
Hashen ble ryddet — derfor åpnet popupen seg — men alltid på første fane.

Fanen legges nå igjen i `KI.ventendeFane` i tillegg til å kringkastes, og kortet henter
den når det kobles til og ved første tegning. Den er gyldig i seks sekunder, så et gammelt
trykk ikke overstyrer et nytt valg, og hentes bare én gang.

`las_path: '#alarm::laser'` skal nå åpne popupen rett på Dørlåser.

## Tastaturet ruller feil vei

Forrige versjon rullet til toppen uansett, også når tastaturet foldet seg **ut** — så du
måtte bla ned for å finne sifrene.

Nå følger rullingen retningen: vokser tastaturboksen, rulles den inn i synsfeltet så
tastene ligger klare. Krymper den, altså når koden er tastet ferdig, rulles kortet tilbake
til toppen. Slås av med `rull_topp: false`.

## Profilbildene fant ikke personene

Oppslaget krevde at navnet fra ansiktssensoren var nøyaktig likt `friendly_name` på
person-entiteten. Sensoren melder fornavnet — «Rune» — mens personen ofte heter «Rune
Kristo». Ingen treff, og ikonet ble stående.

Oppslaget prøver nå i tur og orden: hele navnet, fornavnet, og entitets-ID-en, alt
sammenlignet uten store bokstaver og med ø/ö og æ/ä/å slått sammen. «Rune» treffer «Rune
Kristo», og «Cybele» treffer «Cybele Jemtland».

To nye måter å sette det selv på:

```yaml
logg:
  personer: { Rune: person.rune_kristo }    # peker på en person-entitet
  bilder:   { Rune: /local/rune.jpg }       # eller en bildeadresse rett fram
```

Har personen ikke noe bilde i Home Assistant, brukes ansiktsikonet som før — kortet kan
bare vise det som finnes.
