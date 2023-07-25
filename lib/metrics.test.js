const express = require('express')
const request = require('supertest')

const metrics = require('./metrics')

describe('metrics middleware', () => {
  beforeEach(() => metrics.promClient.register.clear())

  test('exposes a /metrics page', (done) => {
    const app = express()

    app.use(metrics({ fetchDefaultLabelsFromEcs: true }))

    request(app)
      .get('/metrics')
      .expect(200)
      .end((error, response) => done())
  })

  test('includes default prometheus metrics', (done) => {
    const app = express()
    const spy = jest.spyOn(metrics.promClient, 'collectDefaultMetrics')

    metrics.getDefaultLabelsFromEcs()
      .then((defaultLabelsFromEcs) => {
        app.use(metrics({ defaultLabelsFromEcs }))

        expect(spy).toHaveBeenCalled()

        request(app)
          .get('/metrics')
          .end((error, response) => {
            expect(response.text).toMatch(/process_cpu_system_seconds_total/)
            done()
          })
      })
  })

  test('includes express metrics', (done) => {
    const app = express()

    metrics.getDefaultLabelsFromEcs()
      .then((defaultLabelsFromEcs) => {
        app.use(metrics({ defaultLabelsFromEcs }))

        request(app)
          .get('/somethingelse')
          .end((error, response) => {
            request(app)
              .get('/metrics')
              .end((error, response) => {
                expect(response.text).toMatch(/express_http/)
                expect(response.text).toMatch(/somethingelse/)
                done()
              })
            })
      })
  })

  test('fails to start without providing default labels or explicitly configuring them to be fetched by the library', () => {
    expect(() => {
      metrics()
    }).toThrow('ECS labels are required')
  })
})
