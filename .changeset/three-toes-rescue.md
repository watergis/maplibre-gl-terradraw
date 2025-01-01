---
'@watergis/maplibre-gl-terradraw': patch
---

chore: updated dependencies in package.json as follows:

- support `maplibre-gl` to v5 as `peerDependencies`
- delete turfjs from `peerDependencies` since they are bundled in the package.
- add `terradraw` marked as optional in `peerDependencies` meta because TerraDraw is included in the plugin package. Terradraw is only required when users want to do their own customization.
