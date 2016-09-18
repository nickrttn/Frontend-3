const handleResponse = (fiveDayForecast) => {
	const { city, list } = fiveDayForecast;
	console.log(fiveDayForecast);

	const margin = {
		top: 48,
		right: 48,
		bottom: 48,
		left: 48
	};

	const weerContainer = d3.select('main');

	weerContainer.append('h1')
	.text(`The weather in ${city.name}`)

	const weersvoorspelling = weerContainer.append('svg')
	.attr('viewBox', '0 0 800 600');

	// DOM stuff
	const chartWidth = document.querySelector('svg').clientWidth;
	const chartHeight = document.querySelector('svg').clientHeight;
	const w = chartWidth - margin.left * 2 - margin.right * 2;
	const h = chartHeight - margin.top * 2 - margin.bottom * 2;

	const fiveDayForecastTempDate = list.map(moment => ({ datetime: moment.dt_txt, temp: moment.main.temp }));
	const fiveDayForecastDateTimes = list.map(moment => moment.dt_txt);

	const x = d3.scaleOrdinal()
		.domain([d3.min(fiveDayForecastTempDate), d3.max(fiveDayForecastDateTimes)])
		.range([0, w]);

	const y = d3.scaleLinear()
		.domain([d3.min(fiveDayForecastTemperatures), d3.max(fiveDayForecastTemperatures)])
		.range([h, 0]);

	const xAxis = d3.axisBottom(x);
	const yAxis = d3.axisLeft(y).ticks(7);

	const barWidth = chartWidth / (fiveDayForecastDateTimes.length);

	weersvoorspelling.append('g')
	  .attr('class', 'x-axis')
	  .attr('transform', `translate(${barWidth}, ${h + barWidth})`)
	  .call(xAxis);

 weersvoorspelling.append('g')
 		.attr('class', 'y-axis')
		.attr('transform', `translate(${barWidth}, ${barWidth})`)
 	  .call(yAxis);

	weersvoorspelling
		.selectAll('rect')
		.data(fiveDayForecastTemperatures)
		.enter().append('rect')
			.attr('class', 'bar')
			.attr('x', d => x(d))
			.attr('y', d => y(d));


}
