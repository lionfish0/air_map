var timeFormater = d3.timeParse('%d/%m/%Y %H:%M:%S');
var startTime = toISOStringLocal(new Date());
var tomorrow = new Date();
tomorrow.setDate(new Date().getDate()+1);
var endTime = toISOStringLocal(tomorrow);

/***** Load data from API  ******/
function loadData(startTime, endTime, input) {
//    var api =  url + "predictovertime/pm25/" + startTime + "/" + endTime + "/0.338/32.55/" + input;
 var api =  url + "predictovertime/pm25/2018-04-29T09:48:39/2018-04-30T09:48:39/0.338/32.55/" + input;
 console.log("3.  API called by Table Graph: " + api);
    d3.json(api).get( getData );
}

/***** Calculate ranges of PM2.5 measures  ******/
function getMinMaxV2(data){
    maxMeanV2 = d3.max(data, function(d,i) { return parseFloat(d['values'][0]['mean']); });
    minMeanV2 = d3.min(data, function(d,i) { return parseFloat(d['values'][0]['mean']); });
    maxSV2 = d3.max(data, function(d,i) { return parseFloat(d['values'][0]['std']); });
    minSV2 = d3.min(data, function(d,i) { return parseFloat(d['values'][0]['std']); });
}

/***** Get data, set up some basic page components  ******/
function getData(data){
    width = getWidth() - (getWidth()/6);
    step = data.length;
    height = 400;

    d3.select('#tableChart').select("h2").remove();
    d3.select('#tableChart').select(".tableInfo").remove();
    d3.select('#tableChart').select(".tableLegends").remove();
    d3.select('#tableChart').select("svg.svgTable").remove();

    d3.select('#tableChart')
      .append("h2")
      .attr("class", "ChartTitle").text("Forecast for next " + step + " hours");

    gTableButtons = d3.select('#tableChart')
                .append("div")
                .attr("class", "tableInfo")
                .style("position", "relative")
                .append("svg")
                .attr("class", "gTableButtons")
                .attr("width", width)
                .attr("height", 100).append("g").attr("transform", "translate(0,0)");

    d3.select('#tableChart')
                .append("div")
                .attr("class", "tableLegends")
                .style("position", "relative");


    d3.select('#tableChart .gTableButtons').append("div").attr("class", "tableLegend");
//    .attr("transform", "translate(30, 80)");

    addButtons();

    table = d3.select('#tableChart').style("margin-top", "10px").append("svg")
                               .attr("class", "svgTable")
                               .attr("width", width)
                               .attr("height", height);

    svgDefs = table.append('defs');

    mainGradient = svgDefs.append('linearGradient')
                .attr('id', 'mainGradient');

    mainGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0');

    mainGradient.append('stop')
        .attr('class', 'stop-right')
        .attr('offset', '1');

    filterData(data);
}

/***** Structure data based on user's selection  ******/
function filterData(data){
  groupByDayArray = d3.nest()
                 .key(function(d) { return d.time.substr(0,13); })
                 .entries(data);

  buildTable(groupByDayArray);
  showBTabInstructions();
}

