const assert = require('chai').assert;
const request = require('supertest');
const path = require('path');
const app = require(path.resolve('app.js'));
const GamesManager = require(path.resolve('src/models/gamesManager.js'));
const CustomFs = require(path.resolve('src/customFs.js'));

let doesNotHaveCookies = (res)=>{
  const keys = Object.keys(res.headers);
  let key = keys.find(currentKey=>currentKey.match(/set-cookie/i));
  if(key){
    throw new Error(`Didnot expect Set-Cookie in header of ${keys}`);
  }
};
let board = [
  "<div class='greenHome'><h1 class='playerName'>{{{GREEN}}}</h1>",
  "<div class='yellowHome'><h1 class='playerName'>{{{YELLOW}}}</h1>",
  "<div class='redHome'><h1 class='playerName'>{{{RED}}}</h1>",
  "<div class='blueHome'><h1 class='playerName'>{{{BLUE}}}</h1>"
].join();

const ColorDistributer = function() {
  this.colors = ['red','green','blue','yellow'];
}
ColorDistributer.prototype = {
  getColor:function() {
    return this.colors.shift();
  }
}
describe('#App', () => {
  beforeEach(function(){
    let fs = new CustomFs();
    fs.addFile('./public/board.html',board);
    app.initialize(new GamesManager(new ColorDistributer()),fs);
  });
  describe('GET /', () => {
    it('should serve index page', done => {
      request(app)
        .get('/')
        .expect(200)
        .expect(/createGame/)
        .expect(/joinGame/)
        .end(done);
    });
  });
  describe('GET getAvailableGames', () => {
    it('should give all available games', done => {
      request(app)
        .get('/getAvailableGames')
        .expect(200)
        .expect('[]')
        .end(done);
    });
  });
  describe('POST /createGame', () => {
    it('should set gameName and playerName in cookie', (done) => {
      request(app)
        .post('/createGame')
        .send('gameName=newGame&playerName=dhana')
        .expect(200)
        .expect('set-cookie','gameName=newGame,playerName=dhana')
        .expect(JSON.stringify({gameCreated:true}))
        .end(done);
    });
    it('should not create game', (done) => {
      let gamesManager = new GamesManager();
      gamesManager.addGame('newGame');
      app.initialize(gamesManager);
      request(app)
        .post('/createGame')
        .send('gameName=newGame&playerName=dhana')
        .expect(200)
        .expect(JSON.stringify(
          {
            gameCreated:false,
            message:'game name already taken'
          }))
        .expect(doesNotHaveCookies)
        .end(done);
    });
    it('should simply end the response if request body is not correctly formatted',function(done){
      request(app)
        .post('/createGame')
        .send('gamme=newGame&plaame=dhana')
        .expect(400)
        .expect(doesNotHaveCookies)
        .end(done);
    });
    it('should redirect to waiting if user has already a game',function(done){
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .post('/createGame')
        .set('Cookie',['gameName=newGame','playerName=lala'])
        .send('gameName=bad&playerName=dhana')
        .expect(200)
        .expect(/gameCreated/)
        .expect(/true/)
        .end(done);
    });
  });
  describe('GET /gameName', () => {
    it('should send gameName', (done) => {
      request(app)
        .get('/gameName')
        .set('Cookie','gameName=ludo')
        .expect(200)
        .end(done);
    });
  });
  describe('GET /gameName', () => {
    it('should send gameName', (done) => {
      request(app)
        .get('/gameName')
        .set('Cookie','gameName=ludo')
        .expect(200)
        .end(done);
    });
  });
  describe('GET /userName', () => {
    it('should send userName', (done) => {
      request(app)
        .get('/userName')
        .set('Cookie','playerName=player')
        .expect("player")
        .expect(200)
        .end(done);
    });
  });
  describe('DELETE /player', () => {
    it('should delete Player and game if all the players left', (done) => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('ludo');
      let game= gamesManager.getGame('ludo');
      game.addPlayer('player');
      app.initialize(gamesManager);
      request(app)
        .delete('/player')
        .set('Cookie',['playerName=player;','gameName=ludo;'])
        .expect(200)
        .expect('set-cookie',`playerName=; Expires=${new Date(1).toUTCString()},gameName=; Expires=${new Date(1).toUTCString()}`)
        .end(done);
    });
    it('should delete Player if a player lefts', (done) => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('ludo');
      let game= gamesManager.getGame('ludo');
      game.addPlayer('player1');
      game.addPlayer('player2');
      game.addPlayer('player3');
      app.initialize(gamesManager);
      request(app)
        .delete('/player')
        .set('Cookie',['playerName=player;','gameName=ludo;'])
        .expect(200)
        .expect('set-cookie',`playerName=; Expires=${new Date(1).toUTCString()}`)
        .end(done);
    });
  });
  describe('get /getStatus', () => {
    it('should send gameStatus', (done) => {
      let gamesManager = new GamesManager();
      gamesManager.addGame('ludo');
      app.initialize(gamesManager);
      request(app)
        .get('/getStatus')
        .set('Cookie','gameName=ludo')
        .expect(200)
        .end(done);
    });
    it('should send empty response', (done) => {
      let gamesManager = new GamesManager();
      gamesManager.addGame('ludo');
      app.initialize(gamesManager);
      request(app)
        .get('/getStatus')
        .expect("")
        .expect(200)
        .end(done);
    });

  });
  describe('get /game/boardStatus', () => {
    beforeEach(function(){
      let gamesManager = new GamesManager(new ColorDistributer());
      let game = gamesManager.addGame('newGame');
      game.addPlayer('ashish');
      game.addPlayer('joy');
      app.initialize(gamesManager);
    });

    it('should give board status', (done) => {
      request(app)
        .get('/game/boardStatus')
        .set('Cookie',['gameName=newGame','playerName=ashish'])
        .expect(200)
        .expect(JSON.stringify({'red':'ashish','green':'joy'}))
        .end(done);
    });
    it('should redirect index  ', (done) => {
      request(app)
        .get('/game/boardStatus')
        .expect('Location','/index')
        .end(done);
    });
    it('should response with bad request if game not exists',function(done){
      request(app)
        .get('/game/boardStatus')
        .set('Cookie',['gameName=badGame','playerName=badPlayer'])
        .expect(400)
        .end(done);
    });
  });
  describe('POST /joinGame', () => {
    beforeEach(function(){
      app.gamesManager.addGame('newGame');
      app.gamesManager.addPlayerTo('newGame','lala');

    })
    it('should return joiningStatus as true', done => {
      request(app)
        .post('/joinGame')
        .send('gameName=newGame&playerName=ram')
        .expect(/status/)
        .expect(/true/)
        .end(done)
    });
    it('should return joining Status as false', done => {
      request(app)
        .post('/joinGame')
        .send('gameName=newGame')
        .expect(/status/)
        .expect(/false/)
        .end(done)
    });

    it('should return status false for bad request', done => {
      request(app)
        .post('/joinGame')
        .send('gameName=&playerName=')
        .expect(400)
        .expect(/status/)
        .expect(/false/)
        .end(done)
    });
  });
  describe('GET /game/board', () => {
    beforeEach(function(){
      let gamesManager = new GamesManager(new ColorDistributer());
      let game = gamesManager.addGame('ludo');
      game.addPlayer('ashish');
      game.addPlayer('arvind');
      game.addPlayer('debu');
      game.addPlayer('ravinder');
      let fs = new CustomFs();
      fs.addFile('./public/board.html',board);
      app.initialize(gamesManager,fs);
    })
    it('should give the game board with player names ', (done) => {
      request(app)
        .get('/game/board')
        .set('Cookie',['gameName=ludo','playerName=ashish'])
        .expect(200)
        .expect(/ashish/)
        .expect(/ravinder/)
        .end(done)
    });
    it('should response with bad request if game does not exists', (done) => {
      request(app)
        .get('/game/board')
        .set('Cookie',['gameName=cludo','playerName=ashish'])
        .expect(400)
        .end(done)
    });
    it('should response with bad request if player is registered', (done) => {
      request(app)
        .get('/game/board')
        .set('Cookie',['gameName=ludo','playerName=unknown'])
        .expect(400)
        .end(done)
    });
  });
  describe('#GET /index.html', () => {
    it('should redirect to waiting page if valid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/index.html')
        .set('Cookie',['gameName=newGame','playerName=lala'])
        .expect(302)
        .expect('Location','/waiting.html')
        .end(done);
    });
    it('should serve index page if invalid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/index.html')
        .set('Cookie',['gameName=badGame','playerName=badUser'])
        .expect(200)
        .end(done);
    });
  });
  describe('#GET /joining.html', () => {
    it('should redirect to waiting page if valid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/joining.html')
        .set('Cookie',['gameName=newGame','playerName=lala'])
        .expect(302)
        .expect('Location','/waiting.html')
        .end(done);
    });
    it('should serve joining page if invalid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/joining.html')
        .set('Cookie',['gameName=badGame','playerName=badUser'])
        .expect(200)
        .end(done);
    });
  });
  describe('#GET /', () => {
    it('should redirect to waiting page if valid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/')
        .set('Cookie',['gameName=newGame','playerName=lala'])
        .expect(302)
        .expect('Location','/waiting.html')
        .end(done);
    });
    it('should serve index page if invalid cookies are present', done => {
      let gamesManager = new GamesManager(new ColorDistributer());
      gamesManager.addGame('newGame');
      gamesManager.addPlayerTo('newGame','lala');
      app.initialize(gamesManager);
      request(app)
        .get('/')
        .set('Cookie',['gameName=badGame','playerName=badUser'])
        .expect(200)
        .end(done);
    });
  });
});
