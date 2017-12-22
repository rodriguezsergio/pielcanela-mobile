import React from 'react';
import moment from 'moment';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

import Navigation from './Navigation';
import './styles.css';

export default class Calendar extends React.PureComponent {

    constructor (props) {
      super(props);
      this.state = {
        selectedDay: moment(this.props.dateString).toDate(),
        calendarIsHidden: true
      };
    }

    formatClassRoom (room) {
      let splitText = room.split('Class Room :');

      if (room.toLowerCase().includes('no class room')) {
        return splitText[1].trim();
      }
      return 'Room ' + splitText[1].trim();
    }

    getDisplayTime (start, end) {
        let startFormatted = moment(start).format('h:mm');
        let endFormatted = moment(end).format(' - h:mm A');

        return startFormatted + endFormatted;
    }

    allClassesCancelled () {
      let centerText = {
        'textAlign': 'center'
      };

      return (
        <div className={'column ' }>
            <div className='box'>
              <div className="notification">
                <h1 style={centerText} className='subtitle'>
                  No Class Data To Show
                </h1>
              </div>
            </div>
        </div>
      );
    }

    createClassObjects () {
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
                            <small>{this.getDisplayTime(classObject['startTime'], classObject['endTime'])}</small>
                        </li>

                        <li>
                            <small>{classObject['dateRange']}</small>
                        </li>

                    </ul>
                  </div>
                </div>
              </div>
          </div>
      ));

      return classObjects;
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

        let scheduleItems;
        if (this.props.schedule.length === 0) {
          scheduleItems = this.allClassesCancelled();
        } else {
          scheduleItems = this.createClassObjects();
        }

        let calendarClass = this.state.calendarIsHidden ? 'calendarHidden' : 'calendarVisible';

        return (
          <div className='section' style={paddingOverride}>
            <div className='container is-fluid'>
              <Navigation
                dateString={this.props.dateString}
                switchCalendarState={this.switchCalendarState}
              />

              <div className={calendarClass}>
                <DayPicker
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  month={this.state.selectedDay}
                  onDayClick={this.handleDayClick}
                  selectedDays={this.state.selectedDay}
                  className='centerCalendar'
                />
              </div>

              <div className={'columns is-multiline is-variable is-1'}>
                {scheduleItems}
              </div>
            </div>
          </div>);
    }
}
