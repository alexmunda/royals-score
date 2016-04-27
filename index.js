'use strict';

const getScore = (linescore, homeTeam) => {
  let homeScore = Number(linescore.home_team_runs);
  let awayScore = Number(linescore.away_team_runs);

  let royalsScore = homeTeam ? homeScore : awayScore;
  let opponentScore = homeTeam ? awayScore : homeScore;

  return {
    royals: royalsScore,
    opponent: opponentScore
  }
}

const getRbiHitters = (batters, royalsHome) => {
  const royals = royalsHome ? "home" : "away";
  const opponent = royalsHome ? "away" : "home";
  
  const royalsRbiHitters = batters
    .filter(bat => bat.team_flag === royals)
    .reduce((prev, curr) => curr, {})
    .batter
    .filter(bat => bat.rbi > 0)
    .map(bat => bat.name_display_first_last);
    
  const opponentRbiHitters = batters
    .filter(bat => bat.team_flag === opponent)
    .reduce((prev, curr) => curr, {})
    .batter
    .filter(bat => bat.rbi > 0)
    .map(bat => bat.name_display_first_last);
    
  return {
    royals: royalsRbiHitters,
    opponent: opponentRbiHitters
  };
}

const getPitchers = (pitchers, royalsHome) => {
  const royals = royalsHome ? "home" : "away";
  const opponent = royalsHome ? "away" : "home";
  
  const royalsPitcher = pitchers
    .filter(pitch => pitch.team_flag === royals)
    .reduce((prev, curr) => curr, {})
    .pitcher
    .filter(pitch => pitch.win == "true" || pitch.loss == "true")
    .map(pitch => pitch.name_display_first_last)
    .reduce((prev, curr) => curr, {});

  const opponentPitcher = pitchers
    .filter(pitch => pitch.team_flag === opponent)
    .reduce((prev, curr) => curr, {})
    .pitcher
    .filter(pitch => pitch.win == "true" || pitch.loss == "true")
    .map(pitch => pitch.name_display_first_last)
    .reduce((prev, curr) => curr, {});
    
    return {
      royals: royalsPitcher,
      opponent: opponentPitcher
    }
}

const getUrlPath = () => {
  const yesterday = new Date();
  yesterday.setMinutes(yesterday.getMinutes() + yesterday.getTimezoneOffset() - 300); 
  yesterday.setDate(yesterday.getDate() - 1);  

  let day = yesterday.getDate();
  day = day > 9 ? day.toString() : `0${day}`;

  let month = yesterday.getMonth() + 1;
  month = month > 9 ? month.toString() : `0${month}`;

  let year = yesterday.getFullYear();

  return `year_${year}/month_${month}/day_${day}/`;
}

exports.handler = (event, context, callback) => {
  const MLBBoxscores = require('mlbboxscores');

  var options = {
    path: getUrlPath()
  };

  var mlbboxscores = new MLBBoxscores(options);

  mlbboxscores.get((err, boxscores) => {
    if (err) {
      console.log('Error: ' + err);
      return callback(err);      
    }

    const KANSAS_CITY = "Kansas City";

    let royalsGame = boxscores.filter(game =>
      game.home_sname === KANSAS_CITY ||
      game.away_sname === KANSAS_CITY
    ).reduce((prev, curr) => curr, {});

    var response = {
      score: null,
      rbiHitters: null,
      pitchers: null
    }

    if (royalsGame === {}) {
      return callback(null, response);
    }

    const homeTeam = royalsGame.home_sname === KANSAS_CITY;

    response.score = getScore(royalsGame.linescore, homeTeam);
    response.rbiHitters = getRbiHitters(royalsGame.batting, homeTeam);
    response.pitchers = getPitchers(royalsGame.pitching, homeTeam);

    return callback(null, response);
  });
};