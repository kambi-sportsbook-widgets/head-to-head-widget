/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import EventInfoContainer from '../../../../src/js/Components/EventInfo/EventInfoContainer/EventInfoContainer';

let renderer;

describe('EventInfoContainer.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
   });

   it('renders correctly with children', () => {
      expect(renderer.render(
         <EventInfoContainer>
            <div />
            <div />
         </EventInfoContainer>
      )).toMatchSnapshot();
   });

});
