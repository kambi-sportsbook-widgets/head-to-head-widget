/* eslint-env jest */
import React from 'react';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import { mount } from 'enzyme';
import HeadToHeadWidget from '../../src/js/Components/HeadToHeadWidget';
import { widgetModule } from 'kambi-widget-core-library';

let renderer;

jest.mock('kambi-widget-core-library', () => ({
   widgetModule: {
      adaptWidgetHeight: jest.fn()
   },
   translationModule: {
      getTranslation: jest.fn((key) => `Translated ${key}`)
   }
}));

const mockEvent0 = {
   homeParticipant: 'Poland',
   homeScore: 3,
   awayParticipant: 'Sweden',
   awayScore: 0,
   start: new Date('2017-05-05').toISOString()
};

const mockEvent1 = {
   homeParticipant: 'Montenegro',
   homeScore: 1,
   awayParticipant: 'Serbia',
   awayScore: 0,
   start: new Date('2017-05-04').toISOString()
};

describe('HeadToHeadWidget.render()', () => {

   beforeEach(() => {
      renderer = new ReactShallowRenderer();
      widgetModule.adaptWidgetHeight.mockClear();
   });

   it('renders correctly', () => {
      expect(renderer.render(
         <HeadToHeadWidget events={[{lastEvents: [mockEvent0, mockEvent1]}]} />
      )).toMatchSnapshot();
   });

});

describe('HeadToHeadWidget lifecycle methods', () => {

   beforeEach(() => {
      widgetModule.adaptWidgetHeight.mockClear();
   });

   it('initializes correctly', () => {
      expect(widgetModule.adaptWidgetHeight).not.toHaveBeenCalled();

      const wrapper = mount(
         <HeadToHeadWidget events={[]} />
      );

      expect(widgetModule.adaptWidgetHeight).toHaveBeenCalledTimes(1);
   });

   it('updates correctly', () => {
      const wrapper = mount(
         <HeadToHeadWidget events={[]} />
      );

      widgetModule.adaptWidgetHeight.mockClear();

      wrapper.setProps({events: []});

      expect(widgetModule.adaptWidgetHeight).toHaveBeenCalledTimes(1);
   });

});
