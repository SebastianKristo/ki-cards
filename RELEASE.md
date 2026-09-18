# ki-cards 3.97.0

## `ki-basseng-card` 1.7.0

### Effekt, pumpetid og spart i dag på én flate

De tre tallene lå i tre løse bokser med mellomrom. Det leste som tre uavhengige ting,
mens det er **ett regnskap for dagen**: hvor mye pumpa har gått, hva den trekker nå, og
hva automatikken har spart.

Nå ligger de på én flate med hårfine 1 px skiller mellom cellene — ikke mellomrom mellom
bokser. Hver celle har lite ikon, etiketten i små bokstaver, og verdien stor med enheten
dempet ved siden av.

Sparingen er den interessante av de tre, så den får grønn verdi når det faktisk er spart
noe. Står den på null, er den nøytral — en grønn null er ingen god nyhet.

`.tall`, `.tall-verdi`, `.tall-tekst` og `.tallrad` er slettet; ingen mal viste til dem
lenger.

### Grafene er av som standard

Temperaturgrafen og arbeidsgrafen sa mindre enn de tok av plass. Koden står, og
`graf: true` skrur dem på igjen.

## `examples/basseng-popup.yaml`

Ikonraden med lys, pumpe, varmepumpe, stillemodus og stikkontakt er flyttet **opp**, rett
under bannerne og over kortet. Det er knappene man åpner popupen for, og de sto nederst
etter hele kortet.

Bannerne deler nå ett YAML-anker for stilen, så de 24 linjene som var duplisert er én
blokk.
