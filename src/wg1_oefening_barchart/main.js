// Static data
const data = {
	j: [1, 1, 2, 3, 4, 5, 4, 3, 1],
	m: [1, 0, 1, 2, 3, 4, 5, 4, 2]
}

const margin = {
	top: 48,
	right: 48,
	bottom: 48,
	left: 48
};

// DOM stuff
const chartWidth = document.querySelector('.bar-chart').clientWidth;
const chartHeight = document.querySelector('.bar-chart').clientHeight;
const w = chartWidth - margin.left * 2 - margin.right * 2;
const h = chartHeight - margin.top * 2 - margin.bottom * 2;

// D3.js selectors
const chart = d3.select('.bar-chart');

// D3.js setup
const x = d3.scaleLinear().domain([0, 9]).range([0, w]);
const y = d3.scaleLinear().domain([0, 7]).range([h, 0]);

const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y).ticks(7);

const barWidth = chartWidth / (data.j.length * 4);

chart.append('g')
		 .attr('class', 'x-axis')
		 .attr('transform', `translate(${barWidth}, ${h + barWidth})`)
		 .call(xAxis);

 chart.append('g')
 		 .attr('class', 'y-axis')
		 .attr('transform', `translate(${barWidth}, ${barWidth})`)
 		 .call(yAxis);

const dataJ = chart.selectAll('.data-j')
									 .data(data.j)
									 .enter().append('g')
								 	 .attr('class', 'data-j')
									 .attr('transform', (d, i) => `translate(${ x(i + 1) + .15 * barWidth}, 0)`);

dataJ.append('rect')
		 .attr('y', d => y(d) + barWidth)
		 .attr('height', d => h - y(d))
		 .attr('width', barWidth);

dataJ.append('text')
		 .attr('y', d => y(d) + barWidth * 1.75)
		 .attr('dx', barWidth / 2)
	   .text(d => d);

const dataM = chart.selectAll('.data-m')
									 .data(data.m)
									 .enter().append('g')
								 	 .attr('class', 'data-m')
									 .attr('transform', (d, i) => `translate(${ x(i + 1) + .85 * barWidth}, 0)`);

 dataM.append('rect')
 		 .attr('y', d => y(d) + barWidth)
 		 .attr('height', d => h - y(d))
 		 .attr('width', barWidth);

 dataM.append('text')
 		 .attr('y', d => y(d) + barWidth * 1.75)
 		 .attr('dx', barWidth / 2)
 	   .text(d => d);
