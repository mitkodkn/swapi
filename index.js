const Koa = require('koa')
const Router = require('koa-router');
const json = require('koa-json')
const { print, chalk: { yellow } } = require('@ianwalter/print')
const pkg = require('./package.json')
const fs = require('fs')
const path = require('path')

// Create the Koa app instance.
const app = new Koa()
const router = new Router();

// Add error-handling middleware.
app.use(async function errorHandlingMiddleware (ctx, next) {
  try {
    await next()
  } catch (err) {
    print.error(err)
    ctx.status = err.statusCode || err.status || 500
  }
})

// Use middleware that automatically pretty-prints JSON responses.
app.use(json())

// Add the Access-Control-Allow-Origin header that accepts all requests to the
// response.
app.use(async function disableCorsMiddleware (ctx, next) {
  ctx.set('Access-Control-Allow-Origin', '*')
  return next()
})

// Create the router instance.
const specifiedPort = process.env.SWAPI_PORT

const endpoints = fs
    .readdirSync(path.resolve(__dirname + '/data'))
    .map(file => {
      return ({
        path: file.replace('.json', ''),
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname + `/data/${file}`)).toString())
      });
    });

endpoints.forEach(({ path, data }) => {
  router.get(`/api/${path}`, (ctx) => {
    const page = parseInt(ctx.query.page) || 1
    ctx.body = {
      count: data.length,
      results: data.slice((page - 1) * 10, page * 10).map(p => p.fields)
    }
  })

  router.get(`/api/${path}/:id`, (ctx, next) => {
    console.log('ctx', ctx.params.id)
    console.log(data);
    ctx.body = data.find(d => d.pk === parseInt(ctx.params.id)).fields
    console.log(ctx.body)
  })
})

// Add a 404 Not Found handler that is executed when no routes match.
function notFoundHandler (ctx) {
  ctx.status = 404
}

// Handle the request by allowing the router to route it to a handler.
// app.use(ctx => router.match(ctx, notFoundHandler))
app.use(router.routes())

// Start listening on the specified (or randomized) port.
const server = app.listen(specifiedPort)
const { port } = server.address()
print.log('💫', yellow(`Let the force be with you: http://localhost:${port}`))

module.exports = server
