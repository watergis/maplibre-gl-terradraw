---
'@watergis/maplibre-gl-terradraw': patch
---

fix: in some timing, TerraDraw throw error of 'Can not register unless mode is unregistered'. Hence, it resets \_state in modes as unregistered before adding.
