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
    .controller('ChromecastControlsController', ChromecastControlsController);

  /**
   * @ngdoc controller
   * @name jwShowcase.core.ChromecastControlsController
   *
   * @requires jwShowcase.core.menu
   */
  ChromecastControlsController.$inject = ['chromecast', '$timeout'];
  function ChromecastControlsController (chromecast, $timeout) {
    var vm = this;

    vm.buttonStates = {
      PLAY: 'PLAY',
      PAUSE: 'PAUSE'
    };

    vm.playButtonState = vm.buttonStates.PLAY;
    vm.playedPercentage = null;
    vm.timeUpdateActive = true;

    var left = null,
        right = null,
        width = null


    vm.playButtonHandler = function () {
      if(vm.playButtonState === vm.buttonStates.PLAY) {
        chromecast.pause();
      } else {
        chromecast.play();
      }
    };

    chromecast.on('play', function() {
      vm.playButtonState = vm.buttonStates.PLAY;
    });

    chromecast.on('pause', function() {
      vm.playButtonState = vm.buttonStates.PAUSE;
    });

    chromecast.on('time', function(data) {
      if(vm.timeUpdateActive) {
        vm.position = data.position;
        vm.duration = data.duration;
        vm.playedPercentage = ((data.position / data.duration) * 100);
      }
    });

    chromecast.once('time', function() {
      measureControllBar();
    });

    function measureControllBar() {
      $timeout(function(){
        left  = angular.element(document.querySelectorAll(".jw-chromecast-controls-rail")[0]).prop('offsetLeft');
        width = angular.element(document.querySelectorAll(".jw-chromecast-controls-rail")[0]).prop('offsetWidth');

        right = left + width;
      });
    }


    vm.onSliderDrag = function(event) {
      vm.timeUpdateActive = false;

      var position = event.gesture.center.pageX;
      var relativePosition = position - left;
      var percentage = (relativePosition/width);

      percentage < 0 && (percentage = 0);
      percentage > 1 && (percentage = 1);

      vm.position = vm.duration * percentage;
      console.log('vm.timeInSeconds: ', vm.position);
      vm.playedPercentage = ((vm.position / vm.duration) * 100);
      chromecast.seek(vm.position);
      vm.timeUpdateActive = true;

    };



  }

}());
