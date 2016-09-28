/* global document, d3 */
/*eslint no-confusing-arrow: ["error", {allowParens: true}]*/
const defaultMargin = 48;

// DOM stuff
const chartWidth = document.querySelector('.drawing-area').clientWidth;
const chartHeight = document.querySelector('.drawing-area').clientHeight;
const w = chartWidth - (defaultMargin * 2) - (defaultMargin * 2);
const h = chartHeight - (defaultMargin * 2) - (defaultMargin * 2);

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

  // Filter and normalize data about Kit by
  // removing some (for now) unneeded cruft and
  // renaming some stuff to English for consistency.
  const kitProcessed = [];
  kit.forEach((obj) => {
    if (obj.gevoel) {
      kitProcessed.push({
        date: new Date(obj.datum),
        mood: parseInt(obj.gevoel, 10),
        activity: obj.activiteit,
        location: obj.locatie,
      });
    }
  });

  // For the first chart, count how often a
  // certain mood occurs in moodProcessed.
  const moodCounted = [];
  moodProcessed.forEach((obj) => {
    const countIndex = moodCounted.findIndex(countObj => countObj.mood == obj.mood);

    // If we get into this conditional,
    // halt execution of the loop.
    if (countIndex === -1) {
      return moodCounted.push({
        mood: obj.mood,
        count: 1,
      });
    }

    // If we don't get into the conditional,
    // simply add 1 to the relevant count.
    // Return false to appease eslint.
    moodCounted[countIndex].count += 1;
    return false;
  });

  // Create a D3 hierarchy out of my general mood data.
  const hierarchicalCount = d3.hierarchy({ children: moodCounted })
    .sum(d => d.count).sort(d => d.mood);

  // Create a packing layout function based on my chart
  const bubble = d3.pack()
    .size([chartHeight, chartHeight])
    .padding(defaultMargin / 3);

  // Pack the hierarchical data (give it x/y and r values)
  bubble(hierarchicalCount);

  // Add the first circle packing layout to the drawing area.
  // Mood Circles sounds like a great name for a product.
  const moodCircles = svg.append('g')
    .attr('class', 'whole-day')
    .selectAll('g')
    .data(hierarchicalCount.children)
    .enter().append('g')
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .attr('class', 'node');

  moodCircles.append('circle')
    .attr('class', d => `mood-${d.data.mood}`)
    .attr('id', d => `node-${d.data.mood}`)
    .attr('r', d => d.r);

  moodCircles.append('clipPath')
    .attr('id', d => `clip-${d.data.mood}`)
    .append('use')
    .attr('xlink:href', d => `#node-${d.data.mood}`);

  moodCircles.append('text')
    .attr('clip-path', d => `url(#clip-${d.data.mood})`)
    .attr('y', 10)
    .attr('text-anchor', 'middle')
    .text(d => `${Math.round((d.data.count / 52) * 100)}%`);
});
