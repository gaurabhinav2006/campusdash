# Procedural assets

No downloaded models, textures, fonts, icons, recordings, or animation clips are used.

- `scene.js`: fictional Aaroh campus buildings, gates, trees, benches, notice boards, lamps, bicycles, bins, planters and water coolers. Signs use canvas-generated textures with a locally installed system font.
- `player.js`: shared articulated humanoid construction and the student's clothing, backpack, sneakers and blended poses.
- `professor.js`: formal-shirt professor, spectacles, register, running and catch poses.
- `obstacles.js`: campus hazards with height-coded action badges.
- `coins.js`: academic medal pickups and four distinctive power-up silhouettes.
- `utils.js`: shared mesh/material caches and pooled particles.
- `audio.js`: short synthesized oscillator tones; no audio recordings.

Three.js is the only third-party runtime dependency: version **0.160.0**, MIT licensed, vendored at `../vendor/three.module.js`. The imported file is the published Three.js package build.

Three.js source/license: https://github.com/mrdoob/three.js/tree/r160

If you vendor the engine, retain its MIT license and copyright notice. Do not describe the third-party engine as original game code. The campus, characters and asset construction code were authored for this project; no claim of trademark clearance or exclusive ownership of generic genre mechanics is made.

The game does not load files from this directory by default. Future assets should have a documented creator, source, license, and redistribution permission before being added.
