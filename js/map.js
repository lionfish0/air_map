mapboxgl.accessToken = 'pk.eyJ1IjoiaXJlbWljMDEiLCJhIjoiY2l0cGx6NGloMDAwcTJ5cGZ3bnp1ZDJzdiJ9.a0Qb6q_5wUEWM3mgrA95YQ';
url = "http://54.194.132.252:8080/";
latlonVariable = [32.55,0.37];

var currentCoordinates;

var filenames = [ url + "predictgrid/full/pm25/0.27/32.55/0.37/32.65/" + toISOStringLocal(new Date()),  url + "getsensorlist"];
//var filenames = [url + "predictgrid/full/pm25/0.27/32.55/0.37/32.65/2018-04-30T09:48:39",  url + "getsensorlist"];
var queue = d3.queue();

console.log("1.  API called by Map Graph: " + filenames);

/***** Run two separate API calls for sensors & grid  ******/
function onPageLoad(){
    filenames.forEach( function(filename){
        queue.defer(d3.json, filename);
    });

    queue.awaitAll(function(error, DataSets){
        data = DataSets[0];
        sensorsInfo = DataSets[1];
        calculate(data);
    })

    setUpBasicPageComponents();
}

/***** Transform date to ISO Format  ******/
function toISOStringLocal(d) {
  function z(n){return (n<10?'0':'') + n}
  return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' +
         z(d.getDate()) + 'T' + z(d.getHours()) + ':' +
         z(d.getMinutes()) + ':' + z(d.getSeconds())

}

/***** Set Up Map  ******/
function setupMap(){
    d3.select('#containerOne').select("h2").attr("class", "ChartTitle").text("Air Quality over Kampala");
    map = new mapboxgl.Map({
        container: 'mapChart',
        style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
        center: [32.60, 0.319], // starting position [longitude, latitutde]
        zoom: 12.7}); // starting zoom
}

/***** Declare some basic elements of the page that we are going to use later on *****/
function setUpBasicPageComponents(){
    mapComponent = d3.select("#mapChart");
    mapWidth =  document.getElementById("mapChart").offsetWidth;
}

/***** Pass an array and return its GEOJSON format suitable for mapbox  *****/
function reformat (array) {
    var temporary = [];
    array.map(function (d){
        temporary.push({
          properties: { mean: +d.mean,
                        std: +d.std },
          type: "Feature",
          geometry: { coordinates:[ +d.lon,
                                    +d.lat ],
                      type:"Point"}
        });
    });
    return temporary;
}

/***** Format Sensor array to GEOJSON  *****/
function reformatSensor (array) {
    var temporary = [];
    array.map(function (d){
        if(isNaN(d.lat))
          {}
        else
        {temporary.push({
          properties: { icon: d.rawdata,
                        id :  d.name,
                        locationpredictions: d.location_predictions,
                        measures: d.measures},
          type: "Feature",
          geometry: { coordinates:[ +d.long,
                                    +d.lat ],
                      type:"Point"}
        });}
    });
    return temporary;
}

/***** Get ranges of the dimensions we'll use on the graph; will be later used for size/colour/shape  *****/
function getMinMax(data){
    maxLat = d3.max(data, function(d,i) { return parseFloat(d['lat']); });
    minLat = d3.min(data, function(d,i) { return parseFloat(d['lat']); });
    maxLon = d3.max(data, function(d,i) { return parseFloat(d['lon']); });
    minLon = d3.min(data, function(d,i) { return parseFloat(d['lon']); });
    maxStd = d3.max(data, function(d,i) { return parseFloat(d['std']); });
    minStd = d3.min(data, function(d,i) { return parseFloat(d['std']); });
    maxMean = d3.max(data, function(d,i) { return parseFloat(d['mean']); });
    minMean = d3.min(data, function(d,i) { return parseFloat(d['mean']); });
}

