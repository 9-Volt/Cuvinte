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
      this.options = $.extend({}, $.fn.words_mentions.defaults, this.$element.data(), options)
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
    animation: true
  }

}(window.jQuery);
