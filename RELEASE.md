# ki-cards 3.62.0

## `ki-k2-card` 1.1.0

Lett hånd, som med kameraktortet — strukturen og de to visningene er uendret.

**Tittelrad med ikonfelt.** Tittelen var ren tekst i 20 px. Nå står den i en rad med
48 px rundt ikonfelt til venstre, som sikkerhets-, ruter- og kameraktortet. Ikonet kan
settes med `icon:`; standard er `mdi:printer-3d-nozzle`.

Til høyre i rada står en kort status: «Skriver ut · 64 %». Under utskrift ser du dermed
hvor det står uten å lese fremdriftsringen, og ved 0 og 100 % faller prosenten bort så
det ikke står «Skriver ut · 100 %» på en ferdig jobb.

**Mediebryteren** mellom kamera og forhåndsvisning hadde en grå flate på den valgte
halvdelen. Den bruker nå `--active-small` med lys tekst, som alle de andre bryterne i
bundelen.

**Fremdriftsringen pulserer** svakt mens den skriver ut, så du ser at noe skjer.
`prefers-reduced-motion` slår det av.

**Fargene kommer fra temaet.** Tretten steder brukte `rgba(128,128,128,...)` direkte —
flater er nå `--gray100`, og streker og spor `color-mix` mot `--gray1000`. Det betyr at
kortet følger temaet ditt i stedet for å ligge et hakk ved siden av, og at det ser riktig
ut om du bytter til et lyst tema.

Fallbacken for filamentfarge i slot-visningen er beholdt som den var — der er det en
faktisk farge fra printeren som mangler, ikke en temafarge.