function buildLegend(){
    linearColorScale = d3.scaleOrdinal()
                         .domain([minMean, minMean + ((maxMean-minMean)/4), minMean + 2*((maxMean-minMean)/4), minMean + 3*((maxMean-minMean)/4),  maxMean])
                         .range(["rgba(66,202,253, 0.6)", "rgba(89, 187, 209, 0.624)", "rgba(112, 171, 165, 0.65)", "rgba(135, 156, 121, 0.675)",  "rgba(158,140,77, 0.7)"]);

    ordinalSizeScale = d3.scaleOrdinal()
                         .domain([0,1,2,3])
                         .range([6, 9, 12, 15]);

    linearOpacityScale = d3.scaleOrdinal()
                           .domain([0, 1, 2, 3])
                           .range([0.3, 0.4, 0.6, 0.95]);

    d3.select("#right").append("div").classed("legend", true).attr("id", "legend");

    d3.select(".legend").append("h4").attr("id", "legendTitle") ;

    d3.select(".legend")
      .style("background-color", "rgba(255, 255, 255, 0.3)")
      .style("margin", "auto")
      .style("transform",  function(){
        if (document.documentElement.clientWidth<1400) { return "translateX(10%)"; }
         else { return "translateX(30%)"; }});

    d3.select("h4#legendTitle").attr("width", 50).text("LEGEND");

    legendSvg = d3.select(".legend")
                  .append("svg")
                  .attr("width",  function(){
                        if (document.documentElement.clientWidth<1400) { return "280px"; }
                         else { return "320px"; }})
                  .attr("height", "300px");

    legendSvg.append("defs").append('filter')
                 .attr('id', 'blur')
                 .append('feGaussianBlur')
                 .attr('stdDeviation', 5);

    legendSvg.append("defs").append('marker')
                 .attr('id', 'marker_arrow_right')
                 .attr('markerHeight', 8)
                 .attr('markerWidth', 8)
                 .attr('markerUnits', 'strokeWidth')
                 .attr('orient', 'auto')
                 .attr('refX', 0)
                 .attr('refY', 0)
                 .attr('viewBox', '-5 -5 10 10')
                 .append('svg:path')
                 .attr('d', 'M 0,0 m -5,-5 L 5,0 L -5,5 Z')
                 .attr('fill', 'white');

    legendSvg.append("defs").append('marker')
             .attr('id', 'marker_arrow_left')
             .attr('markerHeight', 8)
             .attr('markerWidth', 8)
             .attr('markerUnits', 'strokeWidth')
             .attr('orient', 'auto-start-reverse')
             .attr('refX', 0)
             .attr('refY', 0)
             .attr('viewBox', '-5 -5 10 10')
             .append('svg:path')
             .attr('d', 'M 0,0 m -5,-5 L 5,0 L -5,5 Z')
             .attr('fill', 'white');

    legendSvg.append("g")
             .attr("class", "colorLegend")
              .attr("transform", function(){
                     if (document.documentElement.clientWidth<1400) { return "translate(25,10)"; }
                 else { return "translate(60,10)"; }});

    legendSvg.append("line")
             .attr("x1",(-2))
             .attr("x2",  function(){
                        if (document.documentElement.clientWidth<1400) { return "276px"; }
                         else { return "316px"; }})
             .attr("y1", 128 )
             .attr("y2", 128)
             .style("stroke", "#DDDDDD");

    legendSvg.append("g")
             .attr("class", "sizeLegend")
             .attr("transform", function(){
                        if (document.documentElement.clientWidth<1400) { return "translate(25,155)"; }
                         else { return "translate(60,155)"; }});

    nodeSize = d3.legendSize()
                 .scale(ordinalSizeScale)
                 .cells(4)
                 .title("Node size and transparency represent prediction confidence")
                 .titleWidth(250)
                 .labelWrap(20)
                 .orient('horizontal')
                 .labels(["Very Uncertain ", "", "", "Almost Certain"])
                 .labelAlign("start")
                 .labelOffset(15)
                 .shapeWidth(60)
                 .shapePadding(12)
                 .shape("circle");

    nodeColor = d3.legendColor()
                  .shape("circle")
                  .shapeWidth(25)
                  .titleWidth(250)
                  .labels(["Very Low ", "Low", "Moderate", "High", "Very High"])
                  .title("Node color represents PM2.5 level")
                  .shapeRadius(8)
                  .orient('vertical')
                  .scale(linearColorScale);

    legendSvg.select(".colorLegend").call(nodeColor);

    legendSvg.select(".sizeLegend").call(nodeSize);

    legendSvg.append("path")
    .attr("d", function(){
                        if (document.documentElement.clientWidth<1400) { return 'M 25,253 L 157,253'; }
                         else { return 'M 60,253 L 186,253'; }})
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-linecap', 'round')
        .attr('marker-start', function(d,i){ return 'url(#marker_arrow_left)' })
        .attr('marker-end', function(d,i){ return 'url(#marker_arrow_right)' });

    legendSvg.append("line")
             .attr("x1",(-2))
              .attr("x2",  function(){
                        if (document.documentElement.clientWidth<1400) { return "276px"; }
                         else { return "316px"; }})
             .attr("y1", 262 )
             .attr("y2", 262)
             .style("stroke", "#DDDDDD");

    legendSvg.append("g")
             .attr("class", "sensorLegend")
               .attr("transform", function(){
                     if (document.documentElement.clientWidth<1400) { return "translate(15,258)"; }
                 else { return "translate(50,258)"; }});

    d3.select(".sensorLegend")
                  .append("image")
                  .attr("width", "45px")
                  .attr("height", "45px")
                  .attr("xlink:href", 'images/sensor.png');

    d3.select(".sensorLegend")
      .append("text")
       .attr("x", "45px")
       .attr("y", "28px")
       .text("Sensor location");

    legendSvg.select(".sizeLegend")
             .selectAll(".swatch")
             .style("opacity", function(d){ return linearOpacityScale(d);})
             .attr("filter", function(d){ return "blur(" + (1 - d/3) + "px)";});
}

