# ki-cards 5.10.0

## `fast_hoyde`: paneldelen holder høyden

Panelene byttes med `display:none` og `block`, så høyden endret seg brått ved fanebytte.
I en popup flytter da hele flata seg — «Renhold» er lang, «Kart» er kort, og innholdet
hopper.

```yaml
type: custom:ki-tabs-card
fast_hoyde: true
```

Paneldelen får høyden til den **høyeste** fanen, og beholder den. Bytte mellom faner
endrer ikke lenger størrelsen på popupen.

### Høyden krymper ikke igjen

Et kort som laster sent — et bilde, en graf — ville ellers gjort flata kortere etterpå,
og da hopper det på nytt. Vi husker den største høyden vi har sett. Vokser en fane,
følger høyden med opp; blir den kortere, står den.

M�lingen gjentas etter 100 og 600 ms og ved hver størrelsesendring, siden kortene ikke er
ferdige med en gang.

Valget ligger i editoren under Oppførsel.

### Merk om YAML-en din

`card_mod` med `.tabs-container` og `.tab-button` gjør ingenting på `ki-tabs-card` —
det er simple-tabs sine klassenavn. Formen kommer fra kortet selv, og målene settes med
`fane_hoyde`, `fane_sidepadding` og `rad_bredde`, som du alt bruker.

### Kontrollert

To faner på 1240 og 320 px: låses til 1240. En fane krymper til 900: høyden står. En
fane vokser til 1500: høyden følger med. Uten `fast_hoyde` settes ingenting.

---

# ki-cards 5.9.1

Pillemålingen bruker layoutverdier i stedet for rektangler, som regner med transformer.
