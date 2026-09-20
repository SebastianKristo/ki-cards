# ki-cards 5.18.1

## Redigereren lukket seg for hver tast

Hver tast sender en endring, Home Assistant ekkoer konfigurasjonen tilbake, og editoren
ble bygget om — med redigereren lukket. Man måtte åpne den på nytt for hver bokstav.

To ting lå bak.

### Ekkoet var ikke tegn for tegn likt

Jeg sammenlignet med `JSON.stringify`. HA kan stokke om nøkkelrekkefølgen, og da er
`{a:1,b:2}` og `{b:2,a:1}` ulike strenger selv om konfigurasjonen er den samme.

Sammenligningen sorterer nå nøklene først.

### Og redigereren skal uansett aldri bygges om

Selv med riktig sammenligning ville en ekte endring utenfra lukket den midt i arbeidet.
Er redigereren åpen, bygges editoren ikke om i det hele tatt — konfigurasjonen oppdateres
i stillhet, og alt står som det var.

Flagget nullstilles når editoren faktisk bygges om, så det kan ikke bli hengende igjen på
et element som er borte fra DOM-en.

### Kontrollert

«Hei» skrevet bokstav for bokstav, med HAs ekko mellom hver: redigereren står åpen hele
veien, og hele ordet lagres. Et ekko med omstokket nøkkelrekkefølge gir null
ombygginger.

---

# ki-cards 5.18.0

Kortdialogen erstattet med `hui-card-element-editor` brettet ut under rada.
