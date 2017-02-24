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
            PLAY:      'PLAY',
            PAUSE:     'PAUSE',
            BUFFERING: 'BUFFERING'
        };

        vm.playButtonState = vm.buttonStates.PLAY;

        vm.playButtonHandler = function () {
            if (vm.playButtonState === vm.buttonStates.PLAY) {
                chromecast.pause();
            } else {
                chromecast.play();
            }
        };

        chromecast.on('play', function () {
            vm.playButtonState = vm.buttonStates.PLAY;
        });

        chromecast.on('pause', function () {
            vm.playButtonState = vm.buttonStates.PAUSE;
        });

        chromecast.on('buffering', function () {
            vm.playButtonState = vm.buttonStates.BUFFERING;
        });

        chromecast.on('time', function (data) {
            vm.position = data.position;
            vm.duration = data.duration;
        });
    }

}());
