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

## Social media preview

`social-preview.png` is a 1280×640 px white-background wordmark. It reuses
`src/components/GameTitle.tsx`, the same component rendered above the homepage
board. Edit its composition in `src/artwork/SocialPreview.tsx`.

The command above generates both images. To regenerate just this image:

```bash
npx playwright test --config scripts/avatar.config.ts --grep 'social preview'
```

GitHub recommends [1280×640 px and under 1 MB](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).
Upload the PNG in repository Settings → Social preview. Saving the file in this
repository does not change that setting automatically.
