// Laad hier de data in
d3.json('../data/data_rijksmonumenten.json', data => {
	console.log(data);
});

d3.html('../data/data_buurtnamenEnschede.html', data => {
	console.log(data);
});

// ssv stands for Semicolon Separated Values
const ssv = d3.dsvFormat(';');
d3.request('../data/data_hotelsAmsterdam.csv')
  .mimeType('text/plain')
	.get(data => {
		console.log(ssv.parse(data.response));
	});

d3.xml('../data/data_veiligstallen.xml', data => {
	console.log(data);
})
