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

    var isFirefox = /firefox/i.test(ionic.Platform.ua);

    /**
     * @ngdoc overview
     * @name jwShowcase
     */
    angular
        .module('jwShowcase', [
            'jwShowcase.core',
            'jwShowcase.dashboard',
            'jwShowcase.feed',
            'jwShowcase.search',
            'jwShowcase.video'
        ])
        .value('config', {
            enableContinueWatching: true,
            enableCookieNotice:     false,
            enableFeaturedText:     false
        })
        .decorator('$controller', $controllerDecorator)
        .constant('LIB_VERSION', '3.0.1');

    /**
     * @name jwShowcase.config
     * @type Object
     *
     * @property {string}      player
     * @property {string}      theme
     * @property {string}      siteName
     * @property {string}      description
     * @property {string}      bannerImage
     * @property {string}      footerText
     * @property {string}      backgroundColor
     * @property {boolean}     enableContinueWatching
     * @property {boolean}     enableCookieNotice
     * @property {boolean}     enableFeaturedText
     * @property {string}      searchPlaylist
     * @property {string}      recommendationsPlaylist
     * @property {string}      featuredPlaylist
     * @property {String[]}    playlist
     */

    // make search depth defaulting to 20 instead of 10
    ionic.DomUtil.$getParentOrSelfWithClass = ionic.DomUtil.getParentOrSelfWithClass;
    ionic.DomUtil.getParentOrSelfWithClass = function (elem, className, depth) {
        return ionic.DomUtil.$getParentOrSelfWithClass(elem, className, depth || 20);
    };

    /**
     * Decorate $controller to change the `wheelDampen` in the $ionicScroll controller if the browser is Firefox.
     */
    $controllerDecorator.$inject = ['$delegate'];
    function $controllerDecorator ($delegate) {

        return function (constructor, locals) {

            if (true === isFirefox && '$ionicScroll' === constructor) {
                locals.scrollViewOptions.wheelDampen = 0.08;
            }

            return $delegate.apply(null, arguments);
        };
    }

}());