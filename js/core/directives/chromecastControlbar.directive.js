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
        .directive('jwChromecastControlbar', chromecastControlbarDirective);

    chromecastControlbarDirective.$inject = ['chromecast'];
    function chromecastControlbarDirective (chromecast) {

        return {
            scope:        {
                totalTime:   '=',
                currentTime: '='
            },
            restrict:     'E',
            controllerAs: 'vm',
            controller:   angular.noop,
            templateUrl:  'views/core/chromecastControlbar.html',
            transclude:   true,
            replace:      true,
            link:         link
        };

        function link (scope, element) {
            scope.vm.onSliderDrag    = onSliderDrag;
            scope.vm.onSliderRelease = onSliderRelease;

            var playedPercentage  = null,
                updateCurrentTime = true,
                slidedToTime      = null;

            function getControlbarRailOffsetLeft () {
                if (element.length > 0) {
                    var nativeElement = element[0].querySelector(".jw-chromecast-controlbar-rail");

                    if (angular.isElement(nativeElement)) {
                        return angular.element(nativeElement).prop('offsetLeft');
                    }
                }
            }

            function getControlbarRailWidth () {
                if (element.length > 0) {
                    var nativeElement = element[0].querySelector(".jw-chromecast-controlbar-rail");

                    if (angular.isElement(nativeElement)) {
                        return angular.element(nativeElement).prop('offsetWidth');
                    }
                }
            }

            scope.$watch('currentTime', function () {
                if (updateCurrentTime && scope.currentTime && scope.totalTime) {

                    playedPercentage = (scope.currentTime / scope.totalTime) * 100;

                    var progressBarElement = angular.element(element[0].querySelector('.jw-chromecast-controlbar-progress'));
                    var knobElement        = angular.element(element[0].querySelector('.jw-chromecast-controlbar-knob'));

                    if (angular.isElement(progressBarElement) && angular.isElement(knobElement)) {
                        progressBarElement.css('width', playedPercentage + '%');
                        knobElement.css('margin-left', 'calc(' + playedPercentage + '% - 7px)');
                    }
                }
            });

            function onSliderDrag (event) {
                updateCurrentTime = false;

                var fingerPosition   = event.gesture.center.pageX;
                var relativePosition = fingerPosition - getControlbarRailOffsetLeft();
                var percentage       = (relativePosition / getControlbarRailWidth()) * 100;

                percentage < 0 && (percentage = 0);
                percentage > 1000 && (percentage = 100);

                var knobElement = angular.element(element[0].querySelector('.jw-chromecast-controlbar-knob'));
                if (angular.isElement(knobElement)) {
                    knobElement.css('margin-left', 'calc(' + percentage + '% - 7px)');
                }

                slidedToTime = (scope.totalTime * percentage) / 100;
            }

            function onSliderRelease (event) {
                if (slidedToTime) {
                    chromecast.seek(slidedToTime).then(function () {
                        slidedToTime      = null;
                        updateCurrentTime = true;
                    });
                }
            }
        }
    }

}());

