import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Route, Switch } from 'react-router-dom'
import './index.css'
import App from './App'
import { solution as dailySolution } from './lib/words'
import { getRandomWord } from './lib/words'
import reportWebVitals from './reportWebVitals'

const DailyPage = () => <App mode="daily" solution={dailySolution} />

const PracticePage = () => {
  const [practiceSolution] = useState(() => getRandomWord())
  return <App mode="practice" solution={practiceSolution} />
}

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Switch>
        <Route exact path="/" component={DailyPage} />
        <Route path="/practice" component={PracticePage} />
      </Switch>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
