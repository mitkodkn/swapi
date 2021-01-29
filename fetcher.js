const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const entity = process.env.ENTITY;

(async () => {
  let data,
    results = [],
    page = 1;

  do {
    const response = await fetch(
      `https://swapi.dev/api/${entity}?page=${page++}`
    );
    data = await response.json();
    results = results.concat(data.results);
  } while (data.next);

  const entityFile = path.resolve(__dirname + `/data/${entity}.json`);
  const content = JSON.parse(fs.readFileSync(entityFile).toString());
  content.results = results;

  fs.writeFileSync(
    entityFile,
    JSON.stringify(content, null, 4).replace(
      /http:\/\/swapi.dev\/api\//g,
      "https://swapi.booost.bg/api/"
    )
  );
})();
