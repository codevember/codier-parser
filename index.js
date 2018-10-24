const config = require('./config/database.js')
const parse = require('./src/page-parser.js')
const Backend = require('backend-api')

const MAX_EXISTING = 5

let page = 1
let existingCount = 0
let currentCreation = 0
let creationsPerPage = 0
let creations = []

Backend.init(config.apiKey, config.authDomain, config.databaseName)
  .then(login)
  .then(parsePage)
  .catch((error) => {
    console.log('Init error:', error)
    process.exit(1)
  })

function login () {
  return Backend.signin(config.email, config.password)
}

function logout () {
  return Backend.signout()
}

function parsePage () {
  console.log(`Parsing page ${page}...`)

  parse(page)
    .then(data => {
      creations = data
      creationsPerPage = data.length - 1
      if (creationsPerPage < 0) {
        console.log('No contribution found...')
        return endProcess()
      }
      console.log(`[Success] Parsed page ${page}!`)
      saveCreation()
    })
    .catch(error => {
      console.log('Parsing error:', error)
      process.exit(1)
    })
}

function saveCreation () {
  const today = new Date()
  let year = today.getFullYear()

  if (!creations[currentCreation]) {
    gotoNextPage()
    return
  }

  creations[currentCreation].year = year

  Backend.checkExistence(year, creations[currentCreation].url)
    .then(exists => {
      console.log(`Saving creation ${currentCreation}/${creationsPerPage}...`)

      if (exists === true) {
        existingCount++
        console.log('Creation already exist. Existing creation count:', existingCount)

        if (existingCount >= MAX_EXISTING) {
          endProcess()
        } else {
          gotoNextPen()
        }

        return
      }

      existingCount = 0
      Backend.saveContribution(creations[currentCreation])
        .then(onCreationSaved)
        .catch(error => {
          console.log('Error saving creation:', error)
          process.exit(1)
        })
    })
}

function onCreationSaved () {
  if (existingCount >= MAX_EXISTING) {
    endProcess()
    return
  }

  console.log(`[Success] Saved creation - ${creations[currentCreation].title}`)

  if (currentCreation < creationsPerPage) {
    gotoNextPen()
  } else {
    gotoNextPage()
  }
}

function gotoNextPen () {
  currentCreation++
  saveCreation()
}

function gotoNextPage () {
  currentCreation = 0
  page++
  parsePage()
}

function endProcess () {
  existingCount = 0
  logout().then(() => {
    console.log('All new contributions saved')
    process.exit(0)
  })
}
