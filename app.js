
var app = require('./server').default(__dirname);

app.disable('x-powered-by');
app.listen(process.env.PORT || 5650, function () {
	console.log(new Date().toISOString() + ' [INFO] ' + 'App listening on ' + (process.env.PORT || 5650));
});
