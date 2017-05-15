/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import ScoreIndicator from '../../../../src/js/Components/EventInfo/ScoreIndicator/ScoreIndicator';

let renderer;

describe('ScoreIndicator.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
   });

   it('renders correctly with score', () => {
      expect(renderer.render(
         <ScoreIndicator score={100} />
      )).toMatchSnapshot();
   });

});
