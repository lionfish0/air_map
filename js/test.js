
    d3.select('#tableChart').append("div").attr("class", "tableLegend").attr("width", "100%").attr("height", "120px").attr("position", "relative");

    gTableLegends = d3.select(".tableLegend");

    gTableLegends
//    .append("div").attr("width", "48%").attr("height", "120px").style("float", "left")
    .append("svg").attr("class", "tableLegendSVG").attr("width", "50%").attr("height", "120px").style("fill", "#fff");

    gTableLegends
//    .append("div").attr("width", "48%").attr("height", "120px").style("float", "right")
    .append("svg").attr("class", "tableLegend2SVG").attr("width", "50%").attr("height", "120px").style("fill", "#fff");

    polLeg = d3.select(".tableLegendSVG").append("g").attr("class", "tablePolLegend").attr("transform", "translate(0,-5)");
    conLeg = d3.select(".tableLegend2SVG").append("g").attr("class", "tableConfLegend").attr("transform", "translate(550,-5)");

    polLeg.append("rect").attr("height", "90px").attr("width", "465px").attr("x", 0).attr("y", 30).style("stroke", "white").style("stroke-width", "5px").style("background-color", "#fff").style("opacity", 0.3).attr("display", "block");
    polLeg.append("text").attr("width", 50).attr("x", 150).attr("y", 44).style("fill", "#D9B310").style("font-family", "Helvetica Neue").text("PM2.5 LEVEL (in µg/m3)");

    conLeg.append("rect").attr("height", "90px").attr("width", "465px").attr("x", 0).attr("y", 30).style("stroke", "white").style("stroke-width", "5px").style("background-color", "#fff").attr("display", "block");
    conLeg.append("text").attr("width", 50).attr("x", 150).attr("y", 44).style("fill", "#D9B310").style("font-family", "Helvetica Neue").text("Prediction Confidence)");

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