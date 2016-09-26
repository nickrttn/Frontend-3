/* global document, d3 */
/* eslint no-confusing-arrow: ["error", {allowParens: true}]*/
const defaultMargin = 48;

// DOM stuff
const chartWidth = document.querySelector('.bubble-chart').clientWidth;
const chartHeight = document.querySelector('.bubble-chart').clientHeight;
const w = chartWidth - (defaultMargin * 2) - (defaultMargin * 2);
const h = chartHeight - (defaultMargin * 2) - (defaultMargin * 2);

// D3.js selectors
const chart = d3.select('.bubble-chart');

const data = [
  {
    mood: 5,
    value: 14,
  }, {
    mood: 4,
    value: 23,
  }, {
    mood: 3,
    value: 13,
  }, {
    mood: 2,
    value: 2,
  }, {
    mood: 1,
    value: null,
  },
];

const root = d3.hierarchy({ children: data }).sum(d => d.value).sort(d => d.value);

const bubble = d3.pack()
                 .size([chartHeight, chartHeight])
                 .padding(defaultMargin/3);
                 // .radius(() => chartHeight / 2);

bubble(root);

// Add JSON files to the queue
const bubbles = chart.append('g')
                     .attr('class', 'bubbles')
                     .selectAll('g')
                     .data(root.children)
                     .enter().append('g')
                       .attr('transform', d => `translate(${d.x}, ${d.y})`)
                       .attr('class', 'node');

bubbles.append('circle')
       .attr('id', d => `node-${d.data.mood}`)
       .attr('r', d => d.r);

bubbles.append('clipPath')
    .attr('id', d => `clip-${d.data.mood}`)
    .append('use')
    .attr('xlink:href', d => `#node-${d.data.mood}`);

bubbles.append('text')
       .attr('clip-path', d => `url(#clip-${d.data.mood})`)
       .text(d => `${Math.round(d.data.value / 52 * 100)}%`);
