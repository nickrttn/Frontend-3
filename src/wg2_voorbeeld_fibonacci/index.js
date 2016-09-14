var fibonacci = [];

tick();

function tick() {
  fibonacci.push(
    (fibonacci[fibonacci.length - 2] || 0) +
    (fibonacci[fibonacci.length - 1] || 1)
  );
  render(fibonacci);

  setTimeout(tick, 500);
}

function render(data) {
  d3.select('main')
    .selectAll('div')
    .data(data)
    .enter()
    .append('div')
    .text(String)
    .style('background-color', function (d, i) {
      return d % 2 ? '#ff5f56' : '#27c93f';
    })
}
