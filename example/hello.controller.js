const metrics = require('./../lib/metrics')

const myCustomHelloPageMetric = new metrics.promClient.Gauge({
  name: 'hello_counter',
  help: 'The number of times we have greeted the user'
})

function showHelloPage(req, res, next) {
  myCustomHelloPageMetric.inc()
  res.send('Hello')
}

module.exports = { showHelloPage }
