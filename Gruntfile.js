module.exports = function(grunt) {
    grunt.initConfig({
        //pkg: grunt.file.readJSON('package.json'),


//        emberTemplates: {
//            compile: {
//                options: {
//                    amd: "vendor/ember",
//                    templateBasePath: /portal\/templates\/handlebars\//
//                },
//                files: {
//                    "portal/static/js/dist/templates.js": ["portal/templates/handlebars/*.handlebars"]
//                }
//            }
//        },

        uglify: {
            options: {
              //compress: true
            },
            dist: {
                files: {
                  'portal/static/js/dist/handlebars.min.js': ['portal/static/js/dist/handlebars-v1.3.0.js'],
                  'portal/static/js/dist/portal.min.js': ['portal/static/js/dist/portal.js'],
                  'portal/static/js/dist/templates.min.js': ['portal/static/js/dist/templates.js']
                }
            }
        },

        concat: {
          options: {
            separator: ';'
          },
          ember_app: {
            src: ['portal/static/js/app/**/*.js'],
            dest: 'portal/static/js/dist/portal.js'
          },
          vendor: {
            src: ['node_modules/bootstrap/dist/js/**/*.min.js'],
            dest: 'portal/static/js/dist/vendor.js'
          }
        },

        copy: {
            main: {
                files: [
                    {
                        src: ['node_modules/bootstrap/dist/css/*.min.css', ],
                        dest: 'portal/static/css/',
                        expand: true,
                        flatten: true
                    },
                    {
                        src: ['node_modules/jquery/dist/*.min.*', ],
                        dest: 'portal/static/js/dist/',
                        expand: true,
                        flatten: true
                    }
                ]
            }
        },

        watch: {
//            emberTemplates: {
//                files: ['portal/templates/handlebars/*.handlebars'],
//                tasks: ['emberTemplates', 'concat', 'uglify']
//            },
            concat: {
                files: ['portal/static/js/app/**/*.js'],
                tasks: ['concat', 'uglify']
            }
            //    ,
            //cssmin: {
            //    files: ['schedule/static/css/app.css'],
            //    tasks: ['cssmin']
            //}
        }
    });


    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ember-templates');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['watch']);
}


