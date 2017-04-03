/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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
        .factory('platform', platform);

    platform.$inject = [];
    function platform () {

        var isTouch = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch),
            parser  = new window.UAParser(),
            result  = parser.getResult(),
            osName  = result.os.name.toLowerCase();

        return {
            prepare:         prepare,
            isTouch:         isTouch,
            isAndroid:       osName === 'android',
            isIOS:           osName === 'ios',
            isWindows:       osName === 'windows',
            browserName:     result.browser.name,
            browserVersion:  result.browser.version,
            platformName:    result.os.name,
            platformVersion: result.os.version
        };

        function prepare () {

            var body   = angular.element(document.body);

            if (true === isTouch) {
                body.addClass('jw-flag-touch');
            }

            if (osName === 'android') {
                var androidVersion = result.os.version.substr(0, result.os.version.indexOf('.'));

                body.addClass('jw-flag-android');
                body.addClass('jw-flag-android-' + androidVersion);
            }

            if (osName === 'ios') {
                body.addClass('jw-flag-ios');
            }
        }
    }

}());
