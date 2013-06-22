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
            .attr("preserveAspectRatio", "slice")
            .attr("width", 2)
            .attr("height", 2)
            .append("image")
              .attr("width", 2)
              .attr("height", 2)
              .attr("opacity", 0.8)
              .attr("xlink:href", "images/texture.png")
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
        alert('Sorry, an error occured while loading data for visualisation')
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
      for(var i = names.length; i >= 0; i--) {
        this.data.people[i] = {
          name: names[i]
        , image: ''
        , occurences: {
            total: 0
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

      // Push general timeline
      this.data.timeline.push(
        {
          type: "timeline"
        , text: "TOTAL"
        }
      )

      var month_start
        , month_end
        , month_last = 0

      this.data.year_start = 9999
      this.data.year_end = 0
      this.data.month_first = 0
      this.data.month_last = 0

      // itterate through years and months
      for(var _year in data) {
        this.data.year_start = Math.min(this.data.year_start, _year)
        this.data.year_end = Math.max(this.data.year_end, _year)

        month_start = 12
        month_end = 0

        // find start and end months
        for(var _month in data[_year]) {
          month_start = Math.min(month_start, _month)
          month_end = Math.max(month_start, _month)
        }

        // set year data
        this.data.timeline.push({
          "type": "year"
        , "months": month_end - month_start + 1
        , "year":+_year
        , "month_start": +month_start
        , "month_end": +month_end
        , "date_month_start": month_last
        , "text": _year
        })

        month_last += month_end - month_start + 1

        // itterate through each month
        for(var _month in data[_year]) {
          this.data.year_start == _year && this.data.month_first == 0 && (this.data.month_first = +_month)
          this.data.year_end == _year && (this.data.month_last = +_month)

          this.data.timeline.push({
            "type": "month"
          , "month": +_month
          , "year": +_year
          , "is_last": false
          , "text": _month
          })
        }
        this.data.timeline[this.data.timeline.length - 1].is_last = true
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
      filter = filter || {}
    }

  , drawCircles: function () {
      // body...
    }

  , drawDates: function () {
      var that = this
        , count_years = this.data.year_end - this.data.year_start + 1
        , count_months = (13 - this.data.month_first) + this.data.month_last + Math.max(0, (this.data.year_end - this.data.year_start - 1) * 12)
        , month_width = (this.data.width / count_months) // size of one month
        , timeline_height = ~~(month_width)
        // in-cycle variables
        , _year_start
        , _year_end
        , _year_width
        , _year_start_month

      /*
        Add dates groups
      */
      var date_groups = this.data.svg
        .selectAll("g")
          .data(this.data.timeline)
        .enter().append("g")
        .attr("transform", function (d, i) {
          this._data = {
            x: 0
          , y: 0
          , width: 0
          , height: timeline_height
          }

          if (d.type === "timeline") {
            // x
            this._data.x = 1

            // y
            this._data.y = that.data.height - (timeline_height + 1) * 3

            // width
            this._data.width = that.data.width - 2
          } else if (d.type === "year") {
            // Implies that months are comming right after years
            // year positions
            _year_start = Math.max(1, ~~(d.date_month_start * month_width))
            _year_width = ~~((d.date_month_start + d.months) * month_width) - Math.max(1, ~~(d.date_month_start * month_width)) - 1
            _year_end = _year_start + _year_width
            _year_start_month = d.month_start

            // x
            this._data.x = Math.max(1, ~~(d.date_month_start * month_width))

            // y
            this._data.y = that.data.height - (timeline_height + 1) * 2

            // width
            this._data.width = _year_width
          } else if (d.type === "month") {
            // x
            this._data.x = ~~(_year_start + (d.month - _year_start_month) * month_width)

            // y
            this._data.y = that.data.height - (timeline_height + 1)

            // width
            if (d.is_last) {
              // Find where year will end and decrease month start
              this._data.width = _year_end - ~~(_year_start + (d.month - _year_start_month) * month_width)
            } else {
              // Find where next month will start, decrease this value+1 in order to have 1px space
              this._data.width = ~~(_year_start + (d.month + 1 - _year_start_month) * month_width) - ~~(_year_start + (d.month - _year_start_month) * month_width) - 1
            }
          }

          return "translate(" + this._data.x + ", " + this._data.y + ")"
        })

      function dateChange (self) {
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

        // data = refilData(data, d.type);

        // reorderGroups.call(this, d, i)
      }

      var date_rectangles = date_groups
        .append("rect")
          .style("stroke-width", 0)
          .style("fill", function (d, i) {
            return d.type === "timeline" ? that.options.color_bg_active : that.options.color_bg
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
            dateChange(this)
          })

      var data_text = date_groups
        .append("text")
          .text(function (d) {
            return d.text
          })
          .attr("dx", function (d, i) {
            return this.parentNode._data.width / 2
          })
          .attr("dy", function (d, i) {
            return timeline_height + 1 - (timeline_height / 4)
          })
          .attr("text-anchor", "middle")
          .attr("font-size", '14px')
          .attr("fill", "white")
        // Events
          .on("click", function (d, i) {
            dateChange(this)
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
  }

}(window.jQuery);
