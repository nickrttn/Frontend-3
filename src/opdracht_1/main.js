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

// Create a D3 queue
const q = d3.queue();

q.defer(d3.json, 'mood.json');
q.defer(d3.json, 'steps.json');
q.await((error, mood, steps) => {
	const moodFiltered = mood.filter(obj => { if (obj.value) return obj });
	const stepsFiltered = mood.filter(obj => { if (obj.value) return obj });
});

d3.json('data.json', (data) => {
	// Create real date objects from simple date strings
	const dateFormat = d3.timeFormat('%a');
	const datums = data.datums.map(date => new Date(date));

	// Coerce geluk and stappen to numbers just to be sure
	const geluk = data.geluk.map(geluk => +geluk);
	const stappen = data.stappen.map(stappen => +stappen);

	// And normalize it back together
	const coercedData = { geluk, stappen };

	// Set up bar styles
	const barWidth = chartWidth / (data.datums.length * 4);

	// Create axis' functions and orientations
	const x  = d3.scaleTime().domain([d3.min(datums), d3.max(datums)]).range([0, w]);
	const y1 = d3.scaleLinear().domain([0, d3.max(geluk)]).range([h, 0]);
	const y2 = d3.scaleLinear().domain([0, d3.max(stappen)]).range([h, 0]);

	const xAxis  = d3.axisBottom(x).tickFormat(dateFormat);
	const y1Axis = d3.axisLeft(y1).ticks(5);
	const y2Axis = d3.axisRight(y2).ticks(5);

	// Add axis' to the SVG
	chart.append('g')
			 .attr('class', 'x-axis')
			 .attr('transform', `translate(${barWidth}, ${h + barWidth})`)
			 .call(xAxis);

	chart.append('g')
			 .attr('class', 'y1-axis')
			 .attr('transform', `translate(${barWidth}, ${barWidth})`)
			 .call(y1Axis);

	chart.append('g')
			 .attr('class', 'y2-axis')
			 .attr('transform', `translate(${w + barWidth}, ${barWidth})`)
			 .call(y2Axis);

	// Draw the actual bars and labels
	Object.keys(coercedData).forEach((key, index) => {
		const bars = chart.selectAll(`.data-${key}`)
			.data(coercedData[key])
		  .enter().append('g')
			  .attr('class', `data-${key}`)
			  .attr('transform', (d, i) => index ? `translate(${ x(datums[i]) + barWidth * 1.85 }, 0)` :
																						 `translate(${ x(datums[i]) + barWidth * 2.65 }, 0)`) ;
																						 // This works because 0 is falsy

		bars.append('rect')
				.attr('y', d => key === 'geluk' ? y1(d) + barWidth : y2(d) + barWidth)
				.attr('height', d => key === 'geluk' ? h - y1(d) : h - y2(d))
				.attr('width', barWidth);

		chart.append('text')
		 .attr('class', `${key}-label`)
		 .attr('transform', () => key === 'geluk' ? `translate(0, ${barWidth/2})` : `translate(${w}, ${barWidth/2})`)
		 .attr('fill', () => key === 'geluk' ? 'mediumblue' : 'crimson')
		 .text(key)
		 .attr('font-size', '9');
	});
});
