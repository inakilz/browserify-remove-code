'use strict';

var through = require('through2');
var extname = require('path').extname;

var regexCache = {};

function escapeForRegExp(str) {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getRemovalTagsRegExp(commentStart, commentEnd, key) {
	return new RegExp('(' +
        	escapeForRegExp(commentStart) + '\\s*' + 'removeIf\\(([^\\)]+,\\s?|\\s*)' + key + '(,[^\\)]+|\\s*)\\)' + '\\s*' + escapeForRegExp(commentEnd) + '\\s*' +
        	'(\\n|\\r|.)*?' +
        	escapeForRegExp(commentStart) + '\\s*' + 'endRemoveIf\\(([^\\)]+,\\s?|\\s*)' + key + '(,[^\\)]+|\\s*)\\)' + '\\s*' + escapeForRegExp(commentEnd) + ')',
        	'gi');
}

module.exports = function(file, options) {
	
	options = options || {};
	if (Object.keys(options).length <= 1) {
		options.dev = true;
	}

	var conditions = [],
		commentEnd = '',
		commentStart;       // not set means autodetect

	Object.keys(options).forEach(function(key) {
		if (key === 'commentStart') {
			commentStart = options.commentStart;
		}
		else if (key === 'commentEnd') {
			if (commentStart) {
				// set it only if commentStart is provided
				commentEnd = options.commentEnd;
			}
			else {
				gutil.log(gutil.colors.yellow('gulp-remove-code: commentStart was not set but commentEnd provided. ' +
					'The option will be ignored. commentEnd: ' + commentEnd));
			}
		}
		else if (options[key]) {
			conditions.push(key);
		}
	});

	return through(function (buf, enc, next) {

		var fileExt = extname(file);
		var commentStart = '//';
		var commentEnd = '';

		switch (fileExt) {
			case 'coffee':
				commentStart = '#';
				commentEnd = '';
				break;
			case 'css':
				commentStart = '/*';
				commentEnd = '*/';
				break;
			case 'html':
				commentStart = '<!--';
				commentEnd = '-->';
				break;
			case 'cshtml':
				commentStart = '@*';
				commentEnd = '*@';
				break;
			case 'jade':
				commentStart = '//-';
				commentEnd = '';
				break;
		}

		var contents = buf.toString('utf8');
		if (contents.length > 0) {
			for (var i = 0; i < conditions.length; i++) {
				var key = conditions[i],
				regex = regexCache[file + key];
				if (!regex) {
					regex = regexCache[file + key] = getRemovalTagsRegExp(commentStart, commentEnd, key);
				}
				contents = contents.replace(regex, '');
			}
		}
		this.push(contents);
		next();
	});
	
};
