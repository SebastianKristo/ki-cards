## Rettet

**ki-media-card 1.8.1**
- Framdriften i volumsporet var borte i Safari og i companion-appen. Gradienten brukte et fargestopp med to posisjoner (`farge 0 var(--p)`), som WebKit ikke tolker – da faller hele bakgrunnsbildet bort og bare det grå sporet står igjen. Nå brukes vanlige to-punkts stopp, med `-moz-range-progress` i tillegg for Firefox
