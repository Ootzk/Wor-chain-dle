import {
  PATCH_NOTES,
  getCurrentPatchNotes,
  getPatchNoteVersions,
} from './patchNotes'
import { RELEASE_METADATA } from './releaseMetadata'

describe('patch notes metadata', () => {
  it('keeps release dates in release metadata', () => {
    for (const patchNote of PATCH_NOTES) {
      expect(RELEASE_METADATA[patchNote.version]?.releasedAt).toBeTruthy()
    }
  })

  it('hydrates patch notes with release metadata', () => {
    expect(getPatchNoteVersions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          version: '1.7.0',
          releasedAt: '2026-05-27',
        }),
        expect.objectContaining({
          version: '1.6.0',
          releasedAt: '2026-05-10',
        }),
      ])
    )
  })

  it('falls back to the latest patch notes for unknown current versions', () => {
    expect(getCurrentPatchNotes('9.9.9')).toMatchObject({
      version: PATCH_NOTES[0].version,
    })
  })
})
