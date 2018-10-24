const phantom = require('phantom')
const getDay = require('./utils').getDay

let phantomInstance
let pageRef
let link
let rejectCb

module.exports = function (page) {
  link = `https://codier.io/search/creations?q=codevember&page=${page}`

  return new Promise((resolve, reject) => {
    rejectCb = reject

    phantom
      .create()
      .then(createPage)
      .then(openPage)
      .then(getContent)
      .then((content) => {
        onContentLoaded(content, resolve)
      })
      .catch(onError)
  })
}

function createPage (ph) {
  phantomInstance = ph
  return phantomInstance.createPage()
}

function openPage (page) {
  pageRef = page
  return pageRef.open(link)
}

function getContent (status) {
  if (status !== 'success') {
    throw new Error('Failed to open page.')
  }

  return pageRef.property('content')
}

function onContentLoaded (content, resolve) {
  pageRef.evaluate(function () {
    var res = []
    var $items = document.querySelectorAll('.creation')

    for (var i = 0, l = $items.length; i < l; i++) {
      var author = $items[i].querySelector('.creation__user a')

      if (!author) continue

      res.push({
        author: $items[i].querySelector('.creation__user a').getAttribute('href'),
        url: $items[i].querySelector('.creation__link').getAttribute('href'),
        title: $items[i].querySelector('.creation__heading').innerHTML.trim()
      })
    }

    return res
  }).then(function (html) {
    formatData(html)
    pageRef.close()
    phantomInstance.exit()

    resolve(html)
  }).catch(onError)
}

function onError (e) {
  console.log(e)
  pageRef.close()
  phantomInstance.exit()
  if (rejectCb && typeof rejectCb === 'function') rejectCb()
}

function formatData (data) {
  data.forEach((creation) => {
    creation.author = creation.author.replace('/@', '')
    creation.day = getDay(creation.title)
    creation.image = ''
    creation.title = creation.title.replace(/(#)?codevember/gi, '').trim()
    creation.url = 'https://codier.io' + creation.url
  })
}
