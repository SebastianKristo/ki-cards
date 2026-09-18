# ki-cards 3.90.0

## `ki-klima-pro-card` 2.8.0: tilstedeværelse og bortestyring

**Ny blokk øverst i Oversikt.** Er noen hjemme, ute en tur, eller borte siden helgen? Det
sto ingen steder i kortet, selv om integrasjonen skiller mellom de to siste.

Blokka leser `sensor.ki_tilstedevaerelse` (ny i KI Energi 2.20.0) og viser teksten med
farge etter alvor: grønn når noen er hjemme, gul ved kort tur, blå ved bortemodus, dempet
når tilstedeværelse er ukjent. Under står hvor lenge, og når hjemkomsten er satt til.

Ved kort tur står nedtellingen til bortemodus i teksten — «Ute en tur, 40 min —
bortemodus om 5 t 20 min». Det er det man vil vite når man er ute: hvor lang tid før huset
senker seg.

Under teksten ligger **bortestyringen**, som manglet: bryterne for bortemodus, automatisk
aktivering og hjemkomst, og de fire tallene — timer før auto, og bortetemperaturene for
panelovn, gulvvarme og bad. Trykk på et tall åpner det.

**«Helgemodus» heter «Bortemodus».** Det er samme navnebytte som i integrasjonen: på en
hytte er det ukedagene den står tom, og navnet var grunnen til at bortestyringen ikke var
å finne.

Blokka vises ikke i det hele tatt hvis sensoren mangler, så kortet fungerer uendret på en
eldre integrasjonsversjon.