/*****  Build tabular view  ******/
function buildTable(data){
  boxWidth = width/step;
  getMinMaxV2(data);

  //bind data
  tableElement = table.selectAll('g')
       .data(data)
       .enter()
       .append('g')
       .attr("class", "cells")
       .attr("transform", function(d, i) { return "translate(" + i*boxWidth+",20)"; });

  table.selectAll('g.cells')
       .append("rect")
       .attr("class", "highlighted-box")
       .attr("width",boxWidth)
       .attr("height",155)
       .attr("fill", "None");

  //add foreign object 'box' to append hour information
  table.selectAll('g.cells')
       .append("foreignObject")
       .attr("x",0)
       .attr("y", 20)
       .attr("width",boxWidth)
       .attr("height",40)
       .attr("text-anchor", "start")
       .append("xhtml:div")
       .style("color", "white")
       .append("tspan")
       .attr("stroke", "white")
       .style("font-size", function(){
         if (width<=1300) { return "16px"; }
         else { return "22px"; }})
       .attr("class", "timeofday")
       .style("font-weight", 200)
       .style("text-shadow", "0 0 0.2em #8F7)")
       .attr("dy", 70)
       .attr("dx", 8)
       .html(function(d){return d.key.slice(-2) +":00";});
       // .html(function(d){ return timeFormater(d.time).getHours()+ ":" + timeFormater(d.time).getMinutes();});

  dif = maxMeanV2 - minMeanV2;

  //add images based on air quality at that time
  table.selectAll('g.cells')
       .append("svg:image")
       .attr("id", "imageid")
       .attr("x", function(d){
         if (width<=1300) { return (boxWidth - 30)/2; }
         else { return (boxWidth - 45)/2; }})
       .attr("y", function(d){
         if (width<=1300) { return 60; }
         else { return 55; }})
       .attr("width", function(d){
         if (width<=1300){ return 30; }
         else { return 45; }})
       .attr("height", function(d){
         if (width<=1300) { return 30; }
         else { return 45; }})
         .attr("xlink:xlink:href", function(d){
            if (d['values'][0]['mean'] >= 0 && d['values'][0]['mean'] < 12)  { return 'images/verylow.png';}
            else if (d['values'][0]['mean'] >= 12.1 && d['values'][0]['mean'] < 35.4)  {return 'images/low.png';}
            else if (d['values'][0]['mean'] >= 35.5 && d['values'][0]['mean'] < 55.4)  {return 'images/moderate.png';}
            else if (d['values'][0]['mean'] >= 55.5 && d['values'][0]['mean'] <150.4)  {return 'images/high.png';}
            else if (d['values'][0]['mean'] >= 150.5 && d['values'][0]['mean'] <= 500) {return 'images/veryhigh.png';}
         });

  //append circles around PM2.5 results
  table.selectAll('g.cells')
       .append("circle")
       .attr("cx", boxWidth/2)
       .attr("cy", 130)
       .attr("r", 16)
       .attr("stroke", "white")
       .attr("stroke-dasharray", 2.7)
       .attr("fill", "None");  // #4d4959

    //add foreign object to append mean value of PM2.5
    table.selectAll('g.cells')
         .append("foreignObject")
         .attr("x",0)
         .attr("y", 120)
         .attr("width",boxWidth)
         .attr("height",20)
         .append("xhtml:div")
         .style("color", "#cdcdcd")
         .append("tspan")
         .attr("class", "timeofday2")
         .style("font-weight", 200)
         .style("font-size", "16px")
         .attr("y", 120)
         .attr("dx", 8)
         .html(function(d){ return Math.round( d['values'][0]['mean'] * 10 ) / 10;});

    //add lines
     table.selectAll('g.cells')
          .append("line")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 0 )
          .attr("y2", 155)
          .style("stroke", "#DDDDDD");

     table.selectAll('g.cells')
          .append("line")
          .attr("x1", boxWidth)
          .attr("x2", boxWidth)
          .attr("y1", 0 )
          .attr("y2", 155)
          .style("stroke", "#DDDDDD");

     table.selectAll('g.cells').on("mouseover", highlightElement);

     table.selectAll('g.cells').on("mouseout", function(d){
         d3.select(this).select(".highlighted-box").attr("fill", "None");
         d3.select(this).selectAll("tspan").style("font-weight", "200");
         d3.select(this).selectAll("circle") .attr("stroke-dasharray", 2.7).attr("stroke-width", 1);
         table.selectAll('g.overview').transition().delay("100").duration("200").attr("display", "None");
     });
}

