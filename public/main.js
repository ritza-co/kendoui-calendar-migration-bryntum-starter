import { Calendar } from './calendar.module.js';

const calendar = new Calendar({
  appendTo: 'calendar',
  // Start life looking at this date
  date: new Date('2024/9/9 08:00 AM'),
  startDate: new Date('2024/9/9 08:00 AM'),
  endDate: new Date('2024/9/9 08:00 PM'),
  // A block of configs which is applied to all modes.
  modeDefaults: null,
  // 'day', 'week', 'month', etc.
  mode: 'week',
  timeZone: 'UTC',
  crudManager: {
    loadUrl: '/api/load',
    autoLoad: true,
    syncUrl: '/api/sync',
    autoSync: true,
    // This config enables response validation and dumping of found errors to the browser console.
    // It's meant to be used as a development stage helper only so please set it to false for production systems.
    validateResponse: true,
  },
  // Features named by the properties are included.
  // An object is used to configure the feature.
  features: {
    eventTooltip: {
      // Configuration options are passed on to the tooltip instance
      // We want the tooltip's left edge aligned to the right edge of the event if possible.
      align: 'l-r',
    },
  },
  tbar: {
    items: {
      nonWorkingDays: {
        type: 'button',
        text: 'Hide non-working days',
        ref: 'hideNonWorkingDaysBtn',
        color: 'b-gray',
        icon: 'b-fa b-fa-square',
        pressedIcon: 'b-fa b-fa-check-square',
        toggleable: true,
        pressed: false,
        weight: 600,
        style: 'margin-right: 1rem;',
        onToggle({ pressed }) {
          if (pressed) {
            calendar.hideNonWorkingDays = true;
          } else {
            calendar.hideNonWorkingDays = false;
          }
        },
      },
    },
  },
  sidebar: {
    items: {
      datePicker: {
        // highlight the selected cell's week row
        highlightSelectedWeek: true,
      },
    },
    bbar: [
      // Button to toggle working time on/off
      {
        type: 'button',
        text: 'Use working time',
        ref: 'workingTimeBtn',
        color: 'b-gray',
        icon: 'b-fa b-fa-square',
        pressedIcon: 'b-fa b-fa-check-square',
        toggleable: true,
        pressed: false,
        style: 'margin-bottom: .5em',
        onToggle({ pressed }) {
          if (pressed) {
            calendar.modeDefaults.dayStartTime = 8;
            calendar.modeDefaults.dayEndTime = 17;
          } else {
            calendar.modeDefaults.dayStartTime = 1;
            calendar.modeDefaults.dayEndTime = 24;
          }
        },
      },
    ],
  },
});
