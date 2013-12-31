'use strict';

angular.module('planningPokerApp')
.controller('BoardCtrl', ['$scope', '$location', 'socket', function ($scope, $location, socket) {
  $scope.state = 'registering';
  $scope.messages = [];

  var _server = 'http://' + $location.$$host + ':' + $location.$$port + '/#',
      _sessionId,
      _state;

  socket.on('connect', function() {
    socket.emit('newSession');
  });

  socket.on('setSession', function(session) {
    _sessionId = session.id;
    $scope.pigUrl = _server + '/pig/' + _sessionId;
  });

  socket.on('setState', function (state) {
    $scope.state = state;

    if (state == 'voting') {
      $scope.membersWhoHaveVoted = [];
    }
  });

  socket.on('updateMembers', function (members) {
    $scope.members = members;
  });

  socket.on('updateMessage', function (message) {
    $scope.messages.push(message);
  });

  socket.on('updateState', function (state) {
    _state = state;
  });

  socket.on('showVotesResult', function (votes) {
    $scope.votes = votes;
    $scope.state = 'showVotesResult';
  });

  socket.on('memberHasVoted', function (member) {
    $scope.membersWhoHaveVoted.push(member);
  });

  $scope.launchPig = function (){
    window.open(_server + '/pig/' + _sessionId ,'_blank');
  };

  $scope.sendLinkByEmail = function () {
    window.open('mailto:' + $scope.emailToSendLink + '?subject=' + _server + '/#/pig/' + _sessionId);
  };
}]);
