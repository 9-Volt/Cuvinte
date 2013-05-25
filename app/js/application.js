$(function () {
  var $cuvinte = $('#cuvinte')
    , app_width = $cuvinte.width()
    , app_height = $cuvinte.height()
    , appSVG = d3.select("#cuvinte")
      .append("svg")
      .attr("width", app_width)
      .attr("height", app_height);

  /*
   * Data section start
   */
  var data = [];

  // Add some random data
  for (var i = 0; i < 15; i++) {
    data.push({
      name: "Narghilea" + i
    , value: ~~(1.0 * Math.random() * ~~(app_height / 3.5) * ~~(app_height / 3.5))
    })
  }

  var date_start_month = 1
    , date_start_year = 2008
    , date_end_month = 5
    , date_end_year = 2013

  /*
   * Data section end
   */

  function addSortedAttributeBy(data, attribute, sort_by) {
    // create sorted array
    _data_sorted = data.slice(0)
    _data_sorted.sort(function (a, b) {
      return (b.value - a.value);
    })

    _data_keys = []
    for(var i in _data_sorted) {
      _data_keys[_data_sorted[i].value] = i
    }

    data.map(function (a) {
      a.index_sorted = +_data_keys[a.value]
      return a;
    })

    return data;
  }

  data = addSortedAttributeBy(data)

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

  var appCircles = appSVG
      .selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("cx", function (d, i) {
          return section_horizontal * (d.index_sorted % 5 + 0.5);
        })
        .attr("cy", function (d, i) {
          return section_vertical * (~~(d.index_sorted / 5) + 0.6);
        })
        .attr("r", 0)
        .style("stroke", "gray")
        .style("fill", "white")
    // Transition
    appCircles
      .transition()
        .duration(1000)
        // .ease("bounce")
        .attr("r", function (d, i) {
          return ((Math.sqrt(d.value) - data_min) / scale_data_to_size + size_min) / 2
        })

  var date_section_space = 0.2 // space between years is of the same width as width of 2 months
    , date_section_margin = 3 // space between years and svg border
    , date_years = date_end_year - date_start_year + 1
    , date_months = (13 - date_start_month) + date_end_month + Math.max(0, (date_end_year - date_start_year - 1) * 12)
    , date_sections = date_months + (date_section_margin * 2) + (date_section_space * (date_years - 1))
    , date_section_width = (app_width / date_sections) // size of one section
    , years = []
    , months = []

    console.log(date_months, date_sections)

  var month_start
    , month_end
    , month_last = 0

  for (var year = date_start_year; year <= date_end_year; year++) {
    month_start = year === date_start_year ? date_start_month : 1
    month_end = year === date_end_year ? date_end_month : 12

    years.push({
      "months": month_end - month_start + 1
    , "year": year
    , "month_start": month_start
    , "month_end": month_end
    , "date_month_start": month_last
    })

    month_last += years[years.length - 1].months

    for (var month = month_start;month <= month_end; month++) {
      months.push({
        "month": month
      , "year": year
      })
    }
  }

  console.log(date_months)

  var appYears = appSVG
      .selectAll("rect")
        .data(years)
      .enter().append("rect")
        .attr("x", function (d, i) {
          return ~~((date_section_margin + d.date_month_start + i * date_section_space) * date_section_width) + 0.5
        })
        .attr("y", function (d, i) {
          return ~~(app_height - section_vertical / 2) + 0.5
        })
        .attr("height", function (d, i) {
          return section_vertical / 6
        })
        .attr("width", function (d, i) {
          return ~~(d.months * date_section_width)
        })
        .style("stroke", "gray")
        .style("fill", "white")
        .on("click", function(d, i) {
          // == Reorder circles ==
          // reset data
          for (var i = 0; i < 15; i++) {
            data[i].value = ~~(1.0 * Math.random() * ~~(app_height / 3.5) * ~~(app_height / 3.5))
          }

          // add sorted indexes
          data = addSortedAttributeBy(data);

          // push data
          appCircles
            .data(data)
          // resize circles
            .transition()
              .duration(1000)
              .attr("r", function (d, i) {
                return ((Math.sqrt(d.value) - data_min) / scale_data_to_size + size_min) / 2
              })
          // move circles
            .transition()
              .delay(1000)
              .duration(1000)
              .attr("cx", function (d, i) {
                return section_horizontal * (d.index_sorted % 5 + 0.5);
              })
              .attr("cy", function (d, i) {
                return section_vertical * (~~(d.index_sorted / 5) + 0.6);
              })

        })

});
