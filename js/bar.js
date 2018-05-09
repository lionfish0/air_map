var width = getWidth()- (getWidth()/6);
var buttonClicked = true;

d3.select("#containerTwo")
  .select('#barChart')
  .append("h2")
  .classed("ChartTitle", true)
  .append("tspan")
  .html("Average PM2.5 levels");

/***** Call API  ******/
function loadAvgData(timechunk) {
 var predictOverTime =  "http://54.194.132.252:8080/getaverage/pm25/0.27/32.55/" + timechunk;
// var predictOverTime = "http://54.194.132.252:8080/getaverage/pm25/0.27/32.55/day";
    chunk = timechunk;
    console.log("2.  API called by Bar Graph: " + predictOverTime);
    d3.json(predictOverTime).get( buildBarGraph );
}

/***** Set up key page components that won't be changing/ affected by data later on  ******/
function setUpBasics(){
    margin = {top: 60, right: 40, bottom: 60, left: 40};
    height = 400;
    width = getWidth()- (getWidth()/6);

    svgBar = d3.select('#barChart')
               .append("svg")
               .attr("class", "svgBar")
               .attr("width", width + margin.left + margin.right)
               .attr("height", height + margin.top + margin.bottom);

    gBarButtons = svgBar.append("g")
                 .attr("class", "gBarButtons")
                 .attr("transform", "translate(" + margin.left/2 + ",-10)");

    addTimeChunkButtons();
    showBarInstructions();
}

/***** Build bar graph using the selected data set  ******/
function buildBarGraph(data){

    current_data = data.means;
    dataLength = current_data.length;

    d3.select('#barChart').select("svg").remove();

    setUpBasics();

    d3.select('#barChart').select("h2.ChartTitle").select("tspan").remove();
    d3.select('#barChart').select("h2.ChartTitle").append("tspan").html("Average PM2.5 levels by " + chunk);

    monthScale = d3.scaleOrdinal()
                 .range(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
                 .domain(0,1,2,3,4,5,6,7,8,9,10,11,12);

    weekDayScale = d3.scaleOrdinal()
                 .range(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
                 .domain(0,1,2,3,4,5,6);

    hourScale = d3.scaleOrdinal()
                  .range(['00:00', '01:00', "02:00", "03:00", "04:00", "05:00", "06:00",
                          '07:00', '08:00', "09:00", "10:00", "11:00", "12:00", "13:00",
                          '14:00', '15:00', "16:00", "17:00", "18:00", "19:00", "20:00",
                          '21:00', '22:00', "23:00"])
                  .domain(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23);

    x = d3.scaleBand()
          .domain(current_data.map(selectScale))
          .range([0, width - 40])
          .padding(0.2);

    y = d3.scaleLinear()
          .range([height, 0])
          .domain([0, d3.max(current_data, function(d) { return d + 30; })]);

    g = svgBar.append("g")
              .attr("transform",
          "translate(40,95)");

   addTimeChunkButtons();

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y).tickArguments([3]))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .style("font-family", "Helvetica Neue")
    .text("Mean PM2.5 levels");

    g.selectAll(".g-bar")
      .data(current_data)
      .enter()
      .append("g")
      .attr("class", "g-bar")
      .attr("cx",0)
      .attr("transform", function(d,i){ return "translate(" + x(selectScale(d,i)) + ",0)";});

    g.selectAll(".g-bar")
      .append("rect")
      .attr("class", "bar")
      .attr("id",  function(d) {return "id" + d; })
      .attr("x", function(d,i) { return  0; })
      .attr("y", function(d) {return y(d); })
      .attr("width", x.bandwidth())
      .attr("height", function(d) {return height - y(d); });

    g.selectAll(".g-bar")
      .append("foreignObject")
      .attr("x", function(d,i) { return  0; })
      .attr("y", function(d) {return y(d); })
      .attr("width",x.bandwidth())
      .attr("height",40)
      .append("xhtml:div")
      .style("color", "white")
      .append("tspan")
      .attr("class", "tspan-class")
      .style("font-family", "Helvetica Neue")
      .style("fill", "white")
      .style("font-size", "16px")
      .html(function(d) {return d; });

    g.selectAll(".tick text").style("font-size", "16px");

}

/***** Select scale to use for x axis; hourly, daily or monthly  ******/
function selectScale(d,i){
    if(dataLength == 12)
        return monthScale(i);
    else if (dataLength == 24)
        return hourScale(i);
    else if (dataLength = 7)
        return weekDayScale(i);
}

/***** Once button is clicked; apply some css & store user's selection ******/
function selectTimeChunk(){
    d3.select(this).attr("transform", buttonClicked? "translate(105,5)" : "translate(100,0)")
        .attr("opacity", buttonClicked? 0.3:1)
        .attr("stroke", buttonClicked? "#A57400":"#ECA400")
        .attr("stroke-width", buttonClicked? 2 : 1);

    chunk = this.__data__;
    loadAvgData(chunk);
}

/***** Mouseover functionality  ******/
function mouseoverBtn(){
    d3.select(this.firstChild)
      .style("fill", "#A57400");
}

/***** Mouseout functionality  ******/
function mouseoutBtn(){
    d3.select(this.firstChild)
      .style("fill", "#ECA400");
}

function addTimeChunkButtons(){
    button_selected = d3.select(".gBarButtons");

    button_g = button_selected.selectAll("g")
                                .data(['hour', 'day', 'month'])
                                .enter()
                                .append("g")
                                .attr("transform", "translate(100,0)")
                                .on("mouseover", mouseoverBtn)
                                .on("mouseout", mouseoutBtn)
                                .on("click", selectTimeChunk);

    button_rects = button_g.append("rect")
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

    button_g.append("foreignObject")
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
            .html(function (d) { return "Show results by " + d; });
}

function showBarInstructions(){
    svgBar.append("g")
          .attr("transform", function(d){
         if (width<=1300) { return  "translate(450, -15)"; }
         else { return  "translate(400, -15)"; }})
          .classed("instructionSet", true)
          .attr("display", "block")
          .append("foreignObject")
          .attr("x", 0)
          .attr("y", 25)
          .attr("height", 70)
          .attr("width", function(d){
                if (width<=1300) { return  width - 420; }
                else { return width - 380; }})
          .append("xhtml:div")
          .style("color", "white")
          .style("margin-left", "auto")
          .style("margin-right", "auto")
          .style("display", "block")
          .style("width", "90%")
          .style("font-size", "28px")
          .style("font-weight", "100")
          .style("font-family", "Helvetica Neue")
          .append("span")
          .html(function () { return "Use buttons to view the graph for average PM2.5 levels by hour of day, day of week or month respectively."; });
}

loadAvgData("hour");


