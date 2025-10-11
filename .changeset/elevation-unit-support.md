---
'@watergis/maplibre-gl-terradraw': patch
---

feat: Add elevation unit support based on measureUnitType property. When measureUnitType is set to 'imperial', elevation displays in feet (ft) instead of meters (m). When measureUnitType is set to 'metric', elevation displays in meters (m). The elevation unit symbol can be customized via measureUnitSymbols property. When measureUnitType changes, existing elevation values are automatically recalculated to display in the appropriate unit.