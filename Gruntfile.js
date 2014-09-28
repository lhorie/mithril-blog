module.exports = function(grunt) {

	grunt.initConfig({
		md2html: {
			blog: {
				options: {layout: "layout/layout.html"},
				files: [{cwd: "articles", src: ["*.md"], dest: "./", expand: true, ext: ".html"}]
			},
			rss: {
				options: {layout: "layout/rss.xml"},
				files: [{src: ["articles/a-spreadsheet-in-60-lines-of-javascript.md"], dest: "feed.xml"}]
			}
		}
	});
	
	grunt.loadNpmTasks("grunt-md2html");
	
	grunt.registerTask("default", ["md2html"]);

};
