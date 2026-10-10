# ShadeWindow visual assets

The UI uses the supplied educational-app image as a visual reference for sky blue, white cards, fresh green actions, and friendly rounded shapes. It does not reproduce the reference's characters or screen layouts.

Generated asset: `public/assets/sun-walker.png`.

Tool: built-in `image_gen.imagegen`, with `transparent_background: true`. The original generated file was copied into the project. Transparency was preserved, and the output was visually inspected.

Exact prompt:

> Use case: stylized-concept. Asset type: small transparent mascot illustration for ShadeWindow, a friendly walking planner. Primary request: a cheerful small anthropomorphic golden sun character wearing a sky-blue backpack and green sneakers, taking a happy step forward, one hand waving. Polished soft 3D cartoon illustration with expressive eyes, rounded shapes, approachable educational-app charm. Colour palette: sky blue, fresh grass green, warm yellow, white. Full body centred, compact square composition, clean readable silhouette for a 100px header illustration. Genuine transparent background. No scene, no words, no typography, no watermark, no ground plane. This is a decorative illustration, not a UI mockup.

Application icon: `public/icon.svg`, a code-native smiling sun and green path. It is used as the favicon. Map graphics are deterministic SVG generated from the same geometry used by the shade calculations.

## README cover

Generated asset: `public/assets/shadewindow-cover.png`.

Tool: built-in `image_gen.imagegen`, with `transparent_background: false`. The output was visually inspected and copied into the project. This is an illustrative product cover, not a screenshot; UI values and routes in the artwork are illustrative.

Exact prompt:

```text
Use case: ads-marketing.
Asset type: wide landscape GitHub README cover for ShadeWindow, about 2.4:1 aspect ratio.
Primary request: Create an original polished cover inspired by the attached reference's photographic landscape, large hand-painted project title, floating app cards, and handwritten arrows explaining a workflow. Adapt every detail to ShadeWindow, a local-AI walking planner comparing shade, walking routes, rest stops and departure times in a simulated neighbourhood.
Scene: a lush sunlit urban park walking path with trees casting long visible shadows, nearby low-rise buildings, warm sunlight, blue sky. Outdoor photographic collage style with friendly editorial graphic overlays.
Composition: left third large readable title "ShadeWindow" with Shade in fresh green and Window in cream-white brush lettering. Below it exact tagline "A little shade. A better walk." Center a realistic laptop or tablet showing a blue-and-white walking dashboard with a green route, tree and building shade polygons, three simple route cards and a time slider. Right half three floating compact cards connected by white hand-drawn arrows labeled "1. Plan", "2. Compare", "3. Save & go". Depict a walking preference card, shaded route comparison map, and a saved walk card respectively. Keep secondary UI text minimal and legible. Small bottom labels "Moving shade", "Local AI", "Saved walk cards", and "Simulated map & weather".
Palette: fresh green, sky blue, warm yellow sunlight, white. Landscape is immersive and photorealistic; graphic cards polished and readable. Overall matches the reference's energetic outdoors-meets-software composition while being original to ShadeWindow.
Constraints: no WildProof branding, no mountains or wilderness exploration, no claims of live weather or real street routing, no watermark. Exact project name and tagline, do not crowd edges.
```
