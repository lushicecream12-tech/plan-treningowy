# Plan Treningowy

Prosta aplikacja treningowa w czystym HTML, CSS i JavaScript.

## Pliki

- `index.html` - główny widok aplikacji
- `styles.css` - style
- `script.js` - logika aplikacji i zapis lokalny
- `serve.command` - otwiera aplikację

## Jak uruchomić

1. Otwórz `index.html` w przeglądarce albo uruchom `serve.command`.
2. Aplikacja działa od razu, bez logowania.
3. Dane zapisują się lokalnie w przeglądarce przez `localStorage`.

## Co działa

- szybkie tworzenie treningów
- edycja planów i ćwiczeń
- zapis planów i historii lokalnie
- kalendarz z ikoną i kolorem treningu w dniu wykonania
- start treningu blokowany, gdy plan nie ma ćwiczeń
- globalny dźwięk kliknięcia z pliku `mixkit-cool-interface-click-tone-2568.wav`
- workflow GitHub Pages gotowy do automatycznej publikacji po pushu na `main`

## Uwaga

Zdjęcia ćwiczeń są zapisywane jako data URL w pamięci przeglądarki, więc przy bardzo dużej liczbie dużych zdjęć lokalne dane mogą szybko rosnąć.
