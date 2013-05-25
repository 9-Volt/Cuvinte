$(function () {
  var $cuvinte = $('#cuvinte')
    , app_width = $cuvinte.width()
    , app_height = $cuvinte.height()
    , appSVG = d3.select("#cuvinte")
      .append("svg")
      .attr("width", app_width)
      .attr("height", app_height);

  // Add some random data
  var data = [];

  for (var i = 0; i < 15; i++) {
    data.push({
      name: "Narghilea"
    , value: ~~(1.0 * Math.random() * ~~(app_height / 3.5) * ~~(app_height / 3.5))
    })
  }

  // sort by size (descending)
  data.sort(function (a, b) {
    return (b.value - a.value);
  })

  var section_horizontal = ~~(app_width / 5) // 5 elements per row = 6 spaces
    , section_vertical = ~~(app_height / 3.5) // 3 rows of circles, 1 row for time
    , data_max = Math.sqrt(data[0].value)
    , data_min = Math.sqrt(data[data.length - 1].value)
    , size_max = ~~(section_horizontal / 1.8) // maximal size of circle
    , size_min = ~~(section_horizontal / 4) // minimal size of circle
    , scale_data_to_size = (data_max - data_min) / (size_max - size_min) // scale real data to our screen

  // TODO remove this
  console.log(size_max, size_min)

  var circles = appSVG
    .selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("cx", function (d, i) {
        return section_horizontal * (i % 5 + 0.5);
      })
      .attr("cy", function (d, i) {
        return section_vertical * (~~(i / 5) + 0.6);

      })
      .attr("r", function (d, i) {
        return ((Math.sqrt(d.value) - data_min) / scale_data_to_size + size_min) / 2
      })
      .style("stroke", "gray")
      .style("fill", "white")

});
