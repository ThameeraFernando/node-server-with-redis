const express = require("express");
const axios = require("axios");
const redis = require("redis");

const app = express();
const PORT = process.env.PORT || 3000;

let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => {
    console.error(`Error:${error}`);
  });
  await redisClient.connect();
})();

// fetch data from api
const fetchApiData = async (species) => {
  const apiResponse = await axios.get(
    `https://www.fishwatch.gov/api/species/${species}`
  );
  console.log("Request send to the API");
  return apiResponse.data;
};

// get species controller
const getSpeciesData = async (req, res) => {
  const species = req.params.species;
  let result;
  try {
    result = await fetchApiData(species);
    if (result.length === 0) {
      throw "API returned an empty array";
    }
    await redisClient.set(species, JSON.stringify(result), {
      EX: 180,
      NX: true,
    });

    res.send({
      fromCache: false,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("Data unavailable");
  }
};

// cache middleware
const cacheMiddleware = async (req, res, next) => {
  const species = req.params.species;
  let result;
  try {
    const cacheData = await redisClient.get(species);
    if (cacheData) {
      result = JSON.parse(cacheData);
      res.send({ fromCache: true, data: result });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404);
  }
};

// get route
app.get("/fish/:species", cacheMiddleware, getSpeciesData);

app.listen(PORT, () => {
  console.log(`Server running on the port ${PORT}`);
});
