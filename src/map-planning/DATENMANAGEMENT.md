# Datenmanagement-System für Quartier-Energieplanung

## Übersicht

Das neue Datenmanagement-System verwendet eine strukturierte, konfigurationsbasierte Herangehensweise zur Verwaltung von Quartier-Daten. Anstatt Daten direkt im Code zu definieren, werden sie über YAML-Konfigurationsdateien verwaltet.

## Architektur

```
map-planning/
├── data/
│   ├── quartier_config.yml     # Hauptkonfiguration
│   ├── Stadtteile_Zittau.geojson  # Geografische Daten
│   └── generated_data.json     # Exportierte Daten (optional)
├── data_manager.py             # Datenmanagement-Klasse
├── database.py                 # Datenbanklogik
└── app.py                      # Hauptanwendung
```

## Komponenten

### 1. QuartierDataManager (`data_manager.py`)

Die zentrale Klasse für Datenmanagement:

```python
from data_manager import QuartierDataManager

manager = QuartierDataManager()
quartiers = manager.generate_quartier_data()
stakeholders = manager.generate_stakeholder_data()
technologies = manager.generate_technology_data()
```

**Hauptfunktionen:**
- Lädt YAML-Konfiguration und GeoJSON-Daten
- Berechnet Energiebedarf basierend auf Quartiertyp und Bevölkerung
- Generiert konsistente Datenstrukturen
- Validiert Daten gegen Schema
- Exportiert Daten als JSON

### 2. Konfigurationsdatei (`quartier_config.yml`)

Strukturierte Definition aller Datentypen und Standards:

```yaml
# Schema-Definition
schema:
  district:
    required_fields: [id, name, district_type, population, area_km2]
  energy_demand:
    electricity_mwh: "number"
    heating_mwh: "number"
    # ...

# Standardwerte pro Quartiertyp
district_type_defaults:
  residential:
    base_population_density: 2000
    energy_demand:
      electricity_factor: 3.2  # MWh pro Einwohner
      heating_factor: 2.8
    # ...

# Spezifische Quartier-Definitionen
quartiers:
  quartier_1:
    name: "Zentrum"
    district_type: "mixed"
    area_km2: 0.8
    population_override: 2500
    special_factors:
      heritage_protection: true
      energy_demand:
        electricity_factor: 4.8  # Überschreibt Standard
```

### 3. Datenklassen

Typisierte Datenstrukturen für bessere Typsicherheit:

```python
@dataclass
class QuartierData:
    id: str
    name: str
    district_type: str
    area_km2: float
    population: int
    geometry: Dict[str, Any]
    energy_demand: Dict[str, Any]
    renewable_potential: Dict[str, Any]
    # ...
```

## Verwendung

### Neue Quartiere hinzufügen

1. **GeoJSON aktualisieren**: Fügen Sie neue Polygone zu `Stadtteile_Zittau.geojson` hinzu
2. **Konfiguration erweitern**: Definieren Sie das neue Quartier in `quartier_config.yml`:

```yaml
quartiers:
  quartier_9:
    name: "Neues Quartier"
    district_type: "residential"
    area_km2: 1.2
    population_override: 1500
    description: "Beschreibung des neuen Quartiers"
    special_factors:
      new_development: true
      renewable_potential:
        solar_pv_factor: 1.5  # Bessere Solarausrichtung
```

### Neue Quartiertypen definieren

Fügen Sie neue Typen zu `district_type_defaults` hinzu:

```yaml
district_type_defaults:
  rural:
    base_population_density: 500
    energy_demand:
      electricity_factor: 2.8
      heating_factor: 3.5  # Höher wegen schlechterer Isolierung
    renewable_potential:
      solar_pv_factor: 1.2
      biomass_factor: 2.0  # Mehr landwirtschaftliche Reste
```

### Technologien hinzufügen

Erweitern Sie `technology_templates`:

```yaml
technology_templates:
  biogas_plant:
    name: "Biogas-Anlage"
    category: "generation"
    technology_type: "biogas"
    capacity_range: [50, 500]
    default_capacity: 200
    parameters:
      efficiency: 0.42
      lifetime_years: 20
    costs:
      capex_eur_per_kw: 3500
      opex_eur_per_kw_year: 120
    availability: "available"
    constraints:
      - "Mindestabstand zu Wohngebäuden: 500m"
      - "Genehmigung erforderlich"
```

### Stakeholder verwalten

Stakeholder werden über Templates und spezifische Konfigurationen definiert:

```yaml
stakeholder_templates:
  research:
    default_influence: "medium"
    default_participation: "high"
    typical_interests:
      - "Forschung"
      - "Innovation"
      - "Pilotprojekte"
```

### Datenvalidierung

Das System validiert automatisch:
- Erforderliche Felder vorhanden
- Datentypen korrekt
- Referentielle Integrität (z.B. district_id existiert)

### Datenexport

```python
# Exportiere alle generierten Daten als JSON
manager = QuartierDataManager()
manager.export_to_json("meine_daten.json")
```

## Vorteile des neuen Systems

### 1. **Übersichtlichkeit**
- Klare Trennung von Konfiguration und Code
- Strukturierte YAML-Dateien sind leicht lesbar
- Hierarchische Organisation der Daten

### 2. **Flexibilität**
- Einfaches Hinzufügen neuer Quartiere ohne Code-Änderungen
- Übersteuerung von Standardwerten pro Quartier
- Erweiterbare Datenstrukturen

### 3. **Konsistenz**
- Automatische Berechnung basierend auf Standards
- Einheitliche Datenstrukturen
- Validierung gegen Schema

### 4. **Wartbarkeit**
- Zentrale Konfiguration
- Typisierte Datenklassen
- Klare Dokumentation der Datenstrukturen

### 5. **Erweiterbarkeit**
- Einfaches Hinzufügen neuer Datenfelder
- Modulare Stakeholder-Templates
- Flexible Technologie-Bibliothek

## Berechnungslogik

### Energiebedarf
Basiert auf Faktoren pro Einwohner, multipliziert mit der Bevölkerung:
- `electricity_mwh = population * electricity_factor`
- Spezialfaktoren können Standardwerte überschreiben

### Erneuerbare Potentiale
Kombiniert bevölkerungsbasierte und flächenbasierte Faktoren:
- Solar: Abhängig von Gebäudedichte und -typ
- Wind: Berücksichtigt städtische Beschränkungen
- Biomasse: Direkte Angaben für ländliche Gebiete

### Demografische Daten
Berechnet aus Quartiertyp mit möglichen Überschreibungen:
- Durchschnittsalter, Einkommen, Bildungsniveau
- Haushaltsgröße basierend auf regionalen Standards

## Debugging und Entwicklung

### Daten validieren
```python
manager = QuartierDataManager()
is_valid = manager.validate_data('district', quartier_data)
```

### Einzelne Berechnungen testen
```python
energy_demand = manager.calculate_energy_demand(quartier_config, population, area)
renewable_potential = manager.calculate_renewable_potential(quartier_config, population, area)
```

### Konfiguration prüfen
```python
# Lädt und validiert YAML-Konfiguration
manager.load_config()
print(manager.config['quartiers']['quartier_1'])
```

Dieses System macht es einfach, Daten zu verwalten und das Tool für verschiedene Städte und Szenarien anzupassen.
