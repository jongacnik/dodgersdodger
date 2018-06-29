var choo = require('choo')
var html = require('choo/html')
var tinytime = require('./tinytime')
var css = require('sheetify')
var xhr = require('xhr')

css('ress')
css('gr8')

var prefix = css`
  @font-face {
    font-family: 'fenway_park_jf';
    src: url('assets/fonts/fenway-webfont.woff2') format('woff2'),
         url('assets/fonts/fenway-webfont.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  b, strong {
    font-weight: normal;
  }

  h1, h2, h3, h4, h5, h6, h7 {
    font-size: inherit;
    font-weight: inherit;
    font-style: inherit;
  }

  button, input {
    outline: none;
    letter-spacing: inherit;
    text-align: inherit;
  }

  ul, ol, li { 
    list-style: none;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    color: dodgerblue;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .active {
    background-color: dodgerblue;
    color: white;
  }

  .fenway {
    font-family: 'fenway_park_jf', Arial, Helvetica, sans-serif;
  }

  .big-text {
    font-size: 24vw;
  }

  @media (min-width:1024px) {
    .big-text {
      font-size: 16vw;
    }
  }

  .spin {
    animation: spin 0.5s ease forwards;
  }

  @keyframes spin {
    from { transform: rotateZ(720deg) }
    to { transform: rotateZ(-15deg) }
  }

  .fc-red {
    color: red;
  }

  .bw {
    filter: grayscale(100%);
  }
`

var buster = tinytime('{YY}{Mo}{DD}')
var template = tinytime('{h}:{mm}{a}')

// TODO
// - [ ] show teams
// - [ ] server cache
// - [ ] deploy

var app = choo()

app.route('/', view)

app.use(function (state, emitter) {
  state.open = false
  state.events.TOGGLE = 'toggle'
  emitter.on(state.events.TOGGLE, function () {
    state.open = !state.open
    emitter.emit(state.events.RENDER)
  })
})

app.use(function (state, emitter) {
  state.loading = true
  state.game = null

  xhr('https://statsapi.mlb.com:80/api/v1/schedule?sportId=1&busted=' + buster.render(new Date()), function (err, resp, body) {
    try {
      var a = JSON.parse(body)
      var games = a.dates[0].games.map(game => {
        return {
          teams: game.teams,
          venue: game.venue,
          date: game.gameDate
        }
      })

      var dodger = games.find(game => game.venue.id === 22)
      
      state.game = dodger
      state.loading = false

      emitter.emit(state.events.RENDER)
    } catch (e) {}
  })
})

app.mount('body')

function view (state, emit) {
  if (state.loading) return html`<body></body>`

  return html`
    <body class="${prefix} vhmn100 x xac xjc tac oh lh1 usn ${state.game ? 'active' : ''}">
      <div class="spin fenway big-text">
        ${state.game 
          ? html`<div>Dodge<div class="ttl">${template.render(new Date(state.game.date))}</div></div>`
          : 'Dodged!'
        }
      </div>
      <div class="psf b0 r0 p1 bw tar">
        ${state.open ? html`<span>daily reminder of when traffic will be awful on Stadium Way. <a href="https://jongacnik.com">jongacnik.com</a> </span>` : ''}
        <button onclick=${e => emit(state.events.TOGGLE)}>${state.open ? '×' : '?'}</button>
      </div>
    </body>
  `
}