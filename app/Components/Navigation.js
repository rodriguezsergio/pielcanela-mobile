import React from 'react';
import moment from 'moment';

export default class Navigation extends React.PureComponent {

    constructor (props) {
      super(props);
      this.state = {
        selectedDay: undefined,
      };
    }

    getDateLink (addOrSubtract) {
      if (addOrSubtract === 'add') {
        return '/date/' + moment(this.props.dateString).add(1,'d').format('YYYY-MM-DD');
      }
      return '/date/' + moment(this.props.dateString).subtract(1,'d').format('YYYY-MM-DD');
    }

    handleDayClick = (day) => {
      this.setState({ selectedDay: day });
    }

    render () {
      return (
        <div className="tabs is-fullwidth">
          <ul>
            <li>
              <a href={this.getDateLink('subtract')}>
                <span className="icon"><i className="fa fa-angle-left" aria-hidden="true"></i></span>
              </a>
            </li>
            <li>
              <a onClick={this.props.switchCalendarState}>
                <span>{moment(this.props.dateString).format('YYYY-MM-DD')}</span>
              </a>
            </li>
            <li>
              <a href={this.getDateLink('add')}>
                <span className="icon"><i className="fa fa-angle-right" aria-hidden="true"></i></span>
              </a>
            </li>
          </ul>
        </div>
      );
    }
}
