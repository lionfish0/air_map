mapboxgl.accessToken = 'pk.eyJ1IjoiaXJlbWljMDEiLCJhIjoiY2l0cGx6NGloMDAwcTJ5cGZ3bnp1ZDJzdiJ9.a0Qb6q_5wUEWM3mgrA95YQ';
var points = [];

function setupMap(){
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
        center: [32.60, 0.319], // starting position [lng, lat]
        zoom: 12.7 // starting zoom
    });
}


// set color for mapbox quantile scale
function getColor(d) {
    if (d) {
    return d < 15 ? '#C02F00':
           d < 19 ? '#E28061' :
           d < 21 ? '#F9C9BA' :
           d < 25 ? '#D7DCD8' :
                     '#88B8B9';
    } else {
      return '#12939A';
    }
}

function setUpBasicComponents(){
    setupMap();

    mapComponent = d3.select("#map");

    mapWidth =  document.getElementById("map").offsetWidth;
    mapHeight =  document.getElementById("map").offsetHeight;

    svgComponent = d3.select("body").append("svg")
                               .attr("width", mapWidth)
                               .attr("height", mapHeight)
                               .append("g")
                               .attr("transform", "translate(0,0)");

    hexbin = d3.hexbin()
               .extent([[0, 0], [mapWidth, mapHeight]])
               .radius(10);

    radius = d3.scaleSqrt()
    .domain([0, 12])
    .range([0, 10]);


    getData();
}

function getData(){
    d3.json("testData/data2.json", function(data){
        calculate(data);
    })
}

function reformat (array) {
    var temporary = [];
    array.map(function (d){
    temporary.push({
      properties: {
        mean: +d.mean,
        std: d.std
      },
      type: "Feature",
      geometry: {
        coordinates:[+d.lon,+d.lat],
        type:"Point"
      }
    });
    });
    return temporary;
}

function calculate(data){

    maxLat = d3.max(data, function(d,i) { return parseFloat(d['lat']); });
    minLat = d3.min(data, function(d,i) { return parseFloat(d['lat']); });
    maxLon = d3.max(data, function(d,i) { return parseFloat(d['lon']); });
    minLon = d3.min(data, function(d,i) { return parseFloat(d['lon']); });
    maxStd = d3.max(data, function(d,i) { return parseFloat(d['std']); });
    minStd = d3.min(data, function(d,i) { return parseFloat(d['std']); });
    maxMean = d3.max(data, function(d,i) { return parseFloat(d['mean']); });
    minMean = d3.min(data, function(d,i) { return parseFloat(d['mean']); });


    for (var i = 1, n = (data.length) ; i < n; ++i) {
        points.push([data[i]["lon"], data[i]["lat"]]);
    }

    latColumns = data.length;
    longColumns = data.length;

    hexRadius = d3.min([mapWidth/((latColumns + 0.5) * Math.sqrt(3)),
        mapHeight/((longColumns + 1/3) * 1.5)]);

    bbox = [minLon, minLat, maxLon, maxLat];

    geoData = { type: "FeatureCollection", features: reformat(data) };

    console.log(geoData);

//    var hexgrid = turf.hexGrid(bbox, hexRadius, {});
    hexgrid = turf.hexGrid(bbox, 200, {units: 'kilometers'});

    // Store an array of quantiles
    var max = maxMean;
    var fifth = maxMean / 5;
    var quantiles = [];
    for (i = 0; i < 5; i++) {
      var quantile = (fifth + i) * fifth;
      quantiles.push(quantile);
    }

    var linearColor = d3.scaleLinear()
                        .domain([minMean,maxMean])
                        .range(["rgba(66,202,253, 0.6)", "rgba(158,140,77, 0.7)"]);

//    var sizeScale = d3.scaleLinear().domain([minStd, maxStd]).range([7,14]);
    var sizeScale = d3.scaleOrdinal().domain([0,1,2,3]).range([6, 10, 12, 15]);

    var legendSvg = d3.select(".legend").append("svg");

    legendSvg.attr("width", "130px").attr("height", "230px").append("g").attr("class", "legendLinear").attr("transform", "translate(10,10)");
    legendSvg.append("line").attr("x1",(-2)).attr("x2", 130).attr("y1", 128 ).attr("y2", 128).attr("stroke", "#DDDDDD");
    legendSvg.append("g").attr("class", "legendSize").attr("transform", "translate(0,146)");


    var nodeSize = d3.legendSize()
                     .scale(sizeScale)
                     .cells(4)
                     .title("Size represents prediction confidence")
                     .titleWidth(130)
                     .labelWrap(20)
                     .orient('horizontal')
                     .labels(["Low ", "Med", "High", "Very High"])
                     .labelAlign("end")
                     .labelOffset(12)
                     .shapeWidth(60)
                     .shapePadding(10)
                     .shape("circle");

    var legendLinear = d3.legendColor()
                         .shape("circle")
                         .shapeWidth(25)
                         .titleWidth(120)
                         .title("Color represents PM2.5 level")
                         .shapeRadius(8)
                         .orient('vertical')
                         .scale(linearColor);

    legendSvg.select(".legendLinear")
      .call(legendLinear);

    legendSvg.select(".legendSize")
      .call(nodeSize);

    map.on('style.load', function(){

        map.addSource('pollut',{
        "type": "geojson",
        "data": geoData
        })

        map.addLayer({
        "id": "PM2.5Layer-point",
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

    // When click event occurs, open popup at the location of the feature
    map.on('click', 'PM2.5Layer-point', function (e) {
        console.log(e);
        var coordinates = e.features[0].geometry.coordinates.slice();
        var pollutant = e.features[0].properties.mean;
        var confidence = e.features[0].properties.std;


        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML("Pollutant: " + pollutant + ", Confidence: " + confidence + ", Coordinates: " + coordinates)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'PM2.5Layer-point', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'PM2.5Layer-point', function () {
        map.getCanvas().style.cursor = '';
    });

   });
}

setUpBasicComponents();
