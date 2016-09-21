// Maak een SVG, stel de marges in, bereken de dimensies van de grafiek en maak wat hulpvariabelen
var svg = d3.select('main').append('svg').attr('width', 900).attr('height', 600),
    margin = {top:20, right:20, bottom:70, left:65},
    g = svg.append('g').attr('transform', 'translate('+margin.left+', '+margin.top+')'),
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom;

d3.json('https://spreadsheets.google.com/feeds/list/1kSvyHeiYbjXbDZIvX-rmXzQi-SQY4z4MSA-R4QVpI0Y/od6/public/values?alt=json', function(data){
    
    // even checken hoe de data eruit ziet
    // console.log(data);

    // Eerst schoonmaken
    data = cleanGoogleSheetsJSON(data);
    data = convertValueToNumber(data, 'waarde'); // deze hebben we als number nodig

    // even checken hoe de data eruit ziet
    // console.log(data);

    // Nesten op de waarden die we willen plotten
    var nest = d3.nest()
        .key(function(d){
            return d.perioden;
        })
        // .key(function(d){return d.onderwijssoort;}) // je kunt meer dan 1 dimensie nesten, maar de berekening wordt dan per dimensie ingewikkelder
        // .key(function(d){return d.diploma})
        .entries(data);

    // even checken hoe de geneste data er uit ziet
    // console.log(nest);

    // Filteren op de diplomasoorten die we willen plotten
    nest = nest.map(function(d){ // map neemt een array, trekt over elke waarde een functie en returned een array met dezelfde lengte.
        d.values = d.values.filter(function(d){ // filter neemt een array, trekt over elke waarde een functie en returned die waarden die aan de voorwaarden voldoen.
            return d.diploma === 'Bachelor' || // filter op combinaties van waarden
                d.diploma === 'Wo-master' && d.onderwijssoort === 'Wetenschappelijk onderwijs' ||
                d.diploma === 'Doctoraal' && d.onderwijssoort === 'Wetenschappelijk onderwijs';

            // Nog 2 manieren om te filteren
            // return ['Bachelor', 'Doctoraal', 'Vervolgopleidingen'].indexOf(d.diploma) !== -1; // filter op 1 waarde
            // return true; // of filter niet!
        });
        return d;
    });

    // even checken hoe de gefilterde data er uit ziet
    // console.log(nest); // the easy way
    // nest.map(function(d){ console.log(d); }); // the hard way

//---------//
// SCHALEN //
//---------//

    // maak een jaarSchaal op basis van de perioden uit de dataset: 1999/'01, 2000/'01, 2001/'02 etc..
    var yearScale = d3.scale.ordinal()
        .domain(nest.map(function(d) {
            return d.key;
        }))
        .rangeBands([0, width]);

    // maak een xSchaal per periode voor de verschillende diplomasoorten (HBO en WO, bachelor en vervolg, totaal 4)
    var xScale = d3.scale.ordinal()
        .domain(nest[0].values.map(function(d){
            return d.onderwijssoort.replace(/ /g,'-')+' '+d.diploma;
        }))
        .rangeBands([0,yearScale.rangeBand()]);

    // maak een ySchaal op basis van het maximum aantal diploma's
    var yScale = d3.scale.linear()
        .domain([0, d3.max(nest.map(function(d){
            return d.values[0].waarde;
        }))])
        .range([height, 0]);

//----------//
// GEGEVENS //
//----------//

    // Teken de groups voor de jaren
    var year = g.selectAll('.year')
        .data(nest) // koppel het hele nest
        .enter()
          .append('g')
            .attr('class', 'year')
            .attr('transform', function(d){
                return 'translate('+yearScale(d.key)+',0)'; // gebruik de key met de jaarschaal om de positie te bepalen
            });

    // 'enter' de values voor elk jaar en voeg bars voor de uitgefilterde diplomasoorten toe
    year.selectAll('.bar')
        .data(function(d) { // we zitten nu in de jaar groups, gebruik de verschillende typen diplomas per onderwijssoort als data
            return d.values;
        })
        .enter()
          .append('rect')
            .attr('class', function(d){ // geef de onderwijssoort en diploma mee als class
                return 'bar '+d.onderwijssoort.replace(/ /g,'-')+' '+d.diploma;
            })
            .attr('x', function(d) {
                return xScale(d.onderwijssoort.replace(/ /g,'-')+' '+d.diploma);
            })
            .attr('y', function(d) {
                return yScale(d.waarde);
            })
            .attr('width', xScale.rangeBand())
            .attr('height', function(d) {
                return height-yScale(d.waarde);
            });

//-------//
// ASSEN //
//-------//
    
    // maak een xAs op basis van de jaarSchaal
    var yearAxis = d3.svg.axis()
        .scale(yearScale)
        .orient('bottom');

    // maak een yAs op basis van de ySchaal
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');

    // teken de yearAxis
    g.append('g')
        .attr('class', 'axis yearAxis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(yearAxis)
        .selectAll('text')
            .attr('y', 0)
            .attr('x', 9)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(90)')
            .style('text-anchor', 'start');

    // teken de yAs
    g.append('g')
        .attr('class', 'axis yAxis')
        .call(yAxis)
        .append('text')
            .style('text-anchor', 'end');

//-----------------//
// TITEL & LEGENDA //
//-----------------//
    
    // voeg een group voor de titel toe
    var title = g.append('text')
        .attr('class', 'title')
        .attr('x', 150)
        .attr('y', 10)
        .text('Invoer Bachelor/Master structuur')

    // voeg een group voor de legenda toe
    var legend = g.selectAll('.legend')
        .data(nest[0].values)
        .enter()
          .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i){
                return 'translate( 5,' + (-10+(i * 20)) + ')';
            });

    // voeg rechthoeken voor de legenda toe
    legend.append('rect')
        .attr('class', function(d){
            return 'legend '+d.onderwijssoort.replace(/ /g,'-')+' '+d.diploma;
        })
        .attr('x', 0)
        .attr('width', 18)
        .attr('height', 18);

    // en tenslotte de tekst voor de legenda
    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .text(function(d) {
            return (d.onderwijssoort==='Hoger beroepsonderwijs'?'HBO':'WO')+' '+d.diploma;
        });
});

//------------------//
// HELPER FUNCTIONS //
//------------------//

/**
 * [convertValueToNumber convert a value in a dataset to a number]
 * @param  {[type]} data         [the JSON data containing the key to convert]
 * @param  {[type]} keyToConvert [the key to convert to Number]
 * @return {[type]}              [the JSON data containing the converted Number]
 */
function convertValueToNumber(data, keyToConvert) {
    return data.map(function(entry){
        entry[keyToConvert] = entry[keyToConvert]=='-'?0:Number(entry[keyToConvert]);
        return entry;
    });
}

/**
 * [cleanGoogleSheetsJSON is a function that cleans JSON data imported from google sheets using the publish to web as json method described by https://ctrlq.org/code/20004-google-spreadsheets-json]
 * @param  {[type]} data [the JSON data to be cleaned]
 * @return {[type]}      [the cleaned JSON data]
 */
function cleanGoogleSheetsJSON(data) {
    return data.feed.entry.map(function(entry){
        // Remove these keys
        ['category', 'content', 'id', 'link', 'title', 'updated'].forEach(function(key){
            delete entry[key];
        });
        // Rename the remaining keys and hook the value directly instead of in a new object
        Object.keys(entry).map(function(key){
            entry[key.substring(4,key.length)] = entry[key].$t;
            delete entry[key];
        });
        return entry;
    });
}