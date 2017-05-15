/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import EventInfo from '../../../src/js/Components/EventInfo/EventInfo';

let renderer;

describe('EventInfo.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
   });

   it('renders correctly with required props', () => {
      expect(renderer.render(
         <EventInfo
            homeName="Poland"
            homeScore={3}
            awayName="Sweden"
            awayScore={1}
            start={new Date('2017-05-05').getTime()}
         />
      )).toMatchSnapshot();
   });

});
