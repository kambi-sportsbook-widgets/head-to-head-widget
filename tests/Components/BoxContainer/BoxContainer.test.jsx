/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import BoxContainer from '../../../src/js/Components/BoxContainer/BoxContainer';

let renderer;

describe('BoxContainer.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
   });

   it('renders correctly with no children', () => {
      expect(renderer.render(
         <BoxContainer/>
      )).toMatchSnapshot();
   });

   it('renders correctly with children', () => {
      expect(renderer.render(
         <BoxContainer>
            <div />
            <div />
         </BoxContainer>
      )).toMatchSnapshot();
   });

});
