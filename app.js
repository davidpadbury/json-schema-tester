var express = require('express'),
	app;

app = express.createServer();

app.configure(function() {
	app.use(express.static(__dirname + '/public'));	
});

app.listen(process.env.PORT || 8080);
