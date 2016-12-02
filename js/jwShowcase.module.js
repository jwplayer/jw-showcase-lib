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
            enableContinueWatching: true
        })
        .constant('LIB_VERSION', '3.0.0-rc.1');

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

}());