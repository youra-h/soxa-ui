# Guide adoption

## Who is affected

Applications can use Guide for a walkthrough or a feature introduction in any Soxa adapter. Applications with custom locales can provide the optional `translations.guide` section for navigation and progress text.

## Before

Existing Frame usage includes direct viewport positioning and a declarative point anchor. For example, open a frame beside a viewport coordinate with `<Frame :anchor_point="{ x: 160, y: 90 }" :visible="true" />`.

## After

Use Guide when the panel needs to move through a sequence. Prepare `steps` and call `start()` on the controller. A viewport anchor uses the same CSS-pixel coordinate system as Frame. See the [Guide example](../components/guide.md).

The default Frame type arguments match its existing props and event map. Frame anchor placement still uses the existing `TFramePlacement` literals. An application locale can adopt Guide's labels by overriding `previous`, `next`, `done`, and `progress`. Locales without the section use the component defaults. Include `guide` in application maps built over every key of `TTranslations`.

## Verification

Compile an existing Frame with a point anchor. Open Guide, move to the viewport step, update its coordinates, and dispatch its progression event. The tooltip should follow the new point and advance once. Run `npm run check:compatibility` after building the packages to compare the package declarations with the published baseline.
