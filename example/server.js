const express = require('express')
const metrics = require('./../lib/metrics')

const helloController = require('./hello.controller')

const PORT = 8100
const app = express()

async function setup() {
  app.use(metrics({ fetchDefaultLabelsFromEcs: true }))

  /**
  try {
    const defaultLabelsFromEcs = await metrics.getDefaultLabelsFromEcs()
    app.use(metrics({ defaultLabelsFromEcs }))
  } catch (error) {
    process.exit(1)
  }
  */

  app.get('/hello', helloController.showHelloPage)

  app.listen(PORT, () => console.log(`Listening on ${PORT}`))
}


setup()
