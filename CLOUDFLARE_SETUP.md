# Active Partner: phone app + live AI setup

The web app is a PWA. Its microphone now connects to a live speech-to-speech AI session; the topic cards only choose a conversation starter. The AI key stays on the server.

## Important

GitHub Pages can publish the static screen, but it cannot run the private `/api/session` function. Deploy this project to Cloudflare Pages using the repository root as the build output directory and no build command. Keep the `functions/` folder at the repository root.

The live AI needs an OpenAI API project with GPT-Live access and API billing. This is separate from a ChatGPT subscription; voice duration and the delegated reasoning model can both incur API charges. Set a usage limit in the API account before using it.

## Cloudflare Pages settings

1. Create a Pages project from the GitHub repository containing `index.html`, `manifest.json`, `service-worker.js`, and `functions/api/session.js` at its root.
2. Set the build command to blank and the output directory to `.`.
3. In Pages **Settings → Variables and Secrets**, add these as encrypted secrets (for Production, and Preview only if you plan to use Preview):
   - `OPENAI_API_KEY`: your OpenAI project API key.
   - `ACTIVE_PARTNER_ACCESS_CODE`: a long private code you make up. You will enter this on your phone the first time you start a conversation. Do not commit either value to GitHub or send the API key in chat.
4. Redeploy the latest commit after adding the secrets.
5. Open the `*.pages.dev` HTTPS link on your phone, allow microphone access, tap the mic, and enter the private app access code once.
6. To install: on Android Chrome, open the site menu and choose **Install app** or **Add to Home screen**. On iPhone Safari, tap **Share → Add to Home Screen**.

The access code is a basic personal-use gate. Do not share the app link or access code publicly. For a public launch, add user sign-in and server-side rate limits before distributing it.
