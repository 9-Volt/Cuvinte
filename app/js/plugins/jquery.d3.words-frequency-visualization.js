!function ($) {

  "use strict"; // jshint ;_;


 /* PUBLIC CLASS DEFINITION
  * =============================== */

  var WordsMentions = function (element, options) {
    this.init(element, options)
  }

  WordsMentions.prototype = {

    constructor: WordsMentions

  , init: function (element, options) {
      var that = this

      this.$element = $(element)
      this.options = $.extend({}, $.fn.words_mentions.defaults, this.$element.data(), options)

      this.$graphs = $(this.options.graphs_container_selector).empty()
      // Array of active graphs
      this.graphsActive = []

      // svg data
      this.data = {
        width: this.$element.width()
      , height: this.$element.height()
      }

      // create the svg element
      this.data.svg = d3.select(this.$element[0])
        .append("svg")
        .attr("width", this.data.width)
        .attr("height", this.data.height)

      this.createPattern()

      this.loadData(function (data) {
        that.parseData(data)
        that.populateActiveData()
        that.sortActiveData()
        that.drawCircles()
        that.drawDates()
      })
    }

  , createPattern: function () {
      this.data.svg
        .append("defs")
          .append("pattern")
            .attr("id", "pattern-diagonal")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("preserveAspectRatio", "xMaxYMax slice")
            .attr("width", 2)
            .attr("height", 2)
            .append("image")
              .attr("width", 2)
              .attr("height", 2)
              .attr("opacity", 0.8)
              .attr("xlink:href", this.options.texture)
    }

  , loadData: function (callback) {
      var that = this

      $.ajax({
        url: that.options.data_source
      , type: 'get'
      , typeData: 'json'
      , beforeStart: function () {
        // TODO add an loading animation
      }
      , success: function (data) {
        callback(data)
      }
      , error: function () {
        alert('Sorry, an error occured while loading data for visualization')
      }
      })
    }

  , parseData: function (data) {
      var names = []
        , person

      // Find all names
      // Store names as in array and as keys (whos values are names indexes)
      for(var _year in data) {
        for(var _month in data[_year]) {
          for(var _person in data[_year][_month]) {
            person = data[_year][_month][_person]
            names[person.name] = names.length
            names.push(person.name)
          }
          break
        }
        break
      }

      this.data.names = names

      /*
        Data keeps an array on people (object index is taken fron names)
        Each object has the structure:
        {
          name: 'name'
        , image: 'url'
        , occurences: {
            total: 0      //this is total per person
          , 2008: {
              total: 0    //this is total per year
            , 1: 0        // this is total per month
            , 2: 0
            ...
            , 12: 0
            }
          , 2009: ...
          }
        }
      */

      this.data.people = []
      for(var i = names.length - 1; i >= 0; i--) {
        this.data.people[i] = {
          name: names[i]
        , image: this.options.images[names[i]] !== undefined ? this.options.images[names[i]] : this.options.image_blank
        , occurences: {
            total: 0
          }
        , active: {  // used as active data for drawind and positioning circles
            occurences: 0
          , index_sorted: 0
          }
        }
      }

      var person_index
        , people = this.data.people   // shorthand

      for(var _year in data) {
        for(var _month in data[_year]) {
          for(var _person in data[_year][_month]) {
            person = data[_year][_month][_person]
            person_index = names[person.name]

            // update total data
            people[person_index].occurences.total += person.occurences

            // update year data
            if (people[person_index].occurences[_year] === undefined) {
              people[person_index].occurences[_year] = {total: person.occurences}
            } else {
              people[person_index].occurences[_year].total += person.occurences
            }

            // set month data
            people[person_index].occurences[_year][_month] = person.occurences
          }
        }
      }

      /*
        Parse data for timeline
      */

      this.data.timeline = []

      /* Allocate first names.length array elements
        It is necessary as we will use group.enter() function to populate only overflowind element
      */
      this.data.timeline.length = names.length

      var month_start
        , month_end
        , month_last = 0
        , count_months = 0
        , year_last = 0

      // Find year start and end, month start and end
      for(var _year in data) {
        this.data.year_last = Math.max(this.data.year_last, _year)
        for(var _month in data[_year]) {
          count_months += 1
        }
      }

      var that = this
        , month_width = (this.data.width / count_months) // size of one month
        , timeline_height = ~~(month_width)
        // in-cycle variables
        , _year_start
        , _year_end
        , _year_width
        , _year_start_month

      // Used later to center text
      this.data.timeline_height = timeline_height

      // Push general timeline
      this.data.timeline.push(
        {
          type: "all"
        , text: "TOTAL"
        , x: 1
        , y: that.data.height - (timeline_height + 1) - this.options.text_dates_height * 2 - 2
        , width: this.data.width - 2
        , height: this.options.text_dates_height
        }
      )

      // itterate through years and months
      for(var _year in data) {
        _year = +_year

        month_start = 12
        month_end = 0

        // find start and end months
        for(var _month in data[_year]) {
          month_start = Math.min(month_start, _month)
          month_end = Math.max(month_start, _month)
        }

        // year positions
        _year_start = Math.max(1, ~~(month_last * month_width))
        _year_width = ~~((month_last + (+month_end) - month_start + 1) * month_width) - Math.max(1, ~~(month_last * month_width)) - 1
        _year_end = _year_start + _year_width
        _year_start_month = +month_start

        // set year data
        this.data.timeline.push({
          "type": "year"
        , "year": _year
        , "text": _year
        , x: Math.max(1, ~~(month_last * month_width))
        , y: that.data.height - (timeline_height + 1) - this.options.text_dates_height - 1
        , width: _year_width
        , height: this.options.text_dates_height
        })

        month_last += month_end - month_start + 1

        // itterate through each month
        for(var _month in data[_year]) {
          _month = +_month

          this.data.timeline.push({
            "type": "month"
          , "month": _month
          , "year": _year
          , "text": _month
          , x: ~~(_year_start + (_month - _year_start_month) * month_width)
          , y: that.data.height - (timeline_height + 1)
          })

          // width
          if (_year === year_last && _month === month_end) {
            // Find where year will end and decrease month start
            this.data.timeline[this.data.timeline.length - 1].width = _year_end - ~~(_year_start + (_month - _year_start_month) * month_width)
          } else {
            // Find where next month will start, decrease this value+1 in order to have 1px space
            this.data.timeline[this.data.timeline.length - 1].width = ~~(_year_start + (_month + 1 - _year_start_month) * month_width) - ~~(_year_start + (_month - _year_start_month) * month_width) - 1
          }

        }
      }

    }

    /*
      Accepts an object with keys:
        type: all|year|month
        year: [0-9] (4 digit)
        month: [0-9] (from 1 to 12)

      Empty object is associated with type: all
    */

  , populateActiveData: function (filter) {
      filter = filter || {type: 'all'}

      var _person
        , person

      for (_person in this.data.people) {
        person = this.data.people[_person]

        if (filter.type == 'all') {
          person.active.occurences = person.occurences.total
        } else if (filter.type == 'year') {
          person.active.occurences = person.occurences[filter.year].total
        } else if (filter.type == 'month') {
          person.active.occurences = person.occurences[filter.year][filter.month]
        }
      }

    }

    /*
      Given an array of objects
      Object value in stored by the key active.occurences
      Indexed of the same sorted array are stored in active.index_sorted

      [
        {active: {occurences: 200}}
        {active: {occurences: 150}}
        {active: {occurences: 100}}
      ]

      =>

      [
        {active: {occurences: 200, index_sorted: 2}}
        {active: {occurences: 150, index_sorted: 1}}
        {active: {occurences: 100, index_sorted: 0}}
      ]
    */

  , sortActiveData: function () {
      var _data_sorted = this.data.people.map(function (a) {
        return {name: a.name, occurences: a.active.occurences}
      })
      _data_sorted.sort(function (a, b) {
        return (b.occurences - a.occurences);
      })

      var _data_keys = []
      for (var i in _data_sorted) {
        _data_keys[_data_sorted[i].name] = i
      }

      var person
      for (var _person in this.data.people) {
        person = this.data.people[_person]

        person.active.index_sorted = +_data_keys[person.name]
      }

    }

  , drawCircles: function () {
      var that = this
        , valueFunction = this.options.value_function

      var section_horizontal = ~~(this.data.width / 5.5) // 5 elements per row = 6 spaces
        , section_vertical = ~~(this.data.height / 3.43) // 3 rows of circles, 1 row for time
        , data_max = this.options.value_function(this.data.people.reduce(function (a, b) {
            if (a > b.active.occurences) {
              return a
            } else {
              return b.active.occurences
            }
          }, -1))
        , data_min = this.options.value_function(this.data.people.reduce(function (a, b) {
            if (a >= 0 && a < b.active.occurences) {
              return a
            } else {
              return b.active.occurences
            }
          }, -1))
        , size_max = ~~(section_horizontal * this.options.circle_size_rate.max) // maximal size of circle
        , size_min = ~~(section_horizontal * this.options.circle_size_rate.min) // minimal size of circle
        , scale_data_to_size = (data_max - data_min) / (size_max - size_min) // scale real data to our screen

      this.data.section_horizontal = section_horizontal
      this.data.section_vertical = section_vertical
      this.data.data_max = data_max
      this.data.data_min = data_min
      this.data.size_max = size_max
      this.data.size_min = size_min
      this.data.scale_data_to_size = scale_data_to_size

      this.data.circles_groups = this.data.svg
        .selectAll("g")
          .data(this.data.people)
        .enter().append("g")
          .attr("transform", function (d, i) {
            var x = section_horizontal * ((d.active.index_sorted % 5) + 0.25)
              , y = section_vertical * (~~(d.active.index_sorted / 5) - 0.23);
            return "translate(" + x + ", " + y + ")"
          })

      this.data.circles_text = this.data.circles_groups
        .append("text")
          .text(function (d) {
            return that.options.rounding_function(d.active.occurences)
          })
          .attr("dx", function (d, i) {
            return ~~(section_horizontal / 2)
          })
          .attr("dy", function (d, i) {
            return ~~(section_vertical / 1.55)
          })
          .attr("text-anchor", "middle")
          .attr("font-size", this.options.text_occurences_size)
          .attr("fill", this.options.color_bg_active)
          .attr("opacity", 0)

      this.data.circles = this.data.circles_groups
        .append("circle")
          .attr("cx", function (d, i) {
            this._data = {
              active: false
            }

            return section_horizontal * 0.5;
          })
          .attr("cy", function (d, i) {
            return section_vertical * 0.6;
          })
          .attr("r", function (d, i) {
            return ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2
          })
          .style("stroke", this.options.color_bg_active)
          .style("fill", "none")
          .attr("stroke-width", 0)
          .attr("id", function (d, i) {
            return "circle-" + i;
          })

      // Add images
      this.data.circles_images = this.data.circles_groups
        .append("image")
          .attr("x", function (d, i) {
            return section_horizontal * 0.5;
          })
          .attr("y", function (d, i) {
            return section_vertical * 0.6;
          })
          .attr("width", function (d, i) {
            return 1
          })
          .attr("height", function (d, i) {
            return 1
          })
          .attr("opacity", 1)
          .attr("xlink:href", function (d, i) {
            return d.image;
          })

      // Animate images
      this.data.circles_images
        .transition()
          .delay(500)
          .duration(500)
          .attr("x", function (d, i) {
            return section_horizontal * 0.5 - ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2;
          })
          .attr("y", function (d, i) {
            return section_vertical * 0.6 - ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2;
          })
          .attr("width", function (d, i) {
            return ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min)
          })
          .attr("height", function (d, i) {
            return ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min)
          })

      this.data.circles_masks = this.data.circles_groups
        .append("circle")
          .attr("fill", "url(#pattern-diagonal)")
          .attr("cx", function (d, i) {
            // storing here some data
            this._data = {
              clicked: false
            }

            return section_horizontal * 0.5;
          })
          .attr("cy", function (d, i) {
            return section_vertical * 0.6;
          })
          .attr("r", function (d, i) {
            return ((valueFunction(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2 + 1
          })
          .attr("opacity", 1)

      // Enable circles toggling only after circles' apparition finishes
      setTimeout(function(){
        that.data.circles_masks
          // Events
          .on("mouseover", function (d, i) {
            that.toggleCircle(this, d, i, true, 500)
          })
          .on("mouseout", function (d, i) {
            that.toggleCircle(this, d, i, false, 500)
          })
          .on("click", function (d, i) {
            this._data.clicked = !this._data.clicked
            that.toggleCircle(this, d, i, this._data.clicked, this._data.clicked ? 0 : 500)
            that.toggleGraph(d, this._data.clicked)
          })
      }, 1000)

      this.data.circles_titles = this.data.circles_groups
        .append("text")
          .text(function (d) {
            return d.name
          })
          .attr("dx", function (d, i) {
            return ~~(section_horizontal / 2)
          })
          .attr("dy", function (d, i) {
            return ~~(section_vertical * 1.1)
          })
          .attr("text-anchor", "middle")
          .attr("font-size", this.options.text_names_size)
          .attr("fill", "black")

    }

    /*
      self is an element instance
    */

  , toggleCircle: function (self, d, i, activate, duration) {
      activate = activate || false
      duration = duration || 0
      var that = this

      // Do not deactivate if is clicked
      if (activate === false && self._data.clicked) {
        return
      }

      d3.select(self)
        .transition()
        .duration(duration)
          .attr("opacity", activate ? 0 : 1)

      // Show only necessary number
      this.data.circles_images.each(function (d, _i) {
        if (i == _i) {
          d3.select(this)
            .transition()
            .duration(duration)
            .attr("opacity", activate ? 0 : 1)
        }
      })

      // Show only necessary number
      this.data.circles.each(function (d, _i) {
        if (i == _i) {
          this._data.active = self._data.clicked

          d3.select(this)
            .transition()
            .duration(duration)
            .attr("stroke-width", activate ? that.options.stroke_width : 0)
            .attr("r", ((that.options.value_function(d.active.occurences) - that.data.data_min) / that.data.scale_data_to_size + that.data.size_min) / 2 - (activate ? that.options.stroke_width / 2 : 0))
        }
      })

      // Show only necessary number
      this.data.circles_text.each(function (d, _i) {
        if (i == _i) {
          d3.select(this)
            .transition()
            .duration(duration)
            .attr("opacity", activate ? 1 : 0)
        }
      })
    }

  , reordecCircles: function () {
      var that = this
        , value_function = this.options.value_function
        , section_horizontal = this.data.section_horizontal
        , section_vertical = this.data.section_vertical
        , data_max = this.options.value_function(this.data.people.reduce(function (a, b) {
            if (a > b.active.occurences) {
              return a
            } else {
              return b.active.occurences
            }
          }, -1))
        , data_min = this.options.value_function(this.data.people.reduce(function (a, b) {
            if (a >= 0 && a < b.active.occurences) {
              return a
            } else {
              return b.active.occurences
            }
          }, -1))
        , size_max = ~~(section_horizontal * this.options.circle_size_rate.max) // maximal size of circle
        , size_min = ~~(section_horizontal * this.options.circle_size_rate.min) // minimal size of circle
        , scale_data_to_size = (data_max - data_min) / (size_max - size_min) // scale real data to our screen

      this.data.data_max = data_max
      this.data.data_min = data_min
      this.data.size_max = size_max
      this.data.size_min = size_min
      this.data.scale_data_to_size = scale_data_to_size

      // push data
      this.data.circles_groups
        .data(this.data.people)
      // resize circles
        .select("image")
        .transition()
          .duration(500)
          .attr("x", function (d, i) {
            return section_horizontal * 0.5 - ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2;
          })
          .attr("y", function (d, i) {
            return section_vertical * 0.6 - ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2;
          })
          .attr("width", function (d, i) {
            return ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min)
          })
          .attr("height", function (d, i) {
            return ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min)
          })

      this.data.circles
        .transition()
          .duration(500)
        .attr("r", function (d, i) {
          return ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2 - (this._data.active ? that.options.stroke_width / 2 : 0)
        })

      this.data.circles_masks
        .transition()
          .duration(500)
        .attr("cx", function (d, i) {
          return section_horizontal * 0.5;
        })
        .attr("cy", function (d, i) {
          return section_vertical * 0.6;
        })
        .attr("r", function (d, i) {
          return ((value_function(d.active.occurences) - data_min) / scale_data_to_size + size_min) / 2 + 1
        })

      // move groups
      this.data.circles_groups
        .transition()
          .delay(1000)
          .duration(1000)
          .attr("transform", function (d, i) {
            var x = section_horizontal * ((d.active.index_sorted % 5) + 0.25)
              , y = section_vertical * (~~(d.active.index_sorted / 5) - 0.23);
            return "translate(" + x + ", " + y + ")"
          })

      this.data.circles_text
        .text(function (d) {
          return that.options.rounding_function(d.active.occurences)
        })

    }

  , drawDates: function () {
      var that = this
        , timeline_height = that.data.timeline_height

      /*
        Add dates groups
      */
      var date_groups = this.data.svg
        .selectAll("g")
          .data(this.data.timeline)
        .enter().append("g")
        .attr("transform", function (d) {
          this._data = $.extend({height: timeline_height}, d)

          return "translate(" + this._data.x + ", " + this._data.y + ")"
        })

      function dateChange (self, filter) {
        // == Change active date ==
        date_rectangles
          .transition()
            .duration(500)
            .style("fill", that.options.color_bg)

        d3.select(self.parentNode.childNodes[0])
          .transition()
          .delay(500)
          .duration(500)
          .style("fill", that.options.color_bg_active)

        // == Reorder circles ==

        that.populateActiveData(filter)

        that.sortActiveData()

        that.reordecCircles()
      }

      var date_rectangles = date_groups
        .append("rect")
          .style("stroke-width", 0)
          .style("fill", function (d, i) {
            return d.type === "all" ? that.options.color_bg_active : that.options.color_bg
          })
        // Sizes
          .attr("height", function (d, i) {
            return this.parentNode._data.height
          })
          .attr("width", function (d, i) {
            return this.parentNode._data.width
          })
        // Pozitions
          .attr("x", 0)
          .attr("y", 0)
        // Events
          .on("click", function (d, i) {
            dateChange(this, this.parentNode._data)
          })

      var date_text = date_groups
        .append("text")
          .text(function (d) {
            return d.text
          })
          .attr("dx", function (d, i) {
            return this.parentNode._data.width / 2
          })
          .attr("dy", function (d, i) {
            if (this.parentNode._data.type === 'all' || this.parentNode._data.type === 'year') {
              return that.options.text_dates_height - (that.options.text_dates_height / 4)
            } else if (this.parentNode._data.type === 'month') {
              return Math.round(timeline_height - (timeline_height / 5.5))
            }
          })
          .attr("text-anchor", "middle")
          .attr("font-size", function(d, i){
            if (this.parentNode._data.type === 'all') {
              return that.options.text_total_size
            } else if (this.parentNode._data.type === 'year') {
              return that.options.text_years_size
            } else if (this.parentNode._data.type === 'month') {
              return that.options.text_months_size
            }
          })
          .attr("fill", "white")
        // Events
          .on("click", function (d, i) {
            dateChange(this, this.parentNode._data)
          })

    }

  , toggleGraph: function (d, active) {
      if (active) {
        this.createGraph(d)
      } else {
        this.destroyGraph(d)
      }
    }

  , createGraph: function (d) {
      var that = this

      this.graphsActive.push(d)

      d.$graph = $('<div class="graph"/>').appendTo(this.$graphs)

      // Add graph columns
      for (var _i in this.data.timeline) {
        if (this.data.timeline[_i].type === 'month') {
          $('<div class="graph-column"/>').width(this.data.timeline[_i].width).appendTo(d.$graph)
        }
      }

      // Retrieve all occurences
      var occurences = []
      for (var _year in d.occurences) {
        for (var _month in d.occurences[_year]) {
          if (_month == 'total')
            continue
          occurences.push(d.occurences[_year][_month])
        }
      }

      // Cache occurences into d
      d._occurences = occurences
      // Cache max
      d.occurencesMax = d3.max(occurences)
      // Cache min. Use 0, on need change into d3.min
      d.occurencesMin = 0

      // Get min/max occurences from all active graphs
      var occurence_min = d3.min(this.graphsActive, function(a){return a.occurencesMin})
        , occurence_max = d3.max(this.graphsActive, function(a){return a.occurencesMax})
        // Get scale
        , graph_height = d.$graph.height()
        , scaleY = d3.scale.linear()
          .domain([occurence_min, occurence_max])
          .range([0, graph_height])

      var points = []
      // Cache points into d
      d.points = points

      // Get graph Y points
      for (var _i in occurences) {
        points.push({
          y: graph_height - scaleY(occurences[_i])
        , 'occurences': occurences[_i]
        })
      }

      // Get graph X points
      var _point_counter = 0
      for (var _i in this.data.timeline) {
        if (this.data.timeline[_i].type === 'month') {
          points[_point_counter].x = this.data.timeline[_i].x + this.data.timeline[_i].width / 2
          // Starting and ending point
          points[_point_counter].x1 = this.data.timeline[_i].x
          points[_point_counter].x2 = this.data.timeline[_i].x + this.data.timeline[_i].width
          _point_counter += 1
        }
      }

      // Add svg container
      d.graph = d3.select(d.$graph[0])
        .append("svg")
        .attr("width", this.data.width)
        .attr("height", graph_height)

      // Add image
      d.graph
        .append("image")
          .attr("x", 10)
          .attr("y", 14)
          .attr("width", 100)
          .attr("height", 100)
          .attr("opacity", 1)
          .attr("xlink:href", d.image)

      // Add image overlay
      d.graph
        .append("circle")
          .attr("fill", "url(#pattern-diagonal)")
          .attr("cx", 60)
          .attr("cy", 64)
          .attr("r", 50)
          .attr("opacity", 1)

      // Add path
      d.path = d.graph
        .append("path")
        .attr("d", this.zeroFunction(graph_height)(points))
        .attr("stroke", this.options.graphs_line_color)
        .attr("stroke-width", this.options.graphs_line_width)
        .attr("fill", "none")

      // Add pointer
      d.$graph_pointer = $('<div class="graph-pointer">0</div>').appendTo(d.$graph)

      // Use overlay to hook mouse events
      d.$graph_overlay = $('<div class="graph-overlay"/>').appendTo(d.$graph)

      d.$graph_overlay[0].pointerColumn = 0

      d.$graph_overlay
        .on('mousemove', function(ev){
          // Normalize offset for browsers which do not provide that value
          if (ev.offsetX === undefined || ev.offsetY === undefined) {
            var targetOffset = $(ev.target).offset()
            ev.offsetX = ev.pageX - targetOffset.left
            ev.offsetY = ev.pageY - targetOffset.top
          }

          // Check mouse column
          for (var i = points.length - 1; i >= 0; i--) {
            if (ev.offsetX > points[i].x1 && ev.offsetX < points[i].x2) {
              // If active column is different from hovered now
              if (i !== this.pointerColumn) {
                that.pointersShow(i)
              }
              break;
            }
          };
        })
        .on('mouseout', function(ev){
          that.pointersHide()
        })

      // Update active graphs
      d3.map(this.graphsActive).forEach(function(i, d){
        that.updateGraph(d, occurence_min, occurence_max)
      })
    }

  , zeroFunction: function(height){
      if (height === undefined) height = 0

      return d3.svg.line()
        .x(function(d) {return d.x;})
        .y(function(d) {return height})
        .interpolate("basis")
    }

  , lineFunction: d3.svg.line()
      .x(function(d) {return d.x;})
      .y(function(d) {return d.y;})
      .interpolate("basis")

  , findYatXbyBisection: function(x, path, error, max_height){
      var length_end = path.getTotalLength()
        , length_start = 0
        , point = path.getPointAtLength(Math.round((length_end + length_start) / 2) || 0) // get the middle point
        , bisection_iterations_max = 50
        , bisection_iterations = 0

      error = error || 0.01

      while (x < point.x - error || x > point.x + error) {
        // get the middle point
        point = path.getPointAtLength((length_end + length_start) / 2)

        if (x < point.x) {
          length_end = (length_start + length_end)/2
        } else {
          length_start = (length_start + length_end)/2
        }

        // Increase iteration
        if(bisection_iterations_max < ++ bisection_iterations)
          break;
      }
      return Math.min(Math.abs(point.y), max_height)
    }

  , pointersHide: function(){
      d3.map(this.graphsActive).forEach(function(i, d){
        d.$graph_pointer.css('display', 'none')
        d.$graph_overlay[0].pointerColumn = -1
      })
    }

  , pointersShow: function(column, data){
      var that = this

      d3.map(this.graphsActive).forEach(function(i, d){
        var data = d.points[column]
          , graph_height = d.$graph.height()

        d.$graph_overlay[0].pointerColumn = column

        d.$graph_pointer
          .text(data.occurences)
          .css({
            bottom: graph_height - that.findYatXbyBisection(data.x, d.path[0][0], 0.01, graph_height)
          , left: data.x - (d.$graph_pointer.width()/2) - 4
          , display: 'block'
          })
      })
    }

  , updateGraph: function(d, occurence_min, occurence_max) {
      // Get scale
      var graph_height = d.$graph.height()
        , scaleY = d3.scale.linear()
          .domain([occurence_min, occurence_max])
          .range([0, graph_height])

      // Get graph Y points
      var points = []
      for (var _i in d._occurences) {
        points.push({
          y: graph_height - scaleY(d._occurences[_i])
        , 'occurences': d._occurences[_i]
        })
      }

      // Get graph X points
      var _point_counter = 0
      for (var _i in this.data.timeline) {
        if (this.data.timeline[_i].type === 'month') {
          points[_point_counter].x = this.data.timeline[_i].x + this.data.timeline[_i].width / 2
          // Starting and ending point
          points[_point_counter].x1 = this.data.timeline[_i].x
          points[_point_counter].x2 = this.data.timeline[_i].x + this.data.timeline[_i].width
          _point_counter += 1
        }
      }

      // Update path
      d.path
        .transition()
          .duration(500)
        .attr("d", this.lineFunction(points))
    }

  , destroyGraph: function (d) {
      var that = this

      if (this.graphsActive.indexOf(d) !== -1)
        this.graphsActive.splice(this.graphsActive.indexOf(d), 1)

      d.graph.remove()
      d.$graph.remove()

      // Get min/max occurences from all active graphs
      var occurence_min = d3.min(this.graphsActive, function(a){return a.occurencesMin})
        , occurence_max = d3.max(this.graphsActive, function(a){return a.occurencesMax})

      // Update active graphs
      d3.map(this.graphsActive).forEach(function(i, d){
        that.updateGraph(d, occurence_min, occurence_max)
      })
    }

  }

 /* PLUGIN DEFINITION
  * ========================= */

  $.fn.words_mentions = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('words_mentions')
        , options = typeof option == 'object' && option
      if (!data) $this.data('words_mentions', (data = new WordsMentions(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.words_mentions.Constructor = WordsMentions

  $.fn.words_mentions.defaults = {
    stroke_width: 10
  , color_bg: '#3bbdb5'
  , color_bg_active: '#ef4b48'
  , data_source: 'data/dataset.json'
  , value_function: Math.sqrt
  , circle_size_rate : {
      max: 1.0 / 1.8
    , min: 1.0 / 4
    }
  , images: {}
  , image_blank: 'img/blank.png'
  , texture: 'img/texture.png'
  , text_occurences_size: '24px'
  , text_names_size: '21px'
  , text_total_size: '16px'
  , text_years_size: '16px'
  , text_months_size: '14px'
  , text_dates_height: 18
  , graphs_container_selector: '#words-frequency-graphs'
  , graphs_line_color: '#ef4b48'
  , graphs_line_width: 1.2
  , graph_height: 128
  , rounding_function: function(a) {return a}
  }

}(window.jQuery);
