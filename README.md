# if-animated-reels

Production repo for If Animated (TikTok @whatifanimatedvideos): "If I could have told you..." reels in the CRT moody style.

## Dropping voiceovers

1. Record each script in `scripts/` in ElevenLabs, exactly as written, same voice every time.
2. Name each file by its ID: `IA-004.mp3`.
3. On github.com: open `inbox/`, tap **Add file > Upload files**, select the mp3s, tap **Commit changes**.

## Folders

- `inbox/` voiceovers waiting to be turned into reels
- `scripts/` the text of each script (the timing step matches the voice against it)
- `posts.json` title, caption, posting time (UTC) and status of each post
- `clips/` the moody clip library used inside the CRT screen
- `reels/` finished reels; PostFast pulls each video from its public link here

Nothing posts until the batch is approved in chat.
