'use strict';

angular.module('planningPokerApp', ['ngRoute', 'ngSocket', 'monospaced.qrcode'])
.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  })
  .when('/board', {
    templateUrl: 'views/board.html',
    controller: 'BoardCtrl'
  })
  .when('/pig/:sessionId', {
    templateUrl: 'views/pig.html',
    controller: 'PigCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });
}]);
