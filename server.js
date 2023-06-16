const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const fetchApiData = async (species) => {
  const apiResponse = await axios.get(
    `https://www.fishwatch.gov/api/species/${species}`
  );
  console.log("Request send to the API");
  return apiResponse.data;
};

const getSpeciesData = async (req, res) => {
  const species = req.params.species;
  let result;
  try {
    result = await fetchApiData(species);
    if (result.length === 0) {
      throw "API returned an empty array";
    }
    res.send({
      fromCache: false,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("Data unavailable");
  }
};

app.get("/fish/:species", getSpeciesData);

app.listen(PORT, () => {
  console.log(`Server running on the port ${PORT}`);
});