/***** Do some more work with data before building map (i.e. format the data in GEOJSON)  *****/
function calculate(data){
    getMinMax(data);

    uncertaintyScale = d3.scaleQuantile()
                         .domain([minStd, minStd + ((maxStd-minStd)/3), minStd + 2*((maxStd-minStd)/3), maxStd])
                         .domain([0, 20, 40, 60])
                         .range(["Very Certain (σ =", "Reasonably Certain (σ =", "Somewhat Uncertain (σ =", "Uncertain (σ ="]);

    pollutionScale = d3.scaleQuantile()
                         .domain([minMean, minMean + ((maxMean-minMean)/4), minMean + 2*((maxMean-minMean)/4), minMean + 3*((maxMean-minMean)/4),  maxMean])
                         .range(["Very Low ", "Low", "Moderate", "High", "Very High"]);

    geoData = { type: "FeatureCollection", features: reformat(data) };
    sensorGeoData = { type: "FeatureCollection", features: reformatSensor(sensorsInfo) };
    setupMap();
    buildLegend();
    buildMap();
}

/***** Get width of browser window; to adjust size of page components accordingly  *****/
function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

/***** Get height of browser window; to adjust size of page components accordingly  *****/
function getHeight() {
  return Math.max(
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );
}

function buildMap(){
    mapComponent.style("border-color", "white")
                .style("border-style", "solid")
                .style("border-width", "2px")
                .style("border-radius", "3px");

    map.on('style.load', function(){
        /*** GRID ***/
        map.addSource('pollut',{
        "type": "geojson",
        "data": geoData
        })

        map.addLayer({
        "id": "PM2.5Layer",
        "type": "circle",
        "source": "pollut",
        "minzoom": 1,
        "paint": {
            "circle-radius":
                ["interpolate",
                ["linear"],
                ["zoom"],
                12, [
                    "interpolate",
                    ["linear"],
                    ["get", "std"],
                    0, 14,
                    100, 7
                ],
                16, [
                    "interpolate",
                    ["linear"],
                    ["get", "std"],
                    0, 14,
                    100, 7
                ]
            ],
            "circle-color":
                ["interpolate",
                ["linear"],
                ["get", "mean"],
                minMean, "#42cafd",   //muddy
                maxMean, "#9e8c4d"
            ],
            "circle-stroke-color":
                ["interpolate",
                ["linear"],
                ["get", "mean"],
                minMean, "#42cafd",   //muddy
                maxMean, "#9e8c4d"
            ],
            "circle-stroke-width": 1,
            "circle-blur":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0.1,
                maxStd, 0.9
            ],
            "circle-opacity":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0.92,
                maxStd, 0.1
            ],
            "circle-stroke-opacity":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd,1,
                maxStd, 0
            ]
        }
        }, 'waterway-label');

         /*** STATIC SENSORS***/
        map.addSource('sensors',{
        "type": "geojson",
        "data": sensorGeoData
        })

        sensorGeoData.features.forEach(function(marker) {
            var sensorElement = document.createElement('div');
             sensorElement.className = 'marker';

            new mapboxgl.Marker(sensorElement)
              .setLngLat(marker.geometry.coordinates)
              .addTo(map);

            new mapboxgl.Marker(sensorElement)
              .setLngLat(marker.geometry.coordinates)
              .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML('<h3>' + marker.properties.id + '' + '<br><a href="http://54.194.132.252:8080/' + marker.properties.locationpredictions
              + '">Link to location predictions </a><br> Pollutants measured : ' + marker.properties.measures + '</h3>'))
              .addTo(map);
        });

        map.on('mousemove', function (e) {
            currentCoordinates = e.lngLat;
        });

        // When click event occurs on grid element, open popup at the location of the feature
        map.on('click', 'PM2.5Layer', function (e) {
            coordinates = e.features[0].geometry.coordinates.slice();
            pollutant = e.features[0].properties.mean;
            confidence = e.features[0].properties.std;

        latlonVariable = coordinates;
        loadAvgData('hour', latlonVariable[1] + '/' + latlonVariable[0]);

        loadData(startTime, endTime, latlonVariable[1] + '/' + latlonVariable[0], 8);


            // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    '<font size="1" color="#608985"> PM2.5 level: </font><font size="1">' + pollutionScale(pollutant) + " ( " + pollutant + " )" + '</font><br>' +
                    '<font size="1" color="#608985"> Prediction Confidence: </font><font size="1">' + uncertaintyScale(confidence) + " " + confidence + ')' + '</font><br>' +
                    '<font size="1" color="#608985"> Coordinates: </font><font size="1">' + coordinates + '</font><br>')
                .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'PM2.5Layer', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'PM2.5Layer', function () {
            map.getCanvas().style.cursor = '';
        });

        navigationBox = new mapboxgl.NavigationControl();
            map.addControl(navigationBox, 'top-left');
   });
}

