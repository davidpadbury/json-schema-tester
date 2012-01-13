(function() {

	var schemaUriPathExp = /#(.*)$/;

	function chill(fn, period) {
		var waiting = false,
			intervalId;
		
		return function() {
			if (waiting) return;

			waiting = true;
			setTimeout(function() {
				fn();
				waiting = false;
			}, period);
		};
	}

	function debounce(fn, period) {
		var timeoutId;

		return function() {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(fn, period);
		};
	}

	$(function() {
		var schemaEl = $('#schema'),
			dataEl = $('#data'),
			errorsEl = $('#errors'),
			bodyEl = $('body'),
			schemaEditor, dataEditor,
			schemaEditorSession, dataEditorSession,
			chilledValidate;

		function resize() {
			var width = bodyEl.width(),
				editorWidth = width / 2;

			schemaEl.css({
				'width': editorWidth
			});

			dataEl.css({
				'width': editorWidth
			});

			schemaEditor.resize();
			dataEditor.resize();
		}

		function createJsonEditor(el) {
			var editor = ace.edit(el[0]),
				JsonMode = require('ace/mode/json').Mode;

			editor.setTheme('ace/theme/vibrant_ink');
			editor.getSession().setMode(new JsonMode());

			return editor;
		}

		function showErrors(errors) {
			var ul = $('<ul>');

			errors.forEach(function(error) {
				$('<li>').text(error).appendTo(ul);
			});

			errorsEl.children().remove();
			errorsEl.append(ul);

			errorsEl.removeClass('pass').removeClass('fail')
				.addClass(errors.length ? 'fail' : 'pass');
		}

		function validate() {
			var env = JSV.createEnvironment("json-schema-draft-03"),
				schemaText = schemaEditorSession.getValue(),
				dataText = dataEditorSession.getValue(),
				schema, data, report;

			try {
				schema = JSON.parse(schemaText);
			}
			catch (parseErr) {
				showErrors([
					'Unable to parse schema: ' + parseErr.message
				]);
				return;
			}
			
			try {
				data = JSON.parse(dataText);
			} catch (parseErr) {
				showErrors([
					'Unable to parse data: ' + parseErr.message
				]);
				return;
			}

			report = env.validate(data, schema);

			showErrors(report.errors.map(function(error) {
				var path = schemaUriPathExp.exec(error.schemaUri)[1];

				return error.message + (path ? ' (' + path + ')' : '');
			}));

			console.log(report);
		}

		schemaEditor = createJsonEditor(schemaEl);
		dataEditor = createJsonEditor(dataEl);
		schemaEditorSession = schemaEditor.getSession();
		dataEditorSession = dataEditor.getSession();

		chilledValidate = debounce(validate, 500);

		schemaEditorSession.on('change', chilledValidate);
		dataEditorSession.on('change', chilledValidate);

		resize();

		$(window).on('resize', chill(resize, 25));
	});

})();