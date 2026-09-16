# ki-cards 3.65.1

## Vanningskortet forsvant helt

Min regresjon fra 3.65.0. Jeg lagret historikkdataene i `this._historikk` — men
`_historikk(hist)` er allerede en **metode** i kortet, den programfanen bruker for å
tegne programlista.

Første gang panelet leste `this._historikk`, fikk det metoden i stedet for data:
sannhetsverdien var `true`, men `.rader` fantes ikke, og opptegningen kastet
`Cannot read properties of undefined`. Og i det panelet skrev sitt eget resultat dit,
var metoden overskrevet — så programfanen ville feilet neste gang også.

Datafeltet heter `_histData` nå. Kontrollert i fire oppsett: demo, standard, med
historikkfanen og med bare programfanen. Alle tegner, og `_historikk` er fortsatt en
metode etterpå.

Navnekollisjonen burde jeg fanget: et `grep` på feltnavnet før jeg tok det i bruk hadde
vist metoden på linje 1203. Kortene her er store nok til at et nytt `this._noe` må
sjekkes først.
