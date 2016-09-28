/* global document, d3 */
/*eslint no-confusing-arrow: ["error", {allowParens: true}]*/

// DOM stuff
const chartWidth = document.querySelector('.drawing-area').clientWidth;
const chartHeight = document.querySelector('.drawing-area').clientHeight;

// I want margins to be 2.5% of my drawing area
const margin = {
  top: chartHeight / 100 * 2.5,
  right: chartWidth / 100 * 2.5,
  bottom: chartHeight / 100 * 2.5,
  left: chartWidth / 100 * 2.5,
};

const w = chartWidth - margin.right - margin.left;
const h = chartHeight - margin.top - margin.bottom;

// Fancy date formatter
  const dateFormat = d3.timeFormat('%a %e');

// D3.js selectors
const svg = d3.select('.drawing-area');

// Create a D3 queue
const q = d3.queue();

// Add JSON files to the queue
q.defer(d3.json, 'mood.json');
q.defer(d3.csv, 'kit.csv');

q.await((error, mood, kit) => {
  // Filter and normalize the mood data by
  // removing null values and renaming some stuff
  // to make the keys less generic.
  const moodProcessed = [];
  mood.forEach((obj) => {
    if (obj.value) {
      moodProcessed.push({
        date: new Date(obj.date),
        mood: parseInt(obj.value, 10),
      });
    }
  });

  // Get all the datetimes from moodProcessed;
  const moodDates = moodProcessed.map(obj => obj.date);

  // Use them to create a time scale
  const x = d3.scaleTime().domain(d3.extent(moodDates)).range([0, chartWidth]);

  // The time scale is the x axis
  const xAxis = d3.axisBottom(x).ticks(moodProcessed.length).tickFormat(dateFormat);

  svg.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(${margin.left}, ${(h / 2) + margin.top})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'whole-day-rectangles')
    .selectAll('rect')
    .data(moodProcessed)
    .enter()
    .append('rect')
      .attr('width', 6)
      .attr('height', (h - margin.top) / 2)
      .attr('x', d => -4 + margin.left + x(d.date))
      .attr('y', margin.top)
      .attr('class', d => `mood-${d.mood}`);
});