/***** Build Pop up with additional information that is shown once you hover over a certain time box   ******/
function highlightElement(d){
  table.selectAll('g.overview').remove();

  d3.select(this).selectAll("tspan").style("font-weight", "600");
  d3.select(this).selectAll("circle").attr("stroke-dasharray", "none").attr("stroke-width", 2);

  d3.select(this).select(".highlighted-box").attr("fill", "#3369CE");
  overview = table.append('g')
       .attr("class", "overview")
       .attr("display", "block")
       .attr("transform", "translate(0,180)");

  overview.append("rect")
          .attr("x",0)
          .attr("y", 0)
          .attr("class", "pop")
          .attr("ry", "20px")
          .attr("rx", "20px")
          .attr("stroke", "white")
          .attr("stroke-width", "1px")
          .attr("width", width - 3)
          .attr("height",140)
          .style("fill", "url(#mainGradient)");
//          .style("opacity", 0.8);

  overview.append("svg:image")
           .attr("id", "imageid")
           .attr("x", 50)
           .attr("y", 15)
           .attr("width", 120)
           .attr("height", 120)
           .attr("xlink:xlink:href", function(){
            if (d['values'][0]['mean'] >= 0 && d['values'][0]['mean'] < 12)  { return 'images/verylow.png';}
            else if (d['values'][0]['mean'] >= 12.1 && d['values'][0]['mean'] < 35.4)  {return 'images/low.png';}
            else if (d['values'][0]['mean'] >= 35.5 && d['values'][0]['mean'] < 55.4)  {return 'images/moderate.png';}
            else if (d['values'][0]['mean'] >= 55.5 && d['values'][0]['mean'] <150.4)  {return 'images/high.png';}
            else if (d['values'][0]['mean'] >= 150.5 && d['values'][0]['mean'] <= 500) {return 'images/veryhigh.png';}
         });

  overview.append("foreignObject")
         .attr("x",200)
         .attr("y", 20)
         .attr("width", width - (width/10))
         .attr("height",40)
         .append("xhtml:div")
         .attr("class", "overviewText")
         .style("color", "white")
         .append("tspan")
         .style("font-weight", 200)
         .style("font-family", "Helvetica Neue")
         .style("font-size", "28px")
         .html(function(){
            if (d['values'][0]['mean'] >= 0 && d['values'][0]['mean'] < 12){ return "Air Quality looks ideal";}
            else if (d['values'][0]['mean'] >= 12.1 && d['values'][0]['mean'] < 35.4){return "Air Quality could have been better";}
            else if (d['values'][0]['mean'] >= 35.5 && d['values'][0]['mean'] < 55.4) {return "Air Quality is not ideal; sensitive groups are advised to stay indoors";}
            else if (d['values'][0]['mean'] >= 55.5 && d['values'][0]['mean'] <150.4) {return "Air Quality is really poor";}
            else if (d['values'][0]['mean'] >= 150.5 && d['values'][0]['mean'] <= 500) {return "Air Quality is Hazardous";}});

  overview.append("line")
             .attr("x1", 200)
             .attr("x2", width - (width/6))
             .attr("y1", 60 )
             .attr("y2", 60)
             .style("stroke", "#DDDDDD");

  overview.append("foreignObject")
          .attr("x",200)
          .attr("y", 60)
          .attr("width", 5*boxWidth)
          .attr("height",60)
          .append("xhtml:div")
          .style("color", "white")
          .append("tspan")
          .style("font-weight", 300)
          .style("font-family", "Helvetica Neue")
          .style("font-size", "48px")
          .html(function(){ return d['values'][0]['mean'] + " µg/m3" ;});

  overview.append("svg:image")
           .attr("id", "imageid")
           .attr("x", width - 130)
           .attr("y", 20)
           .attr("width", 65)
           .attr("height", 65)
           .attr("xlink:xlink:href", function(){
            if (d['values'][0]['std'] >= minSV2 && d['values'][0]['std'] < minSV2 + (maxSV2-minSV2)/4)  { return 'images/highly_uncertain.png';}
            else if (d['values'][0]['std'] >=  minSV2 + (maxSV2-minSV2)/4 && d['values'][0]['std'] <  minSV2 + 2*(maxSV2-minSV2)/4)  {return 'images/uncertain.png';}
            else if (d['values'][0]['std'] >= minSV2 + 2*(maxSV2-minSV2)/4 && d['values'][0]['std'] >= minSV2 + 3*(maxSV2-minSV2)/4) {return 'images/certain.png';}
            else if (d['values'][0]['std'] >= minSV2 + 3*(maxSV2-minSV2)/4 && d['values'][0]['std'] <= maxSV2) {return 'images/highly_certain.png';}
         });

     overview.append("foreignObject")
           .attr("x", width - 160)
           .attr("y", 92)
           .attr("width", 120)
           .attr("height", 50)
           .append("xhtml:div")
           .attr("class", "overviewText")
           .style("color", "white")
           .append("tspan")
           .attr("class", "tspan-class")
           .style("font-weight", 200)
           .style("font-family", "Helvetica Neue")
           .style("font-size", "16px")
           .html(function(){
            if (d['values'][0]['std'] >= minSV2 && d['values'][0]['std'] < minSV2 + (maxSV2-minSV2)/4)  { return 'Very accurate prediction';}
            else if (d['values'][0]['std'] >=  minSV2 + (maxSV2-minSV2)/4 && d['values'][0]['std'] <  minSV2 + 2*(maxSV2-minSV2)/4)  {return 'Accurate Prediction';}
            else if (d['values'][0]['std'] >= minSV2 + 2*(maxSV2-minSV2)/4 && d['values'][0]['std'] >= minSV2 + 3*(maxSV2-minSV2)/4) {return 'Prediction is not very accurate';}
            else if (d['values'][0]['std'] >= minSV2 + 3*(maxSV2-minSV2)/4 && d['values'][0]['std'] <= maxSV2) {return 'Prediction is not accurate at all for this time';}
         });
};

