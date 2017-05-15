/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import Header from '../../../src/js/Components/Header/Header';

let renderer;

describe('Header.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
   });

   it('renders correctly with title', () => {
      expect(renderer.render(
         <Header title="test title" />
      )).toMatchSnapshot();
   });

});
