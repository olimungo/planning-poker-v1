/* global $:true */
'use strict';

angular.module('planningPokerApp')
.controller('PigCtrl', ['$scope', 'socket', '$routeParams', function ($scope, socket, $routeParams) {
  $scope.state = 'registering';
  $scope.messages = [];
  $scope.amITheScrumMaster = 'maybe';

  // TODO: create a directive
  //var Switchery = require('switchery');
  var elem = document.querySelector('.switchery');
  new Switchery(elem);

  // TODO: this is a hack, couldn't find a way to do it properly
  $('input+.switchery').click(function () {
    if ($scope.amITheScrumMaster === 'maybe') {
      socket.emit('iAmScrumMaster');
    }
    else if ($scope.amITheScrumMaster === 'yes') {
      socket.emit('iAmNotScrumMasterAnymore');
      $scope.amITheScrumMaster = 'maybe';
    }
  });

  socket.on('connect', function(){
    socket.emit('addMember', $routeParams.sessionId);
  });

  socket.on('setState', function (state) {
    $scope.state = state;
  });

  socket.on('setMember', function (member, scrumMaster) {
    $scope.member = member;

    if (scrumMaster !== null) {
      $scope.amITheScrumMaster = 'no';
    }
  });

  socket.on('updateMembers', function (members) {
    $scope.members = members;
  });

  socket.on('updateMessage', function (message) {
    $scope.messages.push(message);
  });

  socket.on('enableScrumMaster', function () {
    $scope.amITheScrumMaster = 'yes';
  });

  socket.on('disableScrumMaster', function () {
    $scope.amITheScrumMaster = 'no';
  });

  socket.on('scrumMasterUnknown', function () {
    $scope.amITheScrumMaster = 'maybe';
  });

  socket.on('setStory', function (storyNumber) {
    $scope.storyNumber = storyNumber;
  });

  $scope.rename = function () {
    socket.emit('renameMember', $scope.member.name);
  };

  $scope.stateToExplaining = function () {
    socket.emit('stateToExplaining');
  };

  $scope.stateToVote = function (sameStoryVoteAgain) {
    socket.emit('stateToVote', sameStoryVoteAgain);
  };

  $scope.stateToEnd = function () {
    socket.emit('stateToEnd');
  };

  $scope.vote = function (rate) {
    socket.emit('vote', rate);
  };
}]);