/***** NOT USED ATM --- Get user's geolocation  ******/
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
}

/*****  NOT USED ATM --- Update table view to show air quality information on user's location  ******/
function showPosition(position) {
  console.log("Current Location (lat: "+position.coords.latitude+", lon: "+position.coords.longitude+ ")");
  // d3.select('#tableChart')
  //   .select("h2.ChartTitle")
  //   .text("Today's forecast at Current Location (lat: "+position.coords.latitude+", lon: "+position.coords.longitude+ ")");
}

/***** Buttons to aggregate data by respective view; 12, 16 and 24hour ******/
function addButtons(){
    gIndividualButtons = gTableButtons.selectAll("g")
                                .data([12, 16, 24])
                                .enter()
                                .append("g")
                                .attr("transform", "translate(100,0)")
                                .on("mouseover", mouseoverBtn)
                                .on("mouseout", mouseoutBtn)
                                .on("click", selectHours);

    rectTableButtons = gIndividualButtons.append("rect")
                               .attr("x", function(d, i) {return (110 * i);})
                               .attr("y", 20)
                               .attr("rx", 10)
                               .attr("ry", 10)
                               .attr("height", 50)
                               .attr("width", 100)
                               .attr("stroke", function (d) { return d;})
                               .attr("stroke-width", 1)
                               .classed("frequency_buttons", true)
                               .style("fill", "#ECA400");

    gIndividualButtons.append("foreignObject")
            .attr("x", function(d, i) {return (110*i);})
            .attr("y", 25)
            .attr("height", 50)
            .attr("width", 100)
            .append("xhtml:div")
            .style("color", "white")
            .style("margin-left", "auto")
            .style("margin-right", "auto")
            .style("display", "block")
            .style("width", "90%")
            .style("font-size", "16px")
            .append("span")
            .attr("class", "tspan-class")
            .html(function (d) { return "Select next " + d + " hours"; });
 }

/***** Once button is clicked; apply some css & store user's selection ******/
function selectHours(){
    d3.select(this).attr("transform", buttonClicked? "translate(105,5)" : "translate(100,0)")
        .attr("opacity", buttonClicked? 0.3:1)
        .attr("stroke", buttonClicked? "#A57400":"#ECA400")
        .attr("stroke-width", buttonClicked? 2 : 1);

    nextHours = this.__data__;
    loadData(startTime, endTime, nextHours);
}

function showBTabInstructions(){

    gTableButtons.append("g")
          .attr("transform", function(d){
         if (width<=1300) { return  "translate(450, -15)"; }
         else { return  "translate(400, -15)"; }})
          .classed("instructionSet", true)
          .attr("display", "block")
          .append("foreignObject")
          .attr("x", 0)
          .attr("y", 25)
          .attr("height", 75)
          .attr("width", function(d){
                if (width<=1300) { return  width - 420; }
                else { return width - 380; }})
          .append("xhtml:div")
          .style("color", "white")
          .style("margin-left", "auto")
          .style("margin-right", "auto")
          .style("display", "block")
          .style("width", "90%")
          .style("font-size", "20px")
          .style("font-weight", "200")
          .style("font-family", "Helvetica Neue")
          .append("span")
          .html(function () { return "The following expresses an hourly prediction of PM2.5 for the city of Kampala. Use buttons to view summaries for the next 12, 16 or 24 hours. Hover over a certain prediction to find out more information about it."; });

   buildTableLegends();
}

