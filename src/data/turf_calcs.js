const turf = require('@turf/turf')
const _ = require('lodash')
const data = require('../corona_by_zip/rona_zip2.json')
const fs = require('fs');
const path = require('path');
areas = []
for (const [key, value] of Object.entries(data.features)) {
  if(_.has(data.features[key],'geometry.coordinates')) {
    let zip = data.features[key].properties.GEOID10;
    let pop = data.features[key].properties.population;
    console.log(data.features[key].geometry.coordinates)
    let pg;
    try {
      pg = turf.polygon(data.features[key].geometry.coordinates);
    } catch (error) {
      pg = turf.polygon(data.features[key].geometry.coordinates[0]);
      console.log("ERROR")
    }


    let area = turf.area(pg)* 0.00000038610;
    areas.push({zip, area})
  }
}


fs.writeFile('areas.json', JSON.stringify(areas), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
