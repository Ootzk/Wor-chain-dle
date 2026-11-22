import { GameTitle } from '../components/GameTitle'

// The homepage wordmark, enlarged for GitHub's 1280×640 social preview.
export const SocialPreview = () => (
  <main
    data-testid="social-preview"
    aria-label="Wor🔗dle social media preview"
    style={{
      width: 1280,
      height: 640,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
    }}
  >
    <GameTitle className="text-[224px] font-bold leading-none whitespace-nowrap text-black" />
  </main>
)
