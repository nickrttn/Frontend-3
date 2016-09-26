/* global document, d3 */
/*eslint no-confusing-arrow: ["error", {allowParens: true}]*/
const defaultMargin = 48;

// DOM stuff
const chartWidth = document.querySelector('.bar-chart').clientWidth;
const chartHeight = document.querySelector('.bar-chart').clientHeight;
const w = chartWidth - (defaultMargin * 2) - (defaultMargin * 2);
const h = chartHeight - (defaultMargin * 2) - (defaultMargin * 2);

// D3.js selectors
const chart = d3.select('.bar-chart');

// Create a D3 queue
const q = d3.queue();

// Add JSON files to the queue
q.defer(d3.json, 'mood.json');
q.defer(d3.json, 'steps.json');

q.await((error, mood, steps) => {
  // Filter all the objects that have null for a value
  // and concatenate the two files together in a very ugly
  // nested loop
  const data = []

  mood.forEach(moodObj => {
    if (moodObj.value) {
      const obj = {
        date: Date(moodObj.date),
        mood: Number(moodObj.value),
      };

      steps.forEach(stepsObj => {
        if (stepsObj.date === obj.date) {
          obj.steps = Number(stepsObj.value);
        }
      });

      data.push(obj);
    }
  });

  // Create real date objects from simple date strings
  const dateFormat = d3.timeFormat('%a %e');
  const dates = moodFiltered.map(obj => new Date(obj.date));

  // Coerce values to numbers
  const geluk = moodFiltered.map(obj => Number(obj.value));
  const stappen = stepsFiltered.map(obj => Number(obj.value));

  // And put it back together
  const coercedData = { dates, geluk, stappen };

  // Set up bar styles
  const barWidth = chartWidth / (dates.length * 4);

  // Create axis' functions and orientations
  const x = d3.scaleTime().domain([d3.min(coercedData.dates), d3.max(coercedData.dates)]).range([0, w]);
  const y1 = d3.scaleLinear().domain([0, d3.max(coercedData.geluk)]).range([h, 0]);
  const y2 = d3.scaleLinear().domain([0, d3.max(coercedData.stappen)]).range([h, 0]);

  const xAxis = d3.axisBottom(x).tickFormat(dateFormat);
  const y1Axis = d3.axisLeft(y1).ticks(5);
  const y2Axis = d3.axisRight(y2).ticks(5);

  // Add axis' to the SVG
  chart.append('g')
       .attr('class', 'x-axis')
       .attr('transform', `translate(${barWidth}, ${h + barWidth})`)
       .call(xAxis)
       .selectAll('.x-axis text')
       .attr('transform', `translate(${barWidth/2}, 0)`);

  chart.append('g')
       .attr('class', 'y1-axis')
       .attr('transform', `translate(${barWidth}, ${barWidth})`)
       .call(y1Axis);

  chart.append('g')
       .attr('class', 'y2-axis')
       .attr('transform', `translate(${w + defaultMargin}, ${barWidth})`)
       .call(y2Axis);

  // Draw the actual bars and labels
  Object.keys(coercedData).forEach((key, index) => {
    const bars = chart.selectAll(`.data-${key}`)
      .data(coercedData[key])
      .enter().append('g')
        .attr('class', `data-${key}`)
        .attr('transform', (d, i) => (index ? `translate(${x(dates[i]) + barWidth}, 0)` :
                                                     `translate(${x(dates[i]) + (barWidth * 1.75)}, 0)`));
                                             // This works because 0 is falsy

    bars.append('rect')
        .attr('y', d => (key === 'geluk' ? y1(d) + barWidth : y2(d) + barWidth))
        .attr('height', d => (key === 'geluk' ? h - y1(d) : h - y2(d)))
        .attr('width', barWidth);

    chart.append('text')
     .attr('class', `${key}-label`)
     .attr('transform', () => (key === 'geluk' ? `translate(0, ${barWidth/2})` : `translate(${w}, ${barWidth/2})`))
     .attr('fill', () => (key === 'geluk' ? 'mediumblue' : 'crimson'))
     .text(key)
     .attr('font-size', '9');
  });
});
