# Words Frequency Visualization

## How to run Grunt

1. Install Nodejs
2. Install [Grunt](http://gruntjs.com/getting-started) `npm install -g grunt-cli`
3. clone repo
4. cd into project folder
5. run command ```npm install```
6. run command ```grunt server``` for live development
7. run command `grunt build` for building styles and concatenating scripts

[A demo](http://9-volt.github.io/Words-Frequency-Visualization/app/) with dummy data.

## JSON data format

JSON object represents a tree with keys: `year -> month -> entity key -> (title & occurences)`

```json
{
"2009": {
  "1": {
    "key1":{"name":"V. Ciobanu","occurences":99},
    "key2":{"name":"L. Ciobanu","occurences":115},
    "key3":{"name":"D. Ungureanu","occurences":2},
    "key4":{"name":"S. Deleanu","occurences":63} 
  },
  "2": {
    "key1":{"name":"V. Ciobanu","occurences":23},
    "key2":{"name":"L. Ciobanu","occurences":53},
    "key3":{"name":"D. Ungureanu","occurences":7},
    "key4":{"name":"S. Deleanu","occurences":34} 
  }
}
```

Each entity should use only one unique key and the same name. Years and months should be consistent (no gaps). Same entities should be used for all months (even if an entity has a 0 occurences value).

## Plugin initialization

To initialize visualization it is enough to load styles, script and run 

```js
$(function () {
  $('#container').words_mentions()
});
```

By default data will be searched at `data/dataset.json` uri. You may change it by passing a configuration object to plugin initialization method:

```js
$(function () {
  $('#container').words_mentions({
    data_source: 'data/dataset.json'
  })
});
```

You may find all default configuration settings at the end of the plugin.

To set entities pictures set `images` configuration value:

```js
$(function () {
  $('#container').words_mentions({
    data_source: 'data/dataset.json',
    images: {
      "V. Ciobanu": 'images/1.jpg',
      "L. Ciobanu": 'images/2.jpg',
      "D. Ungureanu": 'images/3.jpg',
      "S. Deleanu": 'images/4.jpg'
    }
  })
});
```
