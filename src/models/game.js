const Player = require('./player.js');
const Coin = require('./coin.js');

const generateCoins = function() {
  let index = 0;
  let homeId = -1;
  let coins = [];
  for(let count=0;count<16;count++,index++,homeId--){
    let coinId = index%4+1;
    coins.push(new Coin(coinId,homeId));
  }
  return coins;
};

class Game {
  constructor(name, ColorDistributor) {
    this.name = name;
    this.players = [];
    this.status = {};
    this.numberOfPlayers = 4;
    this.colorDistributor = new ColorDistributor();
    this.coins = generateCoins();
  }
  getCoins(color){
    let coins = this.coins.splice(0,4);
    return coins.map(function(coin){
      coin.setColor(color);
      return coin;
    });
  }
  getStatus() {
    return this.status;
  }
  hasEnoughPlayers() {
    return this.numberOfPlayers <= this.players.length;
  }
  neededPlayers() {
    return this.numberOfPlayers - this.players.length;
  }
  getDetails() {
    return {
      name: this.name,
      remain: this.neededPlayers(),
      createdBy: this.players[0].name,
    };
  }
  doesPlayerExist(playerName) {
    return this.players.some((player) => player.name == playerName);
  }
  addPlayer(playerName) {
    if (!this.doesPlayerExist(playerName) && !this.hasEnoughPlayers()) {
      let playerColor = this.colorDistributor.getColor();
      let coins = this.getCoins(playerColor);
      let player = new Player(playerName, playerColor,coins);
      this.players.push(player);
      this.setStatus();
      return true;
    }
    return false;
  }
  getPlayer(playerName) {
    let player = this.players.find(player => player.name == playerName);
    let playerIndex = this.players.indexOf(player);
    return this.players[playerIndex];
  }
  removePlayer(playerName) {
    let player = this.players.find(player => player.name == playerName);
    let playerIndex = this.players.indexOf(player);
    this.players.splice(playerIndex, 1);
    this.setStatus();
  }
  getBoardStatus() {
    let players= this.players.reduce(function(boardStatus, player) {
      boardStatus[player.getColor()] = player.getName();
      return boardStatus;
    }, {});
    return players;
  }
  getNoOfPlayers() {
    return this.players.length;
  }
  setStatus() {
    this.status.players = this.players.map(player => player.getStatus());
  }
}
module.exports = Game;
