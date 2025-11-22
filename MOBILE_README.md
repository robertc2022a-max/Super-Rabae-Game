# Super RABÄ Spiel - iOS/Mobile Optimierungen

## Durchgeführte Änderungen

### 1. HTML (index.html)
- **Viewport Meta-Tags** für mobile Geräte hinzugefügt
- **iOS-spezifische Meta-Tags**:
  - `apple-mobile-web-app-capable`: Ermöglicht Vollbildmodus
  - `apple-mobile-web-app-status-bar-style`: Statusleiste wird transparent
  - `viewport-fit=cover`: Nutzt den gesamten Bildschirm (auch bei Notch)
  - `user-scalable=no`: Verhindert ungewolltes Zoomen
- **Touch-Controls** hinzugefügt (Buttons am unteren Bildschirmrand)

### 2. CSS (style.css)
- **Mobile Touch-Controls** mit semi-transparenten Buttons
- **Responsive Design** für verschiedene Bildschirmgrößen
- **Landscape/Portrait Optimierung**
- Controls werden auf Desktop automatisch ausgeblendet (ab 1024px Breite)

### 3. JavaScript (game.js)
- **Touch-Event-Handler** für alle Steuerungselemente
- **Scroll-Prevention** um ungewolltes Scrollen zu verhindern
- Integration mit dem bestehenden Tastatur-Input-System

## Steuerung auf Mobile

### Touch-Controls:
- **◄ / ►**: Links/Rechts bewegen
- **JUMP**: Springen (Doppelsprung möglich)
- **SHOOT**: Feuerbälle schießen (wenn Fire Flower eingesammelt)
- **WINGS**: Flügel aktivieren (wenn gekauft und Enter gedrückt)

## Wie man das Spiel auf iOS spielt

### Option 1: Im Browser
1. Öffne Safari auf deinem iPhone/iPad
2. Navigiere zur Spiel-URL
3. Spiele direkt im Browser

### Option 2: Als Web-App zum Homescreen hinzufügen
1. Öffne die Spiel-URL in Safari
2. Tippe auf das "Teilen"-Symbol (Quadrat mit Pfeil nach oben)
3. Scrolle runter und wähle "Zum Home-Bildschirm"
4. Gib einen Namen ein (z.B. "RABÄ Spiel")
5. Tippe auf "Hinzufügen"
6. Das Spiel erscheint nun als App-Icon auf deinem Homescreen
7. Öffne es von dort - es läuft im Vollbildmodus!

## Technische Details

### Responsive Breakpoints:
- **Desktop**: > 1024px (Touch-Controls ausgeblendet)
- **Tablet/Mobile**: < 1024px (Touch-Controls sichtbar)
- **Small Mobile**: < 480px (kleinere Buttons)
- **Landscape**: < 500px Höhe (kompaktere Controls)

### Performance-Optimierungen:
- Touch-Events nutzen `preventDefault()` für bessere Performance
- `touch-action: manipulation` verhindert Verzögerungen
- `-webkit-tap-highlight-color: transparent` entfernt Flash-Effekte

## Bekannte Einschränkungen

1. **Audio**: Auf iOS muss der Nutzer zuerst mit der Seite interagieren, bevor Audio abgespielt werden kann (bereits implementiert)
2. **Fullscreen**: iOS unterstützt kein echtes Fullscreen via JavaScript, aber die Web-App-Methode funktioniert
3. **Vibration**: Nicht implementiert (könnte bei Bedarf hinzugefügt werden)

## Testen

Teste das Spiel auf verschiedenen Geräten:
- iPhone (verschiedene Größen)
- iPad
- Android-Geräte
- Im Landscape- und Portrait-Modus
