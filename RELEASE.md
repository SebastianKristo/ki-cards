# ki-cards 4.36.1

## Pilla endret seg synlig rett etter at kortet kom opp

Den var for bred et øyeblikk og krympet etterpå, mens fanerada flyttet seg litt.

Det var min rettelse fra 4.33.1 som slo feil ut. Der gjorde jeg de sene målingene på 120
og 400 ms **animerte**, for at en glidning ikke skulle stoppes midtveis. Men de
målingene er korreksjoner av bredden når skrifta er ferdig lastet — og animert ser en
korreksjon ut som en bevegelse.

Regelen er nå presis: **pilla animerer bare når den aktive fanen faktisk er en annen.**
Er målet det samme, rettes bredden stille.

Et fanebytte glir som før. Det samme gjør gjeninnsettingen etter at et kort har tegnet
rada på nytt — der står pilla på forrige plass, og da ER det et bytte selv om vi ikke har
sett den forrige fanen i denne oppkoblingen.

Samme regel i `ki-tabs-card` og i `KI.pillefaner`.

### Kontrollert

Frisk oppstart: stille, og korreksjonene etterpå stille. Fanebytte: glir, og
korreksjonen etter stille. Gjeninnsetting etter ny tegning: glir, så stille.

---

# ki-cards 4.36.0

Ett kort per fane, redigert med Home Assistants egen kortredigerer. Rundt hundre linjer
egen kortliste fjernet.
