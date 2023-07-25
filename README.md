# express-promethus-proof-of-concept

Small wrapper around the `prom-client` library to expose a `/metrics` endpoint 
that reports on the express response middleware stack.

Has a placeholder mechanism for requiring default metric labels which would
be fetched from the apps ECS context.

Uses `on-finished` and `prom-client` timers to measure how long each response
takes, also relied on by the express project.

Exposes the `prom-client` used by the library to allow other parts of the code
to record custom metrics which are uniformly reported by the `/metrics` endpoint.

## Try it out

```bash
npm i
npm start

curl http://localhost:8100/hello
curl http://localhost:8100/metrics
```
