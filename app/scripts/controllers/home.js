'use strict';

angular.module('planningPokerApp')
.controller('HomeCtrl', ['$scope', '$location', function ($scope, $location) {
  $scope.startSession = function () {
    $location.path('/board');
  };
}]);