function buildTableLegends(){
    gTableLegends = d3.select(".tableLegends");

    gTableLegends.append("svg").attr("class", "tableLegendSVG").attr("width", "48%").attr("height", "120px").style("fill", "white");

    gTableLegends.append("svg").attr("class", "tableLegend2SVG").attr("width", "48%").attr("height", "120px").style("fill", "white");

    polLeg = d3.select(".tableLegendSVG").append("g").attr("class", "tablePolLegend").attr("transform", "translate(70,-5)");
    conLeg = d3.select(".tableLegend2SVG").append("g").attr("class", "tableConfLegend").attr("transform", "translate(50,-5)");

    polLeg.append("rect").attr("id", "legendbox").attr("height", "90px").attr("width", "465px").attr("x", 0).attr("y", 30).attr("rx", 25).attr("ry", 25);
    polLeg.append("text").attr("width", 50).attr("x", 150).attr("y", 44).style("fill", "#D9B310").style("font-family", "Helvetica Neue").text("PM2.5 LEVEL (in µg/m3)");

    conLeg.append("rect").attr("id", "legendbox").attr("height", "90px").attr("width", "465px").attr("x", 0).attr("y", 30).attr("rx", 25).attr("ry", 25);
    conLeg.append("text").attr("width", 50).attr("x", 150).attr("y", 44).style("fill", "#D9B310").style("font-family", "Helvetica Neue").text("PREDICTION CONFIDENCE");

    gPols = d3.select(".tablePolLegend").selectAll("g.pollutionImg").data(['verylow', 'low', 'moderate', 'high', 'veryhigh']).enter().append('g').attr("class", "pollutionImg").attr("transform", function(d, i) { return "translate(" + (10 + i*50) +",15)"; });

    polLeg.selectAll("g.pollutionImg").append("svg:image")
           .attr("x", function(d, i) { return (6 + i*50); })
           .attr("y", 40)
           .attr("width", 40)
           .attr("height", 40)
           .attr("xlink:xlink:href", function(d){
            if (d == 'verylow')  { return 'images/verylow.png';}
            else if (d == 'low')   {return 'images/low.png';}
            else if (d == 'moderate')  {return 'images/moderate.png';}
            else if (d == 'high')  {return 'images/high.png';}
            else if (d == 'veryhigh')  {return 'images/veryhigh.png';}});

    polLeg.selectAll("g.pollutionImg")
         .append("foreignObject")
         .attr("x", function(d, i) { return i*50 - 6; })
         .attr("y", 80)
         .attr("width", 65)
         .attr("height",20)
         .append("xhtml:div")
         .append("tspan")
         .attr("class", "table-legend")
         .style("font-size", "14px")
         .attr("y", 50)
         .attr("dx", 8)
         .html(function(d){
            if (d == 'verylow')  { return 'Very Low';}
            else if (d == 'low')   {return 'Low';}
            else if (d == 'moderate')  {return 'Moderate';}
            else if (d == 'high')  {return 'High';}
            else if (d == 'veryhigh')  {return 'Very high';}});

    gCons = d3.select(".tableConfLegend").selectAll("g.confidenceImg").data(['highlyUn', 'uncertain', 'certain', 'highlyCer']).enter().append('g').attr("class", "confidenceImg").attr("transform", function(d, i) { return "translate(" + (40 + i*60) +",15)"; });

    conLeg.selectAll("g.confidenceImg").append("svg:image")
           .attr("x", function(d, i) { return (6 + i*60); })
           .attr("y", 40)
           .attr("width", 40)
           .attr("height", 40)
           .attr("xlink:xlink:href", function(d){
            if (d == 'highlyUn')  { return 'images/highly_uncertain.png';}
            else if (d == 'uncertain')   {return 'images/uncertain.png';}
            else if (d == 'certain')  {return 'images/certain.png';}
            else if (d == 'highlyCer')  {return 'images/highly_certain.png';}});

    conLeg.selectAll("g.confidenceImg")
         .append("foreignObject")
         .attr("x", function(d, i) { return i*60 - 40; })
         .attr("y", 80)
         .attr("width", 120)
         .attr("height",20)
         .append("xhtml:div")
         .append("tspan")
         .attr("class", "table-legend")
         .style("font-size", "14px")
         .attr("y", 50)
         .attr("dx", 8)
         .html(function(d){
            if (d == 'highlyUn')  { return 'Highly Uncertain';}
            else if (d == 'uncertain')   {return 'Uncertain';}
            else if (d == 'certain')  {return 'Certain';}
            else if (d == 'highlyCer')  {return 'Highly Certain';}});
}

loadData(startTime, endTime, 8);
