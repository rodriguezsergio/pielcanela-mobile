import React from 'react';
import moment from 'moment-timezone';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

import Navigation from './Navigation';
import './styles.css';

const CLIENT_ID = process.env.CLIENT_ID;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export default class Calendar extends React.PureComponent {

    constructor (props) {
      super(props);
      this.state = {
        selectedDay: moment(this.props.dateString).toDate(),
        calendarIsHidden: true,
        showAuthPrompt: false,
        showCalendarIcon: false,
        displayModal: false,
        modalText: '',
        modalUrl: ''
      };
    }

    componentDidMount(){
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      document.body.appendChild(script);

      script.onload = () => {
          window.gapi.load('client:auth2', this.initClient);
      };
    }

    updateSigninStatus = (isSignedIn) => {
      if (isSignedIn) {
        this.setState({
          showAuthPrompt: false,
          showCalendarIcon: true
        });
      } else {
        this.setState({
          showAuthPrompt: true,
          showCalendarIcon: false
        });
      }
    }

    initClient = () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
        this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      }.bind(this));
    }

    handleAuthClick() {
      gapi.auth2.getAuthInstance().signIn();
    }

    createEvent = (classObject) => {
      let endDate = moment(classObject['endDate']).add(2, 'd').format('YYYYMMDD');

      var calendarEvent = {
        'summary': `${classObject['class']} ${classObject['difficulty']}`,
        'location': 'Piel Canela New York Latin Dance and Music School, 500 8th Ave, New York, NY 10018, USA',
        'description': `${classObject['class']} ${classObject['difficulty']} ${classObject['instructor']}` +
          '\nCreated by the mobile-friendly Piel Canela web page (unaffiliated).',
        'start': {
          'dateTime': moment(classObject['firstDayStart']).tz('America/New_York').format(),
          'timeZone': 'America/New_York'
        },
        'end': {
          'dateTime': moment(classObject['firstDayEnd']).tz('America/New_York').format(),
          'timeZone': 'America/New_York'
        },
        'recurrence': [
          `RRULE:FREQ=WEEKLY;UNTIL=${endDate}`
        ],
        'reminders': {
          'useDefault': true
        }
      };

      var request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': calendarEvent
      });

      request.execute(function(event) {
        this.toggleModal(event.htmlLink, classObject);
      }.bind(this));
    }

    handleDayClick = (date, { selected }) => {
      let dateString = moment(date.toISOString()).format('YYYY-MM-DD');
      window.location = `/date/${dateString}`;

      this.setState({
        selectedDay: selected ? undefined : date,
      });
    }

    switchCalendarState = () => {
      this.setState({
        calendarIsHidden: !this.state.calendarIsHidden
      });
    }

    formatClassRoom (room) {
      let splitText = room.split('Class Room :');

      if (room.toLowerCase().includes('no class room')) {
        return splitText[1].trim();
      }
      return 'Room ' + splitText[1].trim();
    }

    getDisplayTime (start, end) {
        let startFormatted = moment(start).tz('America/New_York').format('h:mm');
        let endFormatted = moment(end).tz('America/New_York').format(' - h:mm A');

        return startFormatted + endFormatted;
    }

    allClassesCancelled () {
      return (
        <div className={'column ' }>
            <div className='box'>
              <div className='notification'>
                <h1 className='subtitle centerText'>
                  No Class Data To Show
                </h1>
              </div>
            </div>
        </div>
      );
    }

    createClassObjects () {
      let floatRight = { 'float': 'right' };

      let classObjects = this.props.schedule.map((classObject, i) => (
          <div key={i} className={'classDetails column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd'}>
              <div className='box'>
                <div className='media'>
                  <div className='media-content'>
                    <ul>
                        <li>
                            <strong>{classObject['class']} </strong><small>{classObject['difficulty']}</small>
                        </li>

                        <li>
                            <small>{classObject['instructor']}</small>
                        </li>

                        <li>
                            <small>{this.formatClassRoom(classObject['room'])}</small>
                        </li>

                        <li>
                            <small>{this.getDisplayTime(classObject['firstDayStart'], classObject['firstDayEnd'])}</small>
                        </li>

                        <li>
                          <small>{classObject['dateRange']}</small>
                          {this.state.showCalendarIcon === true &&
                            <a style={floatRight} onClick={() => this.createEvent(classObject)}>
                              <span className='icon'>
                                <i className='fa fa-calendar-plus-o'></i>
                              </span>
                            </a>
                          }
                        </li>
                    </ul>
                  </div>
                </div>
              </div>
          </div>
      ));

      return classObjects;
    }

    toggleModal = (url='', classObject='') => {
      let modalText = typeof classObject === 'object' ? `${classObject['class']} ${classObject['difficulty']}` : '';

      this.setState({
        displayModal: !this.state.displayModal,
        modalText: modalText,
        modalUrl: url
      });
    }

    render () {
        const modifiers = {
          sundays: { daysOfWeek: [0] },
          saturdays: { daysOfWeek: [6] }
        };

        const modifiersStyles = {
          sundays: {
            color: '#B5B5B5',
          },
          saturdays: {
            color: '#B5B5B5'
          }
        };

        const paddingOverride = {
          'padding': '1rem 1rem'
        };

        let schedule;
        if (this.props.schedule.length === 0) {
          schedule = this.allClassesCancelled();
        } else {
          schedule = this.createClassObjects();
        }

        let authButton =
            <a className='button is-link centerElement' onClick={this.handleAuthClick}>
              <span className='icon'>
                <i className='fa fa-sign-in'></i>
              </span>
              <span>Authorize Access To Google Calendar</span>
            </a>;

        let activeModal = this.state.displayModal ? 'is-active' : '';

        return (
          <div className='section' style={paddingOverride}>

            <div className={'modal ' + activeModal}>
              <div className='modal-background'></div>
              <div className='modal-content'>
                <div className='box'>
                  <div className='notification is-link centerText'>
                    Event created for <a href={this.state.modalUrl} target='_blank'>{this.state.modalText}</a>
                  </div>
                </div>
              </div>
              <button onClick={this.toggleModal} className='modal-close is-large' aria-label='close'></button>
            </div>

            <div className='container is-fluid'>
              <Navigation
                dateString={this.props.dateString}
                switchCalendarState={this.switchCalendarState}
              />

              {this.state.showAuthPrompt === true &&
                <div className='visible topBottomMargins'>
                  {authButton}
                </div>
              }

              <div className={this.state.calendarIsHidden ? 'hidden' : 'visible'}>
                <DayPicker
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  month={this.state.selectedDay}
                  onDayClick={this.handleDayClick}
                  selectedDays={this.state.selectedDay}
                  className='centerElement'
                />
              </div>

              <div className={'columns is-multiline is-variable is-1'}>
                {schedule}
              </div>

            </div>
          </div>);
    }
}
