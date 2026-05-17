import { render, screen } from '@testing-library/react'
import { Keyboard } from './Keyboard'
import '../../i18n'

const noop = () => undefined

const renderKeyboard = (enterHint?: 'incomplete' | 'invalid' | 'valid') =>
  render(
    <Keyboard
      onChar={noop}
      onDelete={noop}
      onEnter={noop}
      guesses={[]}
      solution="crane"
      enterHint={enterHint}
    />
  )

test('keeps the Enter key default style without a validation hint', () => {
  renderKeyboard()

  expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass(
    'bg-slate-200'
  )
})

test('shows Enter key validation hint variants', () => {
  const { rerender } = renderKeyboard('incomplete')

  expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass(
    'bg-slate-100'
  )

  rerender(
    <Keyboard
      onChar={noop}
      onDelete={noop}
      onEnter={noop}
      guesses={[]}
      solution="crane"
      enterHint="invalid"
    />
  )
  expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass(
    'bg-purple-100'
  )

  rerender(
    <Keyboard
      onChar={noop}
      onDelete={noop}
      onEnter={noop}
      guesses={[]}
      solution="crane"
      enterHint="valid"
    />
  )
  expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass(
    'bg-green-100'
  )
})
