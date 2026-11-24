<div align="center">
  <img src="app/favicon.ico" alt="GTB PLATFORM Logo" width="80" height="80" />
  <h1>GTB Platform</h1>
</div>

## GitHub translation data mirror

This fork hosts the GTB translation data in [`lib/source/translations-data.json`](lib/source/translations-data.json)
with the snapshot date in [`lib/source/versions.json`](lib/source/versions.json). Use the **Raw** link
on each file for the HTTPS URL.

Open **Actions → Sync translation data → Run workflow** on the default branch to refresh both files.

- **upstream** copies the latest published data from `zmh-program/gtb_platform` and needs no Crowdin credentials.
- **crowdin** runs the bundled crawler and analysis using a Crowdin account with access to the Hypixel translation project.
  Set `CROWDIN_COOKIE` and `CROWDIN_CSRF_TOKEN` under **Settings → Secrets and variables → Actions → Secrets**.
  Set the Actions variable `CROWDIN_META_LANGUAGE_ID` to your approved translation group's
  [language ID](crowdin_api/conf/config.json). It defaults to `55` for Chinese Simplified.

The workflow validates the JSON and commits changes to the default branch. Each run includes a
Database Changes Report in its Actions summary. Published updates also get a report on the data commit.
The upstream project documents
the crawler and its configuration in the [maintainers guide](crowdin_api/MAINTAINERS.md).

### GtbStructures stats translations

The `crowdin` sync also refreshes [`lib/source/stats-translations.json`](lib/source/stats-translations.json).
It contains Hypixel chat, scoreboard, rank, and lobby templates matched to the GtbStructures 1.8.9
stats parser. The [string selection](crowdin_api/conf/stats-strings.json) maps stable output names
to Crowdin file and string IDs.

Each entry has the Crowdin `id`, `file_id`, `key`, English `source`, and a `translations` object
keyed by language. Translations preserve Crowdin placeholders and formatting tokens, including
`%%player%%` and `%%yellow%%`. Pirate English and Brazilian Portuguese use the GtbStructures
codes `pirate` and `pt_br`. Languages with no translation are omitted from that string's entry.

GTB Platform is a comprehensive training and statistics platform for Hypixel Guess The Build players, featuring three main components:

## `1` GTB Word Hint Training [👉 Here](https://gtb.zmh.me)

An interactive training program designed to help players improve their Guess The Build (GTB) skills:

- Practice with 1-3pt wordhints similar to actual gameplay
- Lamp icon (💡) for additional hint tips during practice
- Memory-based training to strengthen wordhint recall and recognition
- Score tracking system with progressive ranks (e.g. Rookie → Talented → Pro → Master)
- Challenge yourself to identify all possible answers to succeed

## `2` Build Battle Statistics Dashboard [👉 Here](https://gtb.zmh.me/stats)

A detailed analytics tool for tracking your Build Battle Stats:

- Comprehensive statistics across all game modes (Solo, Teams, Pro, GTB, SPB)
- Easy sharing via unique URLs (**https://gtb.zmh.me/stats?u=[player]**)
- Screenshot and save your stats with one click
- Dark/Light theme support
- Mobile-friendly responsive design

## `3` GTB Theme Search Engine [👉 Here](https://gtb.zmh.me/themes)

A powerful search engine sourced from the official Hypixel Crowdin database:

- Support for 24 languages with cross-language search capabilities
- Smart character handling that converts accented characters to ASCII (e.g., searching "podwoda" will match and highlight "Pod wodą")
- Toggle between fuzzy and exact matching search modes
- Keyword highlighting with integrated shortcut (SC) and multiword (MW) data lookup
- Advanced features for theme exploration and discovery

### Self Hosted

> For self-hosting needs, you can deploy your own instance. For normal usage, please use https://gtb.zmh.me directly.


[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzmh-program%2Fgtb_hinttest)

1. **Environment Variables**
   - Set up `HYPIXEL_API_KEY` in your Vercel project settings
   - Get your API key from Hypixel by [Hypixel Developers Dashboard](https://developer.hypixel.net)

3. **Domain Setup**
   - Add your custom domain through Vercel's dashboard
   - Vercel will automatically handle SSL certificates
