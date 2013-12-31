'use strict';

describe('Controller: PigCtrl', function () {

  // load the controller's module
  beforeEach(module('planningPokerApp'));

  var PigCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PigCtrl = $controller('PigCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
