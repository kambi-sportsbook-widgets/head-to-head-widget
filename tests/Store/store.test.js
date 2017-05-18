import store from '../../src/js/Store/store';
import { statisticsModule } from 'kambi-widget-core-library';

jest.mock('kambi-widget-core-library', () => ({
   coreLibrary: {
      pageInfo: {
         pageParam: 0xfaff
      }
   },
   statisticsModule: {
      getHeadToHeadStatistics: jest.fn()
   }
}));

const mockStatistics = {
   homeParticipant: {
      participantName: 'Poland'
   },
   awayParticipant: {
      participantName: 'Sweden'
   },
   lastEvents: []
};

const mockEvent = {
   start: 100,
   homeParticipant: { participantName: 'Poland' },
   awayParticipant: { participantName: 'Sweden' },
   scores: [
      { homeScore: 1, awayScore: 0, type: 'TYPE_A' }
   ]
};

const mockEventSwapped = {
   start: 101,
   homeParticipant: { participantName: 'Sweden' },
   awayParticipant: { participantName: 'Poland' },
   scores: [
      { homeScore: 0, awayScore: 1, type: 'TYPE_A' }
   ]
};

const mockEventWithMissingAwayScore = {
   start: 102,
   homeParticipant: { participantName: 'Poland' },
   awayParticipant: { participantName: 'Sweden' },
   scores: [
      { homeScore: 1, type: 'TYPE_A' }
   ]
};

const mockEventWithMissingHomeScore = {
   start: 102,
   homeParticipant: { participantName: 'Poland' },
   awayParticipant: { participantName: 'Sweden' },
   scores: [
      { awayScore: 0, type: 'TYPE_A' }
   ]
};

describe('store.getEventStatistics()', () => {

   afterEach(() => {
      statisticsModule.getHeadToHeadStatistics.mockClear();
   });

   it('reads eventId from pageParam', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(mockStatistics, { eventId }))));

      return store.getEventStatistics()
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

   it('reads eventId from arguments', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(mockStatistics, { eventId }))));

      return store.getEventStatistics(1001)
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

   it('returns proper statistics', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(
            mockStatistics,
            { eventId },
            { lastEvents: [mockEvent] }
         ))));

      return store.getEventStatistics(1002)
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

   it('swaps teams to match home/away order', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(
            mockStatistics,
            { eventId },
            { lastEvents: [mockEventSwapped] }
         ))));

      return store.getEventStatistics(1003)
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

   it('does not include scores with missing home score', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(
            mockStatistics,
            { eventId },
            { lastEvents: [mockEventWithMissingHomeScore] }
         ))));

      return store.getEventStatistics(1004)
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

   it('does not include scores with missing away score', () => {
      statisticsModule.getHeadToHeadStatistics = jest.fn(eventId =>
         new Promise(resolve => resolve(Object.assign(
            mockStatistics,
            { eventId },
            { lastEvents: [mockEventWithMissingAwayScore] }
         ))));

      return store.getEventStatistics(1005)
         .then((result) => {
            expect(result).toMatchSnapshot();
            expect(statisticsModule.getHeadToHeadStatistics).toHaveBeenCalledTimes(1);
         });
   });

});
