mapboxgl.accessToken = 'pk.eyJ1IjoiaXJlbWljMDEiLCJhIjoiY2l0cGx6NGloMDAwcTJ5cGZ3bnp1ZDJzdiJ9.a0Qb6q_5wUEWM3mgrA95YQ';
var points = [];

var sensorsArray = [
  {
    "id": "Sensor 1",
    "lon": 32.59,
    "lat": 0.33,
    "mean": "rss"
  },
  {
    "id": "Sensor 2",
    "lon": 32.586,
    "lat": 0.274,
     "mean": "rss"
  },
  {
    "id": "Sensor 3",
    "lon": 32.606,
    "lat": 0.27,
     "mean": "rss"
  },
  {
    "id": "Sensor 4",
    "lon": 32.592003409581,
    "lat": 0.313235,
     "mean": "rss"
  },
  {
    "id": "Sensor 5",
    "lon": 32.564,
    "lat": 0.3,
     "mean": "rss"

  },
  {
    "id": "Sensor 6",
    "lon": 32.622,
    "lat": 0.274,
     "mean": "rss"
  },
  {
    "id": "Sensor 7",
    "lon": 32.632,
    "lat": 0.336,
     "mean": "rss"
  },
  {
    "id": "Sensor 8",
    "lon": 32.63,
    "lat": 0.316,
     "mean": "rss"
  },
  {
    "id": "Sensor 9",
    "lon": 32.638,
    "lat": 0.36,
     "mean": "rss"
  },
  {
    "id": "Sensor 10",
    "lon": 32.648,
    "lat": 0.302,
     "mean": "rss"
  },
  {
    "id": "Sensor 11",
    "lon": 32.3113,
    "lat": 0.34242,
     "mean": "rss"
  }
  ];

/***** Set Up Map  ******/
function setupMap(){
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
        center: [32.60, 0.319], // starting position [longitude, latitutde]
        zoom: 12.7 // starting zoom
    });
}

/***** Declare some basic elements of the page that we are going to use later on *****/
function setUpBasicPageComponents(){
    setupMap();

    mapComponent = d3.select("#map");

    mapWidth =  document.getElementById("map").offsetWidth;
    mapHeight =  document.getElementById("map").offsetHeight;

    svgComponent = d3.select("body")
                     .append("svg")
                     .attr("width", mapWidth)
                     .attr("height", mapHeight)
                     .append("g")
                     .attr("transform", "translate(0,0)");

    getData();
}

/***** Read JSON file  *****/
function getData(){
    d3.json("testData/data2.json", function(data){
        calculate(data);
    })
}

/***** Passs any array and return GEOJSON format suitable for mapbox  *****/
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

function reformatSensor (array) {
    var temporary = [];
    array.map(function (d){
        temporary.push({
          properties: { icon: d.mean,
                        id :  d.id},
          type: "Feature",
          geometry: { coordinates:[ +d.lon,
                                    +d.lat ],
                      type:"Point"}
        });
    });
    return temporary;
}

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

