const Koa = require("koa");
const Router = require("koa-router");
const json = require("koa-json");
const {
  print,
  chalk: { yellow },
} = require("@ianwalter/print");
const pkg = require("./package.json");
const fs = require("fs");
const path = require("path");

// Create the Koa app instance.
const app = new Koa();
const router = new Router();

const getForPage = (page, results, perPage = 10) => {
  const firstIndex = perPage * (page - 1);
  const lastIndex = firstIndex + perPage;

  return results.slice(firstIndex, lastIndex);
};

// Add error-handling middleware.
app.use(async function errorHandlingMiddleware(ctx, next) {
  try {
    await next();
  } catch (err) {
    print.error(err);
    ctx.status = err.statusCode || err.status || 500;
  }
});

// Use middleware that automatically pretty-prints JSON responses.
app.use(json());

// Add the Access-Control-Allow-Origin header that accepts all requests to the
// response.
app.use(async function disableCorsMiddleware(ctx, next) {
  ctx.set("Access-Control-Allow-Origin", "*");
  return next();
});

// Create the router instance.
const specifiedPort = process.env.SWAPI_PORT;

router.get("/api", (ctx) => {
  ctx.body = {
    people: "https://swapi.booost.bg/api/people/",
    planets: "https://swapi.booost.bg/api/planets/",
    films: "https://swapi.booost.bg/api/films/",
    species: "https://swapi.booost.bg/api/species/",
    vehicles: "https://swapi.booost.bg/api/vehicles/",
    starships: "https://swapi.booost.bg/api/starships/",
  };
});

const endpoints = fs
  // eslint-disable-next-line no-path-concat
  .readdirSync(path.resolve(__dirname + "/data"))
  .map((file) => {
    return {
      path: file.replace(".json", ""),
      data: JSON.parse(
        fs.readFileSync(path.resolve(__dirname + `/data/${file}`)).toString()
      ),
    };
  });

endpoints.forEach(({ path, data }) => {
  router.get(`/api/${path}`, (ctx) => {
    const page = parseInt(ctx.query.page) || 1;
    const results = getForPage(page, data.results);
    const nextResults = getForPage(page + 1, data.results);

    ctx.body = {
      ...data,
      next:
        nextResults.length > 0
          ? `https://swapi.booost.bg/api/${path}?page=${page + 1}`
          : null,
      previous:
        page - 1 < 1
          ? null
          : `https://swapi.booost.bg/api/${path}?page=${page - 1}`,
      results,
    };
  });

  router.get(`/api/${path}/:id`, (ctx, next) => {
    const result = data.results.find((d) => {
      return d.url.match(/\d+/)[0] === ctx.params.id;
    });
    if (result) {
      ctx.body = result;
    } else {
      ctx.status = 404;
    }
  });
});

// Add a 404 Not Found handler that is executed when no routes match.
function notFoundHandler(ctx) {
  ctx.status = 404;
}

// Handle the request by allowing the router to route it to a handler.
// app.use(ctx => router.match(ctx, notFoundHandler))
app.use(router.routes());

// Start listening on the specified (or randomized) port.
const server = app.listen(specifiedPort);
const { port } = server.address();
print.log("💫", yellow(`Let the force be with you: http://localhost:${port}`));

module.exports = server;
