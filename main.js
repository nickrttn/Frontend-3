/* global document, d3 */
/* eslint
    arrow-parens: 0,
    newline-per-chained-call: 0,
    no-confusing-arrow: 0,
    no-use-before-define: 0,
    no-console: 0
*/

// Utility functions
const addTimeToDate = (time) => {
  // Return nothing when no time is given
  if (!time) {
    return false;
  }

  // Create a new date object with the date of today
  const dateWithTime = new Date();

  // Set the hours and minutes
  dateWithTime.setHours(time.split(':')[0]);
  dateWithTime.setMinutes(time.split(':')[1]);

  return dateWithTime;
};

// Vanilla DOM selector stuff
const chartSize = document.querySelector('.drawing-area').getBoundingClientRect();
const { width: chartWidth, height: chartHeight } = chartSize;

const kitButton = document.querySelector('#activities-kit');
const wholeDaysButton = document.querySelector('#whole-day');
const activitiesButton = document.querySelector('#activities');

// D3.js DOM selectors
const svg = d3.select('.drawing-area');

// I want most margins to be 2.5% of my drawing area
const margin = {
  top: chartHeight * 0.025,
  right: chartWidth * 0.025,
  bottom: chartHeight * 0.025,
  left: chartWidth * 0.05,
};

// Calculate the bounds of my drawing area
const w = chartWidth - margin.right - margin.left;
const h = chartHeight - margin.top - margin.bottom;

// Set d3's default locale to nl_NL
d3.timeFormatDefaultLocale({
  dateTime: '%a %e %B %Y %T',
  date: '%d-%m-%Y',
  time: '%H:%M:%S',
  periods: ['AM', 'PM'],
  days: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'],
  shortDays: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'],
  months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  shortMonths: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
});

// Create date and time formatters
const dateFormat = d3.timeFormat('%a %e %b');
const timeFormat = d3.timeFormat('%H:%M');

// Global variables
let firstRender = true;
let dataGroup;
let brushGroup;
let dataDrawingArea;
let brushDrawingArea;
let timeAxisDrawn;
let x;
let xAxis;
let xAxisBrush;
let y;
let yAxis;
let xBrush;
let yBrush;
let normalizedData;

// Create a D3 queue
const q = d3.queue();

// Add JSON files to the queue
q.defer(d3.json, 'mood.json');
q.defer(d3.csv, 'kit.csv');

// When the queue completes, execute the callback
q.await(render);

// Bind event listeners
kitButton.addEventListener('click', kitRender, false);
wholeDaysButton.addEventListener('click', daysRender, false);
activitiesButton.addEventListener('click', activitiesRender, false);

// Filter defaults
let kitActivities = false;
let wholeDays = false;
let activities = false;

function render(err, mood, kit) {
  if (err) {
    console.error(err);
  }

  // Normalize the mood data by converting null values
  // to 0, some type conversion and renaming some stuff
  // to make the keys less generic.
  normalizedData = [];
  mood.forEach((obj) => {
    if (obj.value) {
      normalizedData.push({
        date: new Date(obj.date),
        mood: parseInt(obj.value, 10),
        activities: [],
      });
    }
  });

  // Append data about Kit to the normalizedData array, at the correct date
  kit.forEach((kitObj) => {
    // Date objects do not compare as they are never the same.
    // They have to be coerced to Number objects to compare them.
    // The native getTime() function returns the number of ms since 1 jan 1970,
    // making Date objects comparable by essentially turning them into Numbers.
    const kitDate = new Date(kitObj.datum).getTime();

    normalizedData.forEach((normObj, i, arr) => {
      const normDate = normObj.date.getTime();

      if (kitDate === normDate) {
        arr[i].activities.push({
          activity: kitObj.activiteit,
          mood: parseInt(kitObj.gevoel, 10) || 0,
          location: kitObj.locatie,
          from: addTimeToDate(kitObj.van),
          until: addTimeToDate(kitObj.tot),
        });
      }
    });
  });

  createDrawingAreas();
  drawAxis();
  createBrush();

  // Draw empty groups into the drawing area
  dataDrawingArea.selectAll('g')
    .data(normalizedData)
    .enter().append('g')
      .attr('transform', d => `translate(${(x(d.date))}, 0)`)
      .attr('class', 'mood-groups');

  // Add a line to the midday mark for easy reference
  dataDrawingArea.append('line')
    .attr('x1', margin.left)
    .attr('x2', chartWidth)
    .attr('y1', y(addTimeToDate('12:00')) + margin.top)
    .attr('y2', y(addTimeToDate('12:00')) + margin.top)
    .attr('class', 'noon');

    // Draw empty groups into the brush area
  brushDrawingArea.selectAll('g')
    .data(normalizedData)
    .enter().append('g')
      .attr('transform', d => `translate(${(xBrush(d.date))}, 0)`)
      .attr('class', 'mood-groups');

  // Render the days by default
  daysRender();
}