function buildLegend(data){
    linearColorScale = d3.scaleLinear()
                         .domain([minMean,maxMean])
                         .range(["rgba(66,202,253, 0.6)", "rgba(158,140,77, 0.7)"]);

//    var ordinalSizeScale = d3.scaleLinear().domain([minStd, maxStd]).range([7,14]);   **if we need to show domains as actual std values, instead of high/med/low
    ordinalSizeScale = d3.scaleOrdinal()
                         .domain([0,1,2,3])
                         .range([6, 10, 12, 15]);

    linearOpacityScale = d3.scaleOrdinal()
                           .domain([0, 1, 2, 3])
                           .range([0.2, 0.4, 0.6, 0.8]);

    legendSvg = d3.select(".legend")
                  .append("svg")
                  .attr("width", "130px")
                  .attr("height", "300px");

    legendSvg.append("g")
             .attr("class", "colorLegend")
             .attr("transform", "translate(0,10)");

    legendSvg.append("line")
             .attr("x1",(-2))
             .attr("x2", 130)
             .attr("y1", 128 )
             .attr("y2", 128)
             .style("stroke", "#DDDDDD");

    legendSvg.append("g")
             .attr("class", "sizeLegend")
             .attr("transform", "translate(0,146)");

    nodeSize = d3.legendSize()
                 .scale(ordinalSizeScale)
                 .cells(4)
                 .title("Node size and opacity represent prediction confidence")
                 .titleWidth(130)
                 .labelWrap(20)
                 .orient('horizontal')
                 .labels(["Low ", "Med", "High", "Very High"])
                 .labelAlign("end")
                 .labelOffset(12)
                 .shapeWidth(60)
                 .shapePadding(10)
                 .shape("circle");

    nodeColor = d3.legendColor()
                  .shape("circle")
                  .shapeWidth(25)
                  .titleWidth(120)
                  .title("Node color represents PM2.5 level")
                  .shapeRadius(8)
                  .orient('vertical')
                  .scale(linearColorScale);

    legendSvg.select(".colorLegend").call(nodeColor);

    legendSvg.select(".sizeLegend").call(nodeSize);

    legendSvg.append("line")
         .attr("x1",(-2))
         .attr("x2", 130)
         .attr("y1", 250 )
         .attr("y2", 250)
         .style("stroke", "#DDDDDD");

    legendSvg.append("g")
             .attr("class", "sensorLegend")
             .attr("transform", "translate(0,258)");

    d3.select(".sensorLegend")
                  .append("image")
                  .attr("width", "45px")
                  .attr("height", "45px")
                  .attr("xlink:href", "green.png");

    d3.select(".sensorLegend")
      .append("text")
       .attr("x", "45px")
       .attr("y", "25px")
       .text("Static Sensor");

    legendSvg.select(".sizeLegend")
             .selectAll(".swatch")
             .style("opacity", function(d){ return linearOpacityScale(d);})
             .attr("filter", function(d){ return "blur(" + (1 - d/3) + "px)";});

}

function calculate(data){

    getMinMax(data);

    geoData = { type: "FeatureCollection", features: reformat(data) };
    sensorGeoData = { type: "FeatureCollection", features: reformatSensor(sensorsArray) };

    buildLegend(data);

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
                    minStd, 14,
                    maxStd, 7
                ],
                16, [
                    "interpolate",
                    ["linear"],
                    ["get", "std"],
                    minStd, 14,
                    maxStd, 7
                ]
            ],
            "circle-color":
                ["interpolate",
                ["linear"],
                ["get", "mean"],
                minMean, "#42cafd",   //muddy
                maxMean, "#9e8c4d"
//                minMean,"#42cafd",    //grey
//                maxMean, "#808080"
//                minMean, "#002168",     //blue/red
//                maxMean, "#BF1831"
            ],
            "circle-stroke-color":
                ["interpolate",
                ["linear"],
                ["get", "mean"],
                minMean, "#42cafd",   //muddy
                maxMean, "#9e8c4d"
            ],
            "circle-stroke-width":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0,
                maxStd, 1
            ],
            "circle-blur":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0.1,
                maxStd, 1
            ],
            "circle-opacity":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0.8,
                maxStd, 0.2
            ],
            "circle-stroke-opacity":
                ["interpolate",
                ["linear"],
                ["get", "std"],
                minStd, 0.9,
                maxStd, 0.5
            ]
        }
        }, 'waterway-label');

         /*** STATIC SENSORS USING DUMMY DATA ***/
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
              .setHTML('<h3>' + marker.properties.id + '</h3>'))
              .addTo(map);
        });

        // When click event occurs on grid element, open popup at the location of the feature
        map.on('click', 'PM2.5Layer', function (e) {


            console.log(e);
            coordinates = e.features[0].geometry.coordinates.slice();
            pollutant = e.features[0].properties.mean;
            confidence = e.features[0].properties.std;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    '<b><font size="2" color="#608985"> PM2.5 level: </font></b><font size="2">' + pollutant + '</font><br>' +
                    '<b><font size="2" color="#608985"> Standard Deviation (Confidence): </font></b><font size="2">' + confidence + '</font><br>' +
                    '<b><font size="2" color="#608985"> Coordinates: </font></b><font size="2">' + coordinates + '</font><br>')
                .addTo(map);

//             map.flyTo({center: e.features[0].geometry.coordinates});
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'PM2.5Layer', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'PM2.5Layer', function () {
            map.getCanvas().style.cursor = '';
        });

        map.addControl(new mapboxgl.NavigationControl());

   });
}

setUpBasicPageComponents();
