/* global document, d3 */
/*eslint no-confusing-arrow: ["error", {allowParens: true}]*/
const margin = {
  top: 32,
  right: 32,
  bottom: 32,
  left: 32,
};

// DOM stuff
const chartWidth = 800;
const chartHeight = 500;
const width = chartWidth - margin.top - margin.bottom;
const height = chartHeight - margin.right - margin.left;

const title = d3.select('.charts')
                .append('h1')
                .text('Waar komen Kit & ik samen?');

// Add a SVG element to the page
const svg = d3.select('.charts')
              .append('svg')
              .attr('viewBox', `0 0 ${width} ${height}`);

// Create a D3 queue
const q = d3.queue();

// Add JSON files to the queue
q.defer(d3.csv, 'kit.csv');
q.defer(d3.json, 'mood.json');

q.await((error, kit, mood) => {
  // Normalize and concatenate data
  const moodFiltered = mood.filter(obj => obj.value);
  const moodNormalized = moodFiltered.map(obj => ({
    date: new Date(obj.date),
    value: parseInt(obj.value, 10),
  }));

  const kitNormalized = kit.map(obj => Object.assign({}, obj, {
    date: new Date(obj.datum),
    mood: parseInt(obj.gevoel, 10),
    location: obj.locatie,
  }));

  const countLocations = [[]];

  kitNormalized.forEach(obj => {
    if (countLocations[0].find(countObj => countObj.axis === obj.location)) {
      countLocations[0].forEach(countObj => {
        if (countObj.axis === obj.location) {
          countObj.value++;
        }
      });
    } else {
      countLocations[0].push({
        axis: obj.location,
        value: 1,
      });
    }
  });

  log(countLocations);

  countLocations[0] = countLocations[0].map((obj) => {
    return {
      axis: obj.axis,
      value: obj.value / kitNormalized.length,
    };
  });

});

const log = (msg) => console.log(msg);
const err = (msg) => console.error(err);
