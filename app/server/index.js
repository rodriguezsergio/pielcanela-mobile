import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';

import renderFullPage from './renderFullPage';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import Calendar from '../Components/Calendar';

function rethrowIfNotOk (r) {
	if (!r.ok) {
		throw r;
	}
	return r;
}

function getOpeningTime (epochTime, $) {
    let date = moment.unix(epochTime).tz('America/New_York');

    let time = $('.Time_left').first().text();
    let ampm = $('.AM_PM').first().text();
    let hour = moment(time+ampm,'h:mmA').hour();
    let minute = moment(time+ampm,'h:mmA').minute();

    date.set('hour', hour).set('minute', minute);
    return date;
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
    let dateString = moment().format('YYYY-MM-DD');
    let epochTime = moment(dateString).tz('America/New_York').unix();

    // Oct 29, 2017 should return 1,509,249,600
    if (typeof req.params.date !== 'undefined') {
        if (req.params.date.length === 10) {
            if (moment(req.params.date, 'YYYY-MM-DD').isValid() === true) {
                dateString = req.params.date;
                epochTime = moment.tz(req.params.date, 'America/New_York').format('X');
            }
        } else {
            console.log('[INFO] Not a valid date.');
        }
    }

    console.log('dateString', dateString);
    console.log('epochTime', epochTime);

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

                let startTime = getOpeningTime(epochTime, $).add(o['offset'], 'm');
                let endTime = getOpeningTime(epochTime, $).add((o['offset'] + o['duration']), 'm');
                o['iso8601'] = moment(startTime).format();

                // date-related keys for event creation
                let startDay = o['dateRange'].split('-')[0].trim();
                let startHour = startTime.hour();
                let startMinute = startTime.minute();

                let endDay = o['dateRange'].split('-')[1].trim();
                let endHour = endTime.hour();
                let endMinute = endTime.minute();

                o['firstDayStart'] = moment.tz(startDay, 'MMM DD, YYYY', 'America/New_York').set('hour', startHour).set('minute', startMinute).format();
                o['firstDayEnd'] = moment.tz(startDay, 'MMM DD, YYYY', 'America/New_York').set('hour', endHour).set('minute', endMinute).format();

                // recurrence 'until' date
                o['endDate'] = moment(endDay, 'MMM DD, YYYY');

                results.push(o);
			});

            let sortedList = results.sort(function (a,b) {
                return moment(a.firstDayStart).tz('America/New_York').format('HHmm') - moment(b.firstDayStart).tz('America/New_York').format('HHmm');
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
