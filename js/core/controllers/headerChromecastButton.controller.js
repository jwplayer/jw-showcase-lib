/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

  angular
    .module('jwShowcase.core')
    .controller('HeaderChromecastButtonController', HeaderChromecastButtonController);

  /**
   * @ngdoc controller
   * @name jwShowcase.core.HeaderChromecastButtonController
   *
   * @requires jwShowcase.core.menu
   */
  HeaderChromecastButtonController.$inject = ['$interval', '$rootScope', 'chromecast', '$scope', '$timeout'];
  function HeaderChromecastButtonController ($interval, $rootScope, chromecast, $scope, $timeout) {
    var vm = this;

    vm.states = {
      UNAVAILABLE: 'UNAVAILABLE',
      AVAILABLE: 'AVAILABLE',
      CONNECTING: 'CONNECTING',
      CONNECTED: 'CONNECTED'
    };

    vm.state = this.states.UNAVAILABLE;

    vm.chromecastButtonClickHandler = chromecastButtonClickHandler;

    // Event listeners
    $rootScope.$on('chromecast:unavailable', function (event) {
      $timeout(function () {
       vm.state = vm.states.UNAVAILABLE;
      });
    });

    $rootScope.$on('chromecast:available', function (event) {
      $timeout(function () {
       vm.state = vm.states.AVAILABLE;
      });
    });

    $rootScope.$on('chromecast:connecting', function (event) {
      $timeout(function () {
       vm.state = vm.states.CONNECTING;
      });
    });

    $rootScope.$on('chromecast:connected', function (event) {
      $timeout(function () {
       vm.state = vm.states.CONNECTED;
      });
    });

    function chromecastButtonClickHandler () {
      if(vm.state === vm.states.AVAILABLE || vm.state === vm.states.CONNECTING) {
        chromecast.connect();
      } else {
        chromecast.disconnect();
      }
    }
  }

}());
