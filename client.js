import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './app/Components/Calendar';

render((
  <Router>
    <App
        schedule={window.schedule}
        dateString={window.dateString}
    />
  </Router>
  ),
  document.getElementById('root')
);