function createDrawingAreas() {
  dataGroup = svg.append('g')
    .attr('class', 'data');

  dataGroup.append('clipPath')
    .attr('id', 'drawing-area__clip')
    .append('rect')
      .attr('width', w)
      .attr('height', (h / 1.5) + 20)
      .attr('x', margin.left)
      .attr('y', 0);

  dataDrawingArea = dataGroup.append('g')
    .attr('clip-path', 'url(#drawing-area__clip)')
    .attr('class', 'drawing-area__data')
    .attr('transform', `translate(${margin.left}, 0)`);
}

function createBrush() {
  // Create a brush
  const brush = d3.brushX()
    .extent([[0, 0], [w / 2, (h / 10) - margin.top]])
    .on('brush', brushed);

  brushGroup = svg.append('g')
      .attr('class', 'brush')
      .attr('transform', `translate(${(chartWidth / 4) + margin.left}, ${(h / 1.5) + (margin.bottom * 4)})`);

  brushDrawingArea = brushGroup.append('g')
    .attr('class', 'drawing-area__brush');

// Add the xBrush axis to the brush area
  brushGroup.append('g')
    .attr('class', 'axis axis--x axis--brush')
    .attr('transform', `translate(0, ${(h / 12)})`)
    .call(xAxisBrush);

  // Add the actual brush to the brush area
  brushGroup.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, xBrush.range());
}

