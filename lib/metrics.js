const promClient = require('prom-client')
const onFinished = require('on-finished')

const path = new RegExp('^/metrics?$')

const EXPRESS_METRIC_STATUS_CODE = 'status_code'
const EXPRESS_METRIC_HTTP_METHOD = 'http_method'
const EXPRESS_METRIC_PATH = 'path'
let defaultEcsLabels, expressMetric

function middleware(req, res, next) {
  // expose the /metrics view for prometheus
  if (req.url.match(path)) {
    res.set('Content-Type', 'text/plain')

    if (defaultEcsLabels) {
      promClient.register.metrics()
        .then((metrics) => res.send(metrics))
        .catch((error) => next(error))
    } else {
      res.sendStatus(501)
    }
    return
  }

  // track express metrics on the completion of a response, using timers
  const expressResponseMetrics = {}
  const expressMetricTimer = expressMetric.startTimer(expressResponseMetrics);
  onFinished(res, () => {
    expressResponseMetrics[EXPRESS_METRIC_STATUS_CODE] = res.statusCode
    expressResponseMetrics[EXPRESS_METRIC_HTTP_METHOD] = req.method

    // if this was a known route, use the route path which doesnt include
    // interpolated params
    // if there was no known route we don't need to know what was visited
    if (req.route) {
      expressResponseMetrics[EXPRESS_METRIC_PATH] = req.route.path
    }
    expressMetricTimer()
  })

  next()
}

function main(opts = {}) {
  promClient.collectDefaultMetrics()

  if (opts.defaultLabelsFromEcs) {
    defaultEcsLabels = opts.defaultLabelsFromEcs
    promClient.register.setDefaultLabels(defaultEcsLabels)
  }

  if (!opts.defaultLabelsFromEcs && opts.fetchDefaultLabelsFromEcs) {
    getDefaultLabelsFromEcs()
      .then((labels) => {
        defaultEcsLabels = labels
        promClient.register.setDefaultLabels(labels)
      })
      .catch((error) => console.error('Unable to start metrics'))
  }

  if (!opts.defaultLabelsFromEcs && !opts.fetchDefaultLabelsFromEcs) {
    throw new Error('ECS labels are required')
  }

  expressMetric = new promClient.Histogram({
    name: 'express_http',
    help: 'Duration of http responses',
    labelNames: [
      EXPRESS_METRIC_STATUS_CODE,
      EXPRESS_METRIC_HTTP_METHOD,
      EXPRESS_METRIC_PATH
    ]
  })

  return middleware
}

// fetches labels from ECS, called by our library or the app if wanting to
// handle errors
async function getDefaultLabelsFromEcs() {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    containerImageTag: '111122223333.dkr.ecr.us-west-2.amazonaws.com/curltest:latest',
    ecsClusterName: 'default',
    ecsServiceName: 'ecs-curltest-24-curl-cca48e8dcadd97805600',
    ecsTaskId: 'arn:aws:ecs:us-west-2:111122223333:task/default/8f03e41243824aea923aca126495f665',
    awsAccountName: 'default',
    instance: '10.0.2.100'
  }
}

main.getDefaultLabelsFromEcs = getDefaultLabelsFromEcs
main.promClient = promClient
module.exports = main
