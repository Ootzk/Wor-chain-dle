# Wor🔗dle artwork

`organization-avatar.png` is a 500×500 px organization avatar rendered from the
actual game `Cell` component: purple W / empty input cell with 🔗 above gray R /
green D. Edit `src/artwork/OrganizationAvatar.tsx` to change the layout.

```bash
npm ci
npx playwright install chromium
npx playwright test --config scripts/avatar.config.ts
```

The generator starts the app on port 3108 with `REACT_APP_ARTWORK=1`, captures the
artwork page, and stops the server. The route is unavailable in normal builds.
The image uses the game's real CSS and font rendering, including the platform's
chain emoji. No custom-drawn replacement cells or generated illustrations are used.

GitHub's [organization profile documentation](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile)
does not specify separate image dimensions. This draft follows the approximately
500×500 px recommendation in its [profile image reference](https://docs.github.com/en/account-and-profile/reference/profile-reference).
