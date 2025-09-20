---
'@watergis/maplibre-gl-terradraw': patch
---

feat: added forceDistanceUnit property in MaplibreMeasureControl to allow users to use the same distance unit always.

- `forceDistanceUnit` parameter can accept from the following units:
  - `auto`
  - metric unit: `cm`, `m`, `km`

Default is selected for auto which can convert metric distance unit automatically depending on a scale. If other unit type other than `kilometers` is set to `distanceUnit` property (for example, `miles`, `degrees`, `radian`), this `forceDistanceUnit` is ignored and cosidered as `auto`. In case, if you want to use other units other than metric, please use `distanceUnit` property instead.
