# Archived Code

### Feb 1 2021 Update
Because of COVID-19, the source website this small application relied upon is no longer available.

Piel Canela Mobile Calendar
===========================

This was an exercise to better understand how to build out a simple isomorphic app. The data originates from a dance school's schedule page where the details for each class is scraped, parsed, and sorted before sending it off to the client. On the client side, it is a straight-forward React app that uses the Google Calendar API to create recurring events.

#### Configuration Variables
If you want to run this yourself on Heroku, you will need to:
- get an OAuth 2.0 Client ID from the Google Developer Console
- set `NPM_CONFIG_PRODUCTION` to false
- set `TZ` to `America/New_York`

#### Demo
https://pielcanela.herokuapp.com

#### Data Source
http://www.pielcaneladancers.com/classschedule
