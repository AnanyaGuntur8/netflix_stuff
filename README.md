# Mini Netflix-style Photo Show

Slideshow demo that auto-plays frames from the `animation/` folder.

## Run on localhost

In Terminal:

```bash
cd /Users/ananyaguntur/Desktop/Project
./start.sh
```

Or:

```bash
python3 -m http.server 8765
```

Then open **http://localhost:8765** in your browser.

The animation starts automatically. Use **Esc** to close the player, **Space** to pause/play.

## Notes

- Loads `animation/1.png` through `animation/31.png` on startup.
- You can still upload images or paste URLs to override the animation folder.
- Default speed is 10 fps. Change it in the player controls.
