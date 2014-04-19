'use strict';

module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      less: {
        files: ['src/styles/{,*/}*.less'],
        tasks: ['less:development']
      },
      development: {
        options: {
          nospawn: true
        },
        files: [
          'app/{,*/}*.html',
          'app/{,*/}*.css',
          'app/{,*/,*/*/}*.js',
          'app/{,*/}*.{png,jpg,jpeg,gif}'
        ],
        tasks: []
      }
    },
    less: {
      development: {
        options: {
          paths: ["src/styles"]
        },
        files: [{
          expand: true,
          cwd: 'src/styles',
          src: '*.build.less',
          dest: 'app/css',
          ext: '.css'
        }]
      },
      production: {
        options: {
          paths: ["src/styles"],
          yuicompress: true
        },
        files: [{
          expand: true,
          cwd: 'src/styles',
          src: '*.build.less',
          dest: 'app/css',
          ext: '.css'
        }]
      }
    },
    jshint: {
      // Description for options are here
      options: {
        "laxcomma": false,
        "newcap": false,
        "trailing": true,
        "unused": true,
        "indent": 2,
        "curly": true,
        "undef": true,
        "expr": true,
        "globals": {
          "window": true,
          "jQuery": true,
          "$": true,
          "Raphael": true
        }
      },
      all: ['app/js/*.js']
    },
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */' + "\n",
      },
      build: {
        src: ['app/js/vendor/*', 'app/js/plugins/*'],
        dest: 'app/js/build/jquery.d3.wfv.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Tasks definitions
  grunt.registerTask('watchWithLiveReload', [
    'livereload-start',
    'watch'
  ]);

  grunt.registerTask('server', [
    'less:development',
    'watchWithLiveReload'
  ]);

  grunt.registerTask('build', [
    'less:production',
    'concat'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'build'
  ]);

};
