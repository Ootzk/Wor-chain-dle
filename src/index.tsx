import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import {
  HashRouter,
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
} from 'react-router-dom'
import './index.css'
import App from './App'
import { solution as dailySolution, isWordInWordList } from './lib/words'
import { getRandomWord } from './lib/words'
import { decodeCustomPuzzle } from './lib/customPuzzle'
import { CreatePuzzlePage } from './components/pages/CreatePuzzlePage'
import reportWebVitals from './reportWebVitals'

const DailyPage = () => <App mode="daily" solution={dailySolution} />

const PracticePage = () => {
  const [practiceSolution] = useState(() => getRandomWord())
  return <App mode="practice" solution={practiceSolution} />
}

const CustomPage = ({ match }: RouteComponentProps<{ code: string }>) => {
  const puzzle = decodeCustomPuzzle(match.params.code)

  if (!puzzle || !isWordInWordList(puzzle.word)) {
    return <Redirect to="/" />
  }

  return (
    <App mode="custom" solution={puzzle.word} questioner={puzzle.questioner} />
  )
}

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Switch>
        <Route exact path="/" component={DailyPage} />
        <Route path="/practice" component={PracticePage} />
        <Route path="/create" component={CreatePuzzlePage} />
        <Route path="/custom/:code" component={CustomPage} />
      </Switch>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
