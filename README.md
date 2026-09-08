# Dallas Beats

A one-page, mobile-ready producer showcase for SANNT. It is plain HTML/CSS/JavaScript and can be hosted free on GitHub Pages. The fixed VHS portrait shifts color, scale, and position as visitors scroll; playing audio adds a real frequency-driven pulse.

## Replace the placeholder beats

1. Create `assets/audio/` inside this folder.
2. Copy your MP3 files into it. Use simple lowercase filenames such as `requiem.mp3`.
3. Open `script.js` and edit the `beats` array at the very top. For each real beat, change the title/detail/path and set `placeholder: false`:

```js
{ title: "REQUIEM", detail: "140 BPM / F MIN", src: "assets/audio/requiem.mp3", placeholder: false }
```

Add, remove, or reorder objects in that array to change the track list. Five to eight tracks works best. Real files power the player, scrubber, timestamps, downloads, and audio-reactive background automatically.

## Owner hide preview

Add `?manage=1` to the end of the site URL to open the owner-only management panel. Its checkboxes preview which beats are visible on that device. Use **copy hide settings** and send the copied list back when you want those choices applied to the public files. Because GitHub Pages is static and has no login or database, this panel cannot securely publish changes by itself.

## Update contact links

In `index.html`, replace the Instagram and YouTube URLs plus both `hello@example.com` email addresses. Change the short hero copy there too if desired.

## Preview locally

Opening `index.html` directly works for the included demos. For the most reliable MP3 testing, serve this folder with any local web server (for example VS Code Live Server).

## Publish free with GitHub Pages

1. Create a new public GitHub repository.
2. Upload everything inside this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

GitHub will show the public URL after deployment. Playback begins only after a visitor presses play, as required by modern browsers.
