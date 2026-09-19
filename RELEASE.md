# ki-cards 5.9.1

## Blinket var transformer, ikke fontlasting

Jeg har jaget dette i flere runder med feil forklaring. Her er den riktige:

`getBoundingClientRect` regner med transformer. En popup som glir inn med `scale`
returnerer derfor **skalerte** mål mens animasjonen går. Pilla ble målt mot et
mellomstadium — for bred og uten innrykk — og rettet seg når animasjonen var ferdig.

M�lingen bruker nå `offsetLeft` og `offsetWidth`, som er layoutverdier og ikke påvirkes
av transformer. `clientLeft` gir rammebredden, som er forskjellen mellom `offsetLeft` og
`left: 0`.

Jeg byttet feil vei i 4.25.1: da gikk jeg fra offset til rektangel for å få med ramma,
og dro transformproblemet med på kjøpet.

### Hva det betyr for de forrige rettelsene

Ventetiden på skrifta fra 5.8.0 står, og er fortsatt riktig — skrifta endrer faktisk
bredden. Men den var ikke årsaken til det du så.

### Kontrollert

Samme rad målt midt i en innglidning på `scale(0.8)` og ferdig animert gir nå identiske
verdier: 2 px inn og 95 px bred. Med den gamle målingen ville den fått 76 px under
animasjonen.

---

# ki-cards 5.9.0

Nytt kort `ki-eksempler-card`, og strømpopupen omskrevet fra ~1100 til 169 linjer.
