'use strict';

var app = require('express')(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
uuid = require('node-uuid');

io.enable('browser client minification');

server.listen(8080);

app.get('/*', function (req, res) {
  res.sendfile(__dirname + '/app/' + req.params);
});

var sessions = [];

function _getSession (sessionId) {
  var session;

  var l = sessions.length;
  for (var i=0; i < l; i++) {
    var currentSession = sessions[i];

    if (currentSession.id === sessionId) {
      session = currentSession;
      break;
    }
  }

  return session;
}

io.sockets.on('connection', function (socket) {
  socket.on('newSession', function () {
    var session = {};

    session.state = 'registering';

    session.id = uuid.v1();
    session.members = [];
    session.count = 0;
    session.stories = [];
    session.currentStoryNumber = 0;

    sessions.push(session);

    socket.session = session;

    socket.join(socket.session.id);

    socket.emit('setSession', socket.session);
  });

  socket.on('addMember', function (sessionId) {
    var session = _getSession(sessionId),
    member = {};

    if (session !== undefined) {
      session.count++;

      member.id = uuid.v1();
      member.name = 'Pig' + session.count;

      session.members.push(member);

      socket.session = session;
      socket.member = member;

      socket.join(socket.session.id);

      socket.emit('setMember', socket.member, socket.session.scrumMaster);
      socket.emit('updateMessage', 'You have connected.');
      socket.broadcast.to(socket.session.id).emit('updateMessage', socket.member.name + ' has connected');
      io.sockets.in(socket.session.id).emit('updateMembers', socket.session.members);
      io.sockets.in(socket.session.id).emit('setState', socket.session.state);
    }
  });

  socket.on('renameMember', function (name) {
    var oldMemberName = socket.member.name;
    socket.member.name = name;

    socket.emit('updateMessage', 'Your name has been renamed to ' + socket.member.name);
    socket.broadcast.to(socket.session.id).emit('updateMessage', oldMemberName + ' has been renamed to ' + socket.member.name);
    io.sockets.in(socket.session.id).emit('updateMembers', socket.session.members);
  });

  socket.on('iAmScrumMaster', function () {
    if (socket.session.scrumMaster === undefined) {
      socket.session.scrumMaster = socket.member;

      socket.emit('enableScrumMaster');
      socket.emit('updateMessage', 'You\'re the Scrum Master');

      socket.broadcast.to(socket.session.id).emit('disableScrumMaster');
      socket.broadcast.to(socket.session.id).emit('updateMessage', socket.member.name + ' is the Scrum Master');
    }
  });

  socket.on('iAmNotScrumMasterAnymore', function () {
    socket.session.scrumMaster = undefined;

    socket.emit('updateMessage', 'You\'re not the Scrum Master anymore');

    socket.broadcast.to(socket.session.id).emit('scrumMasterUnknown');
    socket.broadcast.to(socket.session.id).emit('updateMessage', socket.member.name + ' is not the Scrum Master anymore');
  });

  socket.on('stateToExplaining', function () {
    socket.session.state = 'explaining';

    socket.session.currentStoryNumber++;
    var story = { number: socket.session.currentStoryNumber, votes: [] };

    socket.session.stories.push(story);

    io.sockets.in(socket.session.id).emit('setState', socket.session.state);
    io.sockets.in(socket.session.id).emit('setStory', socket.session.currentStoryNumber);
  });

  socket.on('stateToVote', function (sameStoryVoteAgain) {
    socket.session.state = 'voting';

    var l = socket.session.members.length;
    for (var i=0; i < l; i++) {
      var member = socket.session.members[i];
      member.hasVoted = false;
    }

    if (sameStoryVoteAgain) {
      socket.session.stories.votes = [];
    }

    io.sockets.in(socket.session.id).emit('setState', socket.session.state);
  });

  socket.on('stateToEnd', function () {
    socket.session.state = 'end';
    io.sockets.in(socket.session.id).emit('setState', socket.session.state);
  });

  socket.on('vote', function (rate) {
    socket.member.hasVoted = true;

    var vote = { member: socket.member, rate: rate };
    socket.session.stories[socket.session.currentStoryNumber-1].votes.push(vote);

    var allHaveVoted = true;

    var l = socket.session.members.length;
    for (var i=0; i < l; i++) {
      var member = socket.session.members[i];
      if (!member.hasVoted) {
        allHaveVoted = false;
        break;
      }
    }

    io.sockets.in(socket.session.id).emit('memberHasVoted', socket.member);

    if (allHaveVoted) {
      socket.session.state = 'discussing';
      io.sockets.in(socket.session.id).emit('setState', socket.session.state);
      io.sockets.in(socket.session.id).emit('showVotesResult', socket.session.stories[socket.session.currentStoryNumber-1].votes);
    }
    else {
      socket.emit(socket.session.id).emit('setState', 'waitingEndOfVotes');
    }
  });

  socket.on('disconnect', function (){
    if (socket.member !== undefined) {
      var l = socket.session.members.length;
      for (var i=0; i < l; i++) {
        var member = socket.session.members[i];

        if (member.id === socket.member.id) { 
          socket.session.members.splice(i, 1);

          io.sockets.in(socket.session.id).emit('updateMembers', socket.session.members);
          socket.broadcast.to(socket.session.id).emit('updateMessage', socket.member.name + ' has disconnected');

          break;
        }
      }
    }
    else if (socket.session !== undefined) {
      io.sockets.in(socket.session.id).emit('updateMessage', 'The main board has been closed. You will be disconnected');

      var sockets = io.sockets.clients(socket.session.id);
      var l = sockets.length;
      for (var i=0; i < l; i++) {
        var currentSocket = sockets[i];

        currentSocket.leave(currentSocket.session.id);
      }

      var l = sessions.length;
      for (var i=0; i < l; i++) {
        var session = sessions[i];

        if (session.id === socket.session.id) {
          sessions.splice(i, 1);
          break;
        }
      }
    }
  });
});