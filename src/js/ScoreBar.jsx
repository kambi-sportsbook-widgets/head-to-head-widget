import React from 'react';

const ScoreBar = ({ ourScore, theirScore, maxScore, side }) => {
   const classList = ['kw-bar-score', 'l-flexbox'];

   if (ourScore < theirScore) {
      classList.push('lost-game');
   } else if (ourScore === theirScore) {
      classList.push('drawn-game');
   } else if (ourScore > theirScore) {
      classList.push('won-game');
   }

   return (
      <div data-item-attr={side} className="kw-table-item l-flexbox l-align-center l-flex-1">
         <div className="kw-score l-flexbox l-align-center l-pack-center l-pl-16 l-pr-16">
            {ourScore}
         </div>
         <div className="l-flexbox kw-bar-wrapper l-flex-1 l-pack-end">
            <div
               className={classList.join(' ')}
               style={{ width: `${(ourScore / maxScore * 100)}%` }}
            />
         </div>
      </div>
   );
};

ScoreBar.propTypes = {
   ourScore: React.PropTypes.number.isRequired,
   theirScore: React.PropTypes.number.isRequired,
   maxScore: React.PropTypes.number.isRequired,
   side: React.PropTypes.string.isRequired
};

export default ScoreBar;
