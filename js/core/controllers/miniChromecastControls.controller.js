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
        .controller('MiniChromecastControlsController', MiniChromecastControlsController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.MiniChromecastControlsController
     *
     * @requires jwShowcase.core.menu
     */
    MiniChromecastControlsController.$inject = ['chromecast', '$rootScope', '$state'];
    function MiniChromecastControlsController (chromecast, $rootScope, $state) {
        var vm = this;

        vm.playButtonHandler = playButtonHandler;
        vm.onClickHandler    = onClickHandler;

        vm.buttonStates = {
            PLAY:      'PLAY',
            PAUSE:     'PAUSE',
            BUFFERING: 'BUFFERING'
        };

        vm.playButtonState = vm.buttonStates.PLAY;
        vm.currentItem     = null;
        vm.percentage      = null;
        vm.visible         = false;

        function playButtonHandler () {
            if (vm.playButtonState === vm.buttonStates.PLAY) {
                chromecast.pause();
            } else {
                chromecast.play();
            }
        }

        function onClickHandler () {
            if (vm.currentItem) {
                $state.go('root.video', {
                    feedId:  vm.currentItem.$feedid || vm.currentItem.feedid,
                    mediaId: vm.currentItem.mediaid
                });
            }
        }

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
            vm.position   = data.position;
            vm.duration   = data.duration;
            vm.percentage = (data.position / data.duration) * 100;
        });

        chromecast.on('playlistItem', function (data) {
            vm.currentItem = data.item;
        });

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                vm.visible = toState.name !== 'root.video' && vm.currentItem;
            }
        );
    }

}());
