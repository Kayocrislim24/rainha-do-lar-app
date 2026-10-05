<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Review videos are stored in the private `review-media` bucket and referenced from the existing review media array with a `review-video:` prefix, because signed URLs keep public playback controlled without exposing a public bucket.
- Muted review videos have their audio track removed client-side with FFmpeg before upload, because playback muting alone would still expose spoken audio.