function showMapInstructions(){
     divDescription = d3.select("#containerOne")
                          .append("div")
                          .attr("id", "right")
                          .attr("position", "absolute")
                          .attr("height", '850px')
                          .style("margin-top", "20px")
                          .style("margin-bottom", "20px")
                          .style("margin-left", "auto")
                          .style("margin-right", "auto");


     divDescription.append("g")
                  .attr("transform", "translate(0,0)")
                  .classed("instructionSet", true)
                  .attr("display", "block")
                  .append("foreignObject")
                  .attr("x", mapWidth)
                  .attr("y", 80)
                  .attr("height", 80)
                  .attr("width", 80)
                  .append("xhtml:div")
                  .style("color", "white")
                  .style("margin-left", "auto")
                  .style("margin-right", "auto")
                  .style("display", "block")
                  .style("width", "100%")
                  .style("font-size", "20px")
                  .style("font-weight", "100")
                  .append("span")
                  .attr("class", "tspan-class")
                  .html("This map provides an overview of the current air pollution levels over the city of Kampala, Uganda. A grid of circles is layered on top of the map to suggest the areas with high levels of a certain pollutant; PM2.5. Static sensors are transmitting data which is then collected and used to predict the value of PM2.5 all over the city; always with some level of uncertainty. <p> The bluer a circle on the grid appears, the cleaner the air is over that area. Uncertainty is represented by how fuzzy and big a circle appears; the larger and more opaque it is, the more trustworthy results we have. The map also displays locations for the static sensors. Click on a sensor or circle to discover more information about it.");
}

onPageLoad();

showMapInstructions();