function drawAxis() {
  // Create a x-axis based on the dates from the mood data
  x = d3.scaleTime().domain(d3.extent(normalizedData, obj => obj.date)).range([0, w]).nice();
  xAxis = d3.axisBottom(x).tickFormat(dateFormat);

  xBrush = d3.scaleTime().domain(x.domain()).range([0, w / 2]);
  xAxisBrush = d3.axisBottom(xBrush).tickFormat(dateFormat);

  // Create a y-axis based on the 'from' times from the Kit data
  y = d3.scaleTime().domain([addTimeToDate('05:00'), addTimeToDate('21:00')]).range([h / 1.5, 0]);
  yAxis = d3.axisLeft(y).ticks(5).tickFormat(timeFormat);
  yBrush = d3.scaleTime().domain(y.domain()).range([(h / 10) - margin.top, 0]);

  if (firstRender) {
    // Add the x axis to the drawing area
    dataGroup.append('g')
      .attr('class', 'axis axis--x')
      .attr('clip-path', 'url(#drawing-area__clip)')
      .attr('transform', `translate(${margin.left}, ${(h / 1.5)})`)
      .call(xAxis);

    // Add the y axis to the drawing area
    dataGroup.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(${margin.left * 1.75}, ${margin.top})`)
      .call(yAxis);

    firstRender = false;
  } else {
    dataGroup.select('.axis--x').call(xAxis);
    dataGroup.select('.axis--y').call(yAxis);
  }

  timeAxisDrawn = true;
}

function brushed() {
  const selection = d3.event.selection;
  x.domain(selection.map(xBrush.invert, xBrush));

  // Set both filters to false
  wholeDays = false; kitActivities = false;

  // Draw new groups into the drawing area
  dataDrawingArea.selectAll('g')
    .attr('transform', d => `translate(${margin.left + x(d.date)}, 0)`);

  // Draw a new x-axis
  dataGroup.select('.axis--x').call(xAxis);
}

function daysRender() {
  if (!timeAxisDrawn) drawAxis();
  if (activities) kitRender();

  if (wholeDays) {
    [dataDrawingArea, brushDrawingArea].forEach(group => {
      group.selectAll('g')
        .selectAll('rect')
        .transition().duration(250)
        .attr('width', 0)
        .remove();
    });
  } else {
    [dataDrawingArea, brushDrawingArea].forEach((group, index) => {
      group.selectAll('g').append('rect')
          .attr('class', d => `mood-${d.mood}`)
          .attr('height', () => index === 0 ? (h / 1.5) : (h / 10) - margin.top)
          .transition()
          .duration(250)
            .attr('width', () => index === 0 ? 10 : 4);
    });
  }

  wholeDays = !wholeDays;
}

function kitRender() {
  if (!timeAxisDrawn) drawAxis();

  if (kitActivities) {
    [dataDrawingArea, brushDrawingArea].forEach(group => {
      group.selectAll('g')
        .selectAll('circle')
        .transition().duration(250)
        .attr('cy', 0)
        .remove();
    });
  } else if (activities) {
    [dataDrawingArea, brushDrawingArea].forEach((group, index) => {
      group.selectAll('g')
        .selectAll('circle')
          .transition()
          .duration(250)
          .attr('cy', d => index === 0 ? y(d.from) : yBrush(d.from));
    });

    activities = false;
  } else {
    [dataDrawingArea, brushDrawingArea].forEach((group, index) => {
      group.selectAll('g')
        .selectAll('circle')
          .data(d => d.activities)
          .enter().append('circle')
          .attr('class', d => `mood-${d.mood}`)
          .attr('r', () => index === 0 ? 6 : 2)
          .attr('cx', 14)
          .attr('cy', (h / 1.5) - margin.top)
          .transition()
          .duration(250)
          .attr('cy', d => index === 0 ? y(d.from) : yBrush(d.from));
    });
  }

  // Add a handler for mouse-over tooltips
  dataDrawingArea.selectAll('circle')
    .on('mouseover', (d) => addTooltip(d))
    .on('mouseleave', () => d3.selectAll('.tooltip').remove());

  kitActivities = !kitActivities;
}

function activitiesRender() {
  if (wholeDays) daysRender();

  // Remove the midday line
  dataDrawingArea.select('.noon').transition().duration(250).remove();

  // Remove the x axis
  svg.select('.axis--x').remove();

  // Put activities into an array for creating an axis
  const activitiesFiltered = [];
  normalizedData.forEach(obj => {
    obj.activities.forEach(act => {
      if (activitiesFiltered.indexOf(act.activity) === -1) {
        activitiesFiltered.push(act.activity);
      }
    });
  });

  const range = activitiesFiltered.map((val, index) => {
    return parseInt(index * ((h / 1.5) / activitiesFiltered.length), 10);
  });

  const brushRange = activitiesFiltered.map((val, index) => {
    return parseInt(index * (((h / 10) - margin.top) / activitiesFiltered.length), 10);
  });

  // Create an ordinal axis
  y = d3.scaleOrdinal().domain(activitiesFiltered).range(range);
  yBrush = d3.scaleOrdinal().domain(activitiesFiltered).range(brushRange);
  yAxis = d3.axisLeft(y);

  // Add the new y axis to the drawing area
  dataGroup.select('.axis--y').call(yAxis);

  [dataDrawingArea, brushDrawingArea].forEach((group, index) => {
    group.selectAll('g')
      .selectAll('circle')
        .transition()
        .duration(250)
        .attr('cy', d => index === 0 ? y(d.activity) + margin.top : yBrush(d.activity));
  });

  // Add a handler for mouse-over tooltips
  dataDrawingArea.selectAll('circle')
    .on('mouseover', (d) => addTooltip(d))
    .on('mouseleave', () => d3.selectAll('.tooltip').remove());

  // State
  kitActivities = false;
  activities = true;
  timeAxisDrawn = false;
}

function addTooltip(d) {
  // Using a regular function because of the scope of this
  d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'fixed')
    .style('left', () => `${d3.event.x + 10}px`)
    .style('top', () => `${d3.event.y + 15}px`)
    .style('opacity', 0)
    .transition().duration(200)
      .style('opacity', 1);

  d3.select('.tooltip').append('table')
    .append('tr')
      .classed('activity', true)
      .append('td')
        .append('strong')
          .text('avontuur');

  d3.select('.tooltip .activity')
    .append('td')
      .text(d.activity);

  d3.select('.tooltip table')
    .append('tr')
      .classed('location', true)
      .append('td')
        .append('strong')
          .text('plek');

  d3.select('.tooltip .location')
    .append('td')
      .text(d.location);

  d3.select('.tooltip table')
    .append('tr')
      .classed('mood', true)
      .append('td')
        .append('strong')
          .text('gevoel');

  d3.select('.tooltip .mood')
    .append('td')
      .append('svg')
        .attr('width', 24).attr('height', 24)
        .append('rect')
          .attr('x', 2).attr('y', 2)
          .attr('width', 20).attr('height', 20)
          .classed(`mood-${d.mood}`, true);
}
