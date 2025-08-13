# Zittau Energy Planning - Grid Edition

Eine vereinfachte, grid-basierte Webanwendung für die Energiesystemplanung in Zittau.

## 🎯 Übersicht

Diese Anwendung teilt Zittau in ein 4x4 Raster auf und ermöglicht:
- Interaktive Kartenvisualisierung der Energieverbrauchsebenen
- Stakeholder-Management mit Einflusslevel-Matrix
- Energiepreis-Szenarien für Planungsworkshops
- Energie-Bilanz-Analyse mit CO2-Berechnung

## 🏗️ Projektstruktur

```
src/map-planning/
├── app.py                      # FastAPI Hauptanwendung
├── database.py                 # GridPlanningDatabase Klasse
├── zittau_energy_planning.db   # SQLite Datenbank (wird automatisch erstellt)
└── static/
    └── index.html             # Frontend (Bootstrap + Leaflet + Chart.js)
```

## ⚡ Features

### 🗺️ 4x4 Raster-Karte
- Feste Aufteilung von Zittau in 16 Raster
- Farbcodierte Energieverbrauchsebenen (Hoch/Mittel/Niedrig)
- Interaktive Raster-Auswahl mit Detailinformationen

### 👥 Stakeholder-Management
- 17+ vordefinierte Stakeholder verschiedener Kategorien:
  - Stadtverwaltung, Stadtwerke
  - Bürgergruppen, Vereine
  - Unternehmen, Forschung
  - Wohnungsgenossenschaften
- Einflusslevel: Hoch/Mittel/Niedrig
- Partizipationsbereitschaft-Matrix

### 📈 Energiepreis-Szenarien
- **Basis-Szenario 2025**: Moderate Preissteigerung
- **Hohe Energiepreise**: Deutlich steigende Kosten
- **Grüne Energiewende**: Sinkende EE-Kosten, steigende fossile Preise
- Preisverläufe für Strom, Gas, Wärme bis 2050
- Interaktive Diagramme mit Chart.js

### 📊 Analyse-Tools
- **Energiebilanz**: Gesamtverbrauch vs. EE-Potenzial
- **CO2-Emissionen**: Berechnung basierend auf Verbrauch
- **Autarkiegrad**: Selbstversorgungsquote
- **Raster-Details**: Individuelle Energiedaten pro Raster

## 🚀 Installation & Start

### Voraussetzungen
- Python 3.8+
- FastAPI, Uvicorn, aiosqlite

### Start der Anwendung
```bash
cd src/map-planning
python app.py
```

Die Anwendung läuft dann auf: **http://127.0.0.1:8001**

### Erste Nutzung
1. Die Datenbank wird beim ersten Start automatisch mit realistischen Testdaten gefüllt
2. Die 4x4 Raster werden mit verschiedenen Raster-Typen erstellt:
   - Wohngebiete (residential)
   - Gewerbegebiete (commercial)  
   - Industriegebiete (industrial)
   - Mischgebiete (mixed)

## 🎮 Bedienung

### Navigation
- **Übersicht**: Zurück zur Hauptansicht
- **Stakeholder**: Stakeholder-Matrix anzeigen
- **Szenarien**: Energiepreis-Szenarien verwalten

### Raster-Interaktion
1. Klicken Sie auf ein Raster in der Karte
2. Sehen Sie Detailinformationen im rechten Panel
3. Bearbeiten Sie Energiedaten über "Daten bearbeiten"

### Analyse-Funktionen
- **Energiebilanz anzeigen**: Gesamtbilanz aller Raster
- **CO2-Analyse**: Emissionsberechnung für das gesamte Gebiet

## 🛠️ API-Endpunkte

- `GET /api/districts` - Alle Raster mit Energiedaten
- `GET /api/stakeholders` - Stakeholder-Liste
- `GET /api/energy-scenarios` - Energiepreis-Szenarien
- `GET /api/analysis/energy-balance` - Energiebilanz
- `GET /api/analysis/co2-emissions` - CO2-Analyse
- `POST /api/districts/{id}/energy-data` - Energiedaten aktualisieren

## 📊 Datenmodell

### Raster (Districts)
- **ID, Name**: Eindeutige Identifikation
- **Grid Position**: Row/Col im 4x4 Raster
- **Bounds/Center**: Geografische Koordinaten
- **Type**: residential/commercial/industrial/mixed
- **Population**: Einwohnerzahl
- **Energy Demand**: Verbrauchsdaten (JSON)
- **Renewable Potential**: EE-Potenzial (JSON)

### Stakeholder
- **Name, Kategorie**: Identifikation
- **Influence Level**: high/medium/low
- **Participation Willingness**: Bereitschaft zur Teilnahme
- **Key Interests**: Hauptinteressen (Array)

### Szenarien
- **Name, Beschreibung**: Szenario-Info
- **Base/Target Year**: Zeitraum
- **Energy Prices**: Preisverläufe (JSON)
- **Policy Framework**: Regulatorischer Rahmen

## 🎯 Workshop-Tauglichkeit

Diese Anwendung ist speziell für Energieplanungs-Workshops konzipiert:

### ✅ Vereinfachte Struktur
- Keine komplexen Geometry-Tools
- Vordefinierte 4x4 Raster-Struktur
- Realistische Ausgangsdaten

### ✅ Interaktive Elemente
- Einfache Kartennavigation
- Klare Visualisierungen
- Stakeholder-Engagement-Matrix

### ✅ Praktische Szenarien
- Realistische Energiepreise
- Verschiedene Zukunftspfade
- Policy-Framework Integration

## 📝 Entwickler-Hinweise

- **Database**: SQLite mit automatischer Initialisierung
- **Frontend**: Bootstrap 5 + Leaflet + Chart.js
- **Backend**: FastAPI mit async/await Pattern
- **Reload**: Uvicorn Auto-Reload für Entwicklung aktiviert

## 🎨 Anpassungen

### Neue Raster hinzufügen
Bearbeiten Sie `populate_grid_data()` in `database.py`

### Stakeholder erweitern  
Ergänzen Sie die Stakeholder-Liste in der Database-Initialisierung

### Neue Szenarien
Erweitern Sie `/api/energy-scenarios` Endpunkt in `app.py`

---

**Entwickelt für Energieplanungs-Workshops in Zittau** 🏭⚡🌱
