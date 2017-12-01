import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';

import renderFullPage from './renderFullPage';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import moment from 'moment';
import Calendar from '../Components/Calendar';

function rethrowIfNotOk (r) {
	if (!r.ok) {
		throw r;
	}
	return r;
}

function getOpeningTime () {
    // Sunday 1:30pm
    // Weekdays 6:30pm
    // Saturday 12:00pm

    let date = moment();
    date.set('second', 0);
    date.set('millisecond', 0);

    switch (date.get('day')) {
        case 0:
            date.set('hour', 13);
            date.set('minute', 30);
            return date;
        case 6:
            date.set('hour', 12);
            date.set('minute', 0);
            return date;
        default:
            date.set('hour', 18);
            date.set('minute', 30);
            return date;
	}
}

function groupByTime (classes) {
    let uniqueStartTimes = [ [ ] ];

    classes.forEach(function(element) {
        let startTime = element['iso8601'];

        let lastArray = uniqueStartTimes[uniqueStartTimes.length - 1];
        if (lastArray.length !== 0){
            if (startTime === lastArray[0]['iso8601']) {
              lastArray.push(element);
            } else {
              uniqueStartTimes.push([]);
              lastArray = uniqueStartTimes[uniqueStartTimes.length - 1];
              lastArray.push(element);
            }
        } else {
            lastArray.push(element);
        }
    });

    uniqueStartTimes.forEach(function(element) {
        if (element.length > 1) {
            element.sort(function (a,b) {
                if (a.class < b.class) {
                    return -1;
                }
                if (a.class > b.class) {
                    return 1;
                }
                return 0;
            });
        }
    });

    return uniqueStartTimes;
}

function renderStaticHtml (req, schedule, dateString) {
    const context = {};

    let calendarList = renderToString(
        <StaticRouter context={context} location={req.url} >
            <Calendar
                schedule={schedule}
                dateString={dateString}
            />
        </StaticRouter>
    );

    return calendarList;
}

export default () => (req, res) => {
    let results = [];

    // build URL
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    let dateString = `${year}-${month + 1}-${day}`;
    let epochTime = new Date(year,month,day).getTime() / 1000;

    console.log('dateString', dateString);
    console.log('epochTime', epochTime);

    // Oct 29, 2017 should return 1,509,249,600
    // Nov 26, 2017 should return 1,511,672,400
    if (typeof req.params.date !== 'undefined') {
        if (req.params.date.length === 10) {
            if (moment(req.params.date, 'YYYY-MM-DD').isValid() === true) {
                let timezoneOffset = new Date().getTimezoneOffset() / 60;
                dateString = req.params.date;

                epochTime = moment(`${req.params.date} 00-0${timezoneOffset}00`).format('X');
            }
        } else {
            console.log('[INFO] Not a valid date.');
        }
    }

    let url = 'http://www.pielcaneladancers.com/classschedule/print?date=' + epochTime;

    fetch(url)
        .then(rethrowIfNotOk)
        .then(function(response) {
            return response.text();
        })
        .then(function(body) {
            let $ = cheerio.load(body);

            // TODO: See about capturing kids' classes as well.
            //       They use the 'schedule_time' class which is
            //       shared with socials.
            //       Socials have their own 'schedule_art' class so
            //       maybe they can be excluded based on having that.

            // TODO: capture '.cancel_big' class
            /*$('.cancel_big')....{
                // class = direct child text element  (not sure cheerio can select this)
                // level = span[0]
                // instructor = span[1]
                // dateRange = span[2]
            }*/

            $('.schedule_dance').each(function(i, elem) {
                let o = {};
                let el = $(this).children('span').toArray();

                let offset = 0;
                $(this).prevAll().each(function(j, sibling) {
                    offset = offset + parseInt($(this).attr('colspan'), 10);
                });

                o['class'] = el[0].children[0].data;
                o['difficulty'] = el[2].children[0].data;
                o['instructor'] = el[3].children[0].data;
                o['dateRange'] = el[4].children[0].data;
                o['room'] = el[5].children[0].data;

                // time-related keys
                o['offset'] = 30 * offset;
                o['duration'] = 30 * parseInt($(this).attr('colspan'), 10);

                let forStartTime = getOpeningTime();
                o['startTime'] = forStartTime.add(o['offset'], 'm');

                let startClone = moment(o['startTime']).format();
                o['iso8601'] = startClone;

                let forEndTime = getOpeningTime();
                o['endTime'] = forEndTime.add((o['offset'] + o['duration']), 'm');

                results.push(o);
			});

            let sortedList = results.sort(function (a,b) {
                return a.startTime.format('X') - b.startTime.format('X');
            });

            groupByTime(sortedList);

            // now render calendar list
            let listView = renderStaticHtml(req, sortedList, dateString);
            res.status(200).send(renderFullPage(listView, sortedList, dateString));
        })
        .catch(function(error) {
            res.end('Request failed. Please proceed to http://www.pielcaneladancers.com/classschedule.', 'utf-8');
            console.log('[ERROR] Request failed: ', error);
        });
};
