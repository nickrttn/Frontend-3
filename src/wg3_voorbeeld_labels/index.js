/*
* Created by Laurens Aarnoudse
*/

console.log("working on loading external JSON")

var margin = {
  top: 20,
  right: 30,
  bottom: 130,
  left: 39
};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var y = d3.scale.linear()
.range([height, 0]);
var x = d3.scale.ordinal().rangeRoundBands([0, 960 - margin.right], 0);

var chart = d3.select(".chart")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("cijfersDT1.json", function(error, data) {
  //First clean the JSON (, -> . and GR -> 0)
  cleanJSON(data);
  console.log("loaded data");
  console.table(data);

  x.domain(data.map(function(d) { return d["Studienummer"]}));
  console.log(x.domain());
  y.domain([0, 10]);  //Not using D3 max because this way we can still inspire students to get a 10 ;)

  var barWidth = width / data.length;

  var bar = chart.selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", function(d, i) {
        return "translate(" + i * barWidth + ",0)";
      });

  bar.append("rect")
      .attr("y", function(d) {
        return y(d["Eerste Mondeling"]);
      })
      .attr("height", function(d) {
        return height - y(d["Eerste Mondeling"]);
      })
      .attr("width", barWidth - 1);

  bar.append("text")
      .attr("class", "barLabels")
      .attr("x", barWidth / 2)
      .attr("y", function(d) {
        return y(d["Eerste Mondeling"]) + 3;
      })
      .attr("dy", ".75em")
      .text(function(d) {
        return d.Studienummer;
      });

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .attr("dx", barWidth/2)
      .attr("dy", "2em")
      .attr("transform", "rotate(45)");

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Cijfer Deeltoets 1");
    });

function type(d) {
  console.log ("coercing to number: " + d["Eerste Mondeling"]);
  d["Eerste Mondeling"] = +d["Eerste Mondeling"]; // coerce to number
  return d;
}

function cleanJSON(data){
  data.forEach(function(d) {
    d["Eerste Mondeling"] = d["Eerste Mondeling"].replace(',', '.');
    d["Eerste Mondeling"] = d["Eerste Mondeling"].replace('GR', '0');
  });
}
