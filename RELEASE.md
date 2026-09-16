# ki-cards 3.71.0

## Navn under faneikonene kan slås av

Nytt valg **«Vis navn under faneikonene»** i UI-editoren, i både `ki-vanning-card` og
`ki-klima-pro-card`. Slår du det av, står fanerada med bare ikoner uansett skjermbredde,
og fanene deler bredden likt.

Begge kortene skjulte navnene automatisk under 430 px fra før. Nå kan du velge det også på
brede skjermer — nyttig når kortet står i en smal kolonne, eller når du bare vil ha mindre
tekst.

`vis_fanenavn: false` i YAML gjør det samme. Standardverdien legges inn i editorens data,
så bryteren viser riktig stilling fra første åpning i stedet for å stå av mens navnene
vises.

Vanningskortets editor har samtidig fått **«Dager i historikkfanen»**, som bare fantes i
YAML.

## `ki-vann-card` 1.1.0: fordelingsbåndet

Båndet under vannheroen var én sammenhengende stolpe der segmentene gikk rett i
hverandre. Med seks kategorier i beslektede blå- og grønntoner var det vanskelig å se hvor
én slutter og den neste begynner, og en andel på fem prosent ble en stripe uten form.

Hvert segment er nå en egen avrundet bit med 3 px luft mellom, som en rad brikker. Da
leser du antallet kategorier direkte, og små andeler har en minstebredde på 8 px så de
fortsatt er synlige. Den største biten har et svakt lysstrøk, så øyet finner den først.

Under båndet står en forklaring med farge, navn og andel for de fire største — «Dusj 46 %
· Vaskemaskin 17 % · Toalett 15 % · Oppvask 9 % · + 2 til». Før måtte du gjette hvilken
farge som var hva, eller lese hele lista under.

Den animerte heroen over er urørt.
