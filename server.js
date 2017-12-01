import 'babel-regenerator-runtime';
import express from 'express';
import { execSync } from 'child_process';

import bodyParser from 'body-parser';

import pielcanela from './app/server';
import api from './app/server/api';

export default function createApp (dirname) {
	console.log('starting app');

	var app = express();

	app.use(bodyParser.urlencoded({
		type: 'application/x-www-form-urlencoded',
		extended: true,
		limit: '10mb'
	}));

	app.use(bodyParser.json({
		type: 'application/json'
	}));

	app.use('/assets', express.static(dirname + '/'));

	app.get('/', pielcanela());
	app.get('/date/:date', pielcanela());

	app.get('/api', api());
	return app;
}
